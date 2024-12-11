from fastapi import FastAPI, UploadFile, File, HTTPException
from typing import List
import os
import faiss_manager
from file_processor import create_documents_from_file

app = FastAPI()

# Directory per file caricati
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.post("/faiss/upload")
async def upload_file_to_faiss(file: UploadFile = File(...)):
    """
    Carica un file e lo aggiunge al database FAISS.
    """
    try:
        # Salva il file caricato
        file_path = os.path.join(UPLOAD_FOLDER, file.filename)
        with open(file_path, "wb") as f:
            f.write(file.file.read())

        # Estrai il contenuto e crea documenti
        documents = create_documents_from_file(file_path)

        # Aggiungi i documenti al database FAISS
        result = faiss_manager.add_documents([{"content": doc.page_content, "metadata": doc.metadata} for doc in documents])
        return {"message": "File caricato e aggiunto al database FAISS", "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.get("/faiss/list")
async def list_documents():
    """
    Elenca i documenti nel database FAISS.
    """
    try:
        faiss_index = faiss_manager.load_faiss()  # Carica il database FAISS
        # Usa una query arbitraria per ottenere documenti
        all_docs = faiss_index.similarity_search("all documents", k=5)  # Recupera i primi 5 documenti
        return [
            {
                "content_preview": doc.page_content[:50],  # Anteprima dei primi 50 caratteri
                "filename": doc.metadata.get("filename", "sconosciuto"),
                "page_number": doc.metadata.get("page_number", "n/a"),
            }
            for doc in all_docs
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Errore durante l'elenco dei documenti: {e}")

@app.delete("/faiss/remove-file/{filename}")
async def remove_file(filename: str):
    """
    Rimuove documenti associati a un file specifico dal database FAISS.
    """
    try:
        result = faiss_manager.remove_documents_by_filename(filename)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/faiss/remove-file/{filename}")
async def remove_file(filename: str):
    """
    Rimuove documenti associati a un file specifico dal database FAISS.
    """
    try:
        result = faiss_manager.remove_documents_by_filename(filename)
        if "error" in result:
            raise HTTPException(status_code=500, detail=result["error"])
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))