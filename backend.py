from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain.vectorstores import FAISS
from langchain.embeddings.huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from typing import List
from pydantic import BaseModel
import os
import logging
from PyPDF2 import PdfReader
from docx import Document as DocxDocument
from pptx import Presentation
import requests

# Configurazione logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Inizializzazione dell'app FastAPI
app = FastAPI()

# Configurazione CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Percorsi per salvare file e database
UPLOAD_FOLDER = "./uploads"
DB_FOLDER = "./db"

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DB_FOLDER, exist_ok=True)

# Configurazione del server LLM locale
LLM_SERVER_URL = "http://localhost:1234/v1/chat/completions"  # Modifica se necessario

# Caricamento embeddings e database FAISS
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
try:
    db_path = "./db/my_database"
    faiss_index = FAISS.load_local(db_path, embeddings)
    logger.info(f"Database FAISS caricato da {db_path}")
except Exception as e:
    logger.error(f"Errore nel caricamento del database FAISS: {e}")
    faiss_index = None

# Funzione per salvare file caricati
def save_file(file: UploadFile, folder: str) -> str:
    try:
        file_path = os.path.join(folder, file.filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        return file_path
    except Exception as e:
        logger.error(f"Errore durante il salvataggio del file {file.filename}: {e}")
        raise HTTPException(status_code=500, detail=f"Errore nel salvataggio del file {file.filename}")

# Funzione per estrarre contenuto dai file
def extract_content(file_path: str) -> List[str]:
    try:
        if file_path.endswith(".pdf"):
            reader = PdfReader(file_path)
            return [page.extract_text() for page in reader.pages if page.extract_text()]
        elif file_path.endswith(".docx"):
            doc = DocxDocument(file_path)
            return [para.text for para in doc.paragraphs if para.text.strip()]
        elif file_path.endswith(".pptx"):
            ppt = Presentation(file_path)
            content = []
            for slide in ppt.slides:
                for shape in slide.shapes:
                    if hasattr(shape, "text"):
                        content.append(shape.text)
            return content
        elif file_path.endswith(".txt"):
            with open(file_path, "r", encoding="utf-8") as f:
                return f.readlines()
        else:
            raise ValueError("Formato file non supportato")
    except Exception as e:
        logger.error(f"Errore nell'estrazione del contenuto da {file_path}: {e}")
        raise HTTPException(status_code=500, detail=f"Errore nell'estrazione del contenuto da {file_path}")

# Funzione per recuperare contesto dal database FAISS (k=5 fisso)
def retrieve_context(query: str) -> List[dict]:
    if not faiss_index:
        logger.warning("Database FAISS non caricato. Nessun contesto disponibile.")
        return []
    try:
        docs = faiss_index.similarity_search(query, k=5)
        logger.info(f"Documenti recuperati: {docs}")
        return [
            {
                "content": doc.page_content,
                "source": {
                    "filename": doc.metadata["filename"],
                    "page_number": doc.metadata["page_number"]
                }
            }
            for doc in docs
        ]
    except Exception as e:
        logger.error(f"Errore nel recupero del contesto: {str(e)}")
        return []

@app.get("/test-faiss/")
def test_faiss():
    if not faiss_index:
        return {"status": "error", "message": "Database FAISS non caricato"}
    try:
        docs = faiss_index.similarity_search("test", k=5)
        context = "\n".join([doc.page_content for doc in docs])
        return {"status": "success", "context": context}
    except Exception as e:
        return {"status": "error", "message": str(e)}

# Endpoint per caricare i file e creare il database
@app.post("/upload-files/")
async def upload_files(
    files: List[UploadFile] = File(...),
    database_name: str = Form(...),
    description: str = Form(...)
):
    try:
        # Salva i file caricati
        file_paths = [save_file(file, UPLOAD_FOLDER) for file in files]

        # Estrarre il contenuto dai file
        all_documents = []
        for file_path in file_paths:
            content = extract_content(file_path)
            if content:
                for i, page in enumerate(content):
                    all_documents.append(
                        Document(page_content=page, metadata={
                            "filename": os.path.basename(file_path),
                            "page_number": i + 1
                        })
                    )

        # Verifica se ci sono documenti validi
        if not all_documents:
            raise HTTPException(status_code=400, detail="Nessun documento valido trovato.")

        # Suddividi i documenti in chunk
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1200, chunk_overlap=50)
        splits = []
        for doc in all_documents:
            chunks = text_splitter.split_text(doc.page_content)
            for chunk in chunks:
                splits.append(Document(page_content=chunk, metadata=doc.metadata))

        # Creazione dell'indice FAISS
        db_path = os.path.join(DB_FOLDER, database_name)
        index = FAISS.from_documents(splits, embeddings)
        index.save_local(db_path)

        # Salva la descrizione del database
        with open(os.path.join(db_path, "description.txt"), "w") as desc_file:
            desc_file.write(description)

        return {"message": f"Database '{database_name}' creato con successo.", "documents": len(splits)}

    except Exception as e:
        logger.error(f"Errore nella creazione del database: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Errore nella creazione del database: {str(e)}")

# Modello per i messaggi di completamento chat
class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    messages: List[Message]
    temperature: float = 0.7
    model: str = "hugging-quants/llama-3.2-3b-instruct"

# Endpoint per completamento della chat con fonti
@app.post("/v1/chat/completions")
async def chat_completion(request: ChatRequest):
    try:
        logger.info(f"Richiesta ricevuta: {request}")
        user_message = request.messages[-1].content

        # Recupera il contesto e le fonti dal database FAISS
        context_with_sources = retrieve_context(user_message)
        context_chunks = [
            {
                "content": item["content"],
                "source": {
                    "filename": item["source"]["filename"],
                    "page_number": item["source"]["page_number"]
                }
            }
            for item in context_with_sources
        ]

        # Costruisci il testo del contesto per il prompt
        context_text = "\n".join([
            f"{item['content']} (Fonte: {item['source']['filename']}, Pagina: {item['source']['page_number']})"
            for item in context_with_sources
        ])

        # Integra il contesto nei messaggi
        augmented_messages = [
            {"role": "system", "content": f"Informazioni utili:\n{context_text}"},
        ] + [{"role": msg.role, "content": msg.content} for msg in request.messages]

        # Invio della richiesta al server LLM
        headers = {"Content-Type": "application/json"}
        data = {
            "model": request.model,
            "messages": augmented_messages,
            "temperature": request.temperature,
            "stream": False
        }

        response = requests.post(LLM_SERVER_URL, json=data, headers=headers)
        response.raise_for_status()

        response_data = response.json()
        logger.info(f"Risposta ricevuta dal modello: {response_data}")
        bot_response = response_data["choices"][0]["message"]["content"]

        # Restituisci separatamente il completamento e i chunk
        return {
            "llm_response": bot_response,
            "context_chunks": context_chunks
        }
    except Exception as e:
        logger.error(f"Errore nel completamento della chat: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Errore nel completamento della chat: {str(e)}")

# Avvio del server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)