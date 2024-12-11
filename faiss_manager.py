import os
from langchain.vectorstores import FAISS
from langchain.embeddings.huggingface import HuggingFaceEmbeddings
from langchain.docstore.document import Document

# Configurazione embeddings HuggingFace
HUGGINGFACE_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
embeddings = HuggingFaceEmbeddings(model_name=HUGGINGFACE_MODEL_NAME)

# Percorso al database FAISS
DB_FOLDER = "db"
db_path = os.path.join(DB_FOLDER, "my_database")

# Funzione per caricare il database
def load_faiss():
    if not os.path.exists(db_path):
        raise FileNotFoundError("Il database FAISS non esiste.")
    return FAISS.load_local(db_path, embeddings)

# Funzione per salvare il database
def save_faiss(faiss_index):
    faiss_index.save_local(db_path)
    print(f"Database FAISS salvato in {db_path}.")

# Aggiungi documenti al database
def add_documents(documents):
    try:
        faiss_index = load_faiss()
        new_docs = [Document(page_content=doc["content"], metadata=doc["metadata"]) for doc in documents]
        faiss_index.add_documents(new_docs)
        save_faiss(faiss_index)
        return {"message": "Documenti aggiunti con successo."}
    except Exception as e:
        return {"error": str(e)}

def remove_documents_by_filename(filename: str):
    """
    Rimuove documenti dal database FAISS associati a un determinato file.
    """
    try:
        faiss_index = load_faiss()  # Carica il database FAISS
        # Recupera tutti i documenti dal database
        all_docs = faiss_index.similarity_search("debug query", k=1000)  # Recupera un numero elevato di documenti
        # Filtra i documenti da mantenere
        filtered_docs = [doc for doc in all_docs if doc.metadata.get("filename") != filename]
        # Ricrea l'indice con i documenti filtrati
        new_index = FAISS.from_documents(filtered_docs, embeddings)
        save_faiss(new_index)  # Salva il nuovo database
        return {"message": f"Documenti associati al file '{filename}' rimossi con successo."}
    except Exception as e:
        return {"error": str(e)}

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