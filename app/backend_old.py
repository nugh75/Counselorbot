from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from langchain.vectorstores import FAISS
from langchain.embeddings.huggingface import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.docstore.document import Document
from langchain_openai import ChatOpenAI
from pydantic import BaseModel
from typing import List
import os
import logging
from PyPDF2 import PdfReader
from docx import Document as DocxDocument
from pptx import Presentation
from dotenv import load_dotenv

# Configurazione logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Caricamento variabili di ambiente
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Directory Configurazione
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
STATIC_FOLDER = os.path.join(BASE_DIR, "static")
UPLOAD_FOLDER = os.path.join(BASE_DIR, "uploads")
DB_FOLDER = os.path.join(BASE_DIR, "db")
os.makedirs(STATIC_FOLDER, exist_ok=True)
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(DB_FOLDER, exist_ok=True)

# Configurazione embeddings tramite HuggingFace
HUGGINGFACE_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
embeddings = HuggingFaceEmbeddings(model_name=HUGGINGFACE_MODEL_NAME)
logger.info(f"Embeddings configurati con il modello {HUGGINGFACE_MODEL_NAME}")

# Configurazione Database FAISS
try:
    db_path = os.path.join(DB_FOLDER, "my_database")
    faiss_index = FAISS.load_local(db_path, embeddings)
    logger.info(f"Database FAISS caricato da {db_path}")
except Exception as e:
    logger.error(f"Errore nel caricamento del database FAISS: {e}")
    faiss_index = None

# Inizializzazione FastAPI
app = FastAPI()

# Configurazione CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Monta i file statici
app.mount("/static", StaticFiles(directory=STATIC_FOLDER), name="static")

# Funzione per recuperare contesto dal database FAISS
def retrieve_context(query: str) -> List[dict]:
    if not faiss_index:
        logger.warning("Database FAISS non caricato. Nessun contesto disponibile.")
        return []
    try:
        if not query.strip():
            logger.warning("La query fornita è vuota.")
            return []
        docs = faiss_index.similarity_search(query, k=5)
        logger.info(f"{len(docs)} documenti trovati per la query: '{query}'")
        return [
            {
                "content": doc.page_content,
                "source": {
                    "filename": doc.metadata.get("filename", "sconosciuto"),
                    "page_number": doc.metadata.get("page_number", "n/a"),
                },
            }
            for doc in docs
        ]
    except Exception as e:
        logger.error(f"Errore durante il recupero del contesto: {e}")
        return []

# Route per servire index.html
@app.get("/", response_class=FileResponse)
async def serve_index():
    index_file = os.path.join(STATIC_FOLDER, "index.html")
    if not os.path.exists(index_file):
        logger.error("Il file index.html non è stato trovato.")
        raise HTTPException(status_code=404, detail="Il file index.html non è disponibile.")
    return FileResponse(index_file)

# Endpoint per completamento della chat
class ChatRequest(BaseModel):
    messages: List[dict]
    temperature: float = 0.7

@app.post("/v1/chat/completions")
async def chat_completion(request: ChatRequest):
    try:
        user_message = request.messages[-1]["content"]
        logger.info(f"Messaggio ricevuto dall'utente: {user_message}")

        context_with_sources = retrieve_context(user_message)
        if not context_with_sources:
            logger.warning("Nessun contesto trovato.")
            return {"llm_response": "Non ho trovato contesto rilevante.", "context_chunks": []}

        context_text = "\n".join([
            f"• {item['content']} (Fonte: {item['source']['filename']}, Pagina: {item['source']['page_number']})"
            for item in context_with_sources
        ])

        augmented_messages = [
            {"role": "system", "content": f"Usa queste informazioni:\n{context_text}"}
        ] + request.messages

        llm = ChatOpenAI(model="gpt-4o-mini", openai_api_key=OPENAI_API_KEY)
        response = llm.predict_messages(messages=augmented_messages, temperature=request.temperature)
        logger.info(f"Risposta dal modello: {response.content}")

        return {"llm_response": response.content, "context_chunks": context_with_sources}
    except Exception as e:
        logger.error(f"Errore nel completamento della chat: {e}")
        raise HTTPException(status_code=500, detail="Errore nel completamento della chat.")

# Endpoint per caricamento file
@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())
        logger.info(f"File caricato: {file.filename}")
        return {"message": "File caricato correttamente", "filename": file.filename}
    except Exception as e:
        logger.error(f"Errore durante il caricamento del file: {e}")
        raise HTTPException(status_code=500, detail="Errore durante il caricamento del file.")

# Endpoint di verifica server
@app.get("/health")
async def health_check():
    return {"status": "ok"}

# Avvio del server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)