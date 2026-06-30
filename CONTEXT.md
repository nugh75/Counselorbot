# CONTEXT — counselorbot-alpha-v0.1-bussola-20241108

<!-- ai4educ:context-template v1.0 -->

## Quick Reference
- **Stack**: TODO
- **Entry point**: TODO
- **Test**: TODO

## Recovered from old AGENTS.md
# counselorbot-alpha-v0.1-bussola-20241108 — AGENTS.md

## Quick start

```bash
cd app
python -m venv venv && source venv/bin/activate
pip install -r ../requirements.txt
cp ../.env.example app/.env   # then edit with your key
python backend.py              # starts on http://localhost:8000
```

Open `http://localhost:8000` — the FastAPI server serves the frontend.

## Run commands

Backend must be started from `app/` (it resolves paths relative to __file__):
```
cd app && source venv/bin/activate && python backend.py
```

No build step, no test suite, no lint/typecheck/CI.

## Architecture

### Entrypoints

| File | Role |
|------|------|
| `app/backend.py` | Main FastAPI app (port 8000). Serves static files from `app/static/`, runs the chat endpoint `/v1/chat/completions`, FAISS RAG, file upload, FAISS admin routes. |
| `app/upload.py` | Standalone FastAPI app con FAISS document management routes. **Not wired into `backend.py`** — runs independently. Routes duplicate `backend.py`; use `backend.py` per deploy. |
| `app/faiss_manager.py` | FAISS vector DB helpers. Lazy embeddings, sidecar JSON registry (`registry.json`) per delete affidabile. |
| `app/file_processor.py` | File content extraction (PDF, DOCX, PPTX) con `RecursiveCharacterTextSplitter` per chunking semantico. |
| `app/static/index.html` | Frontend — widget, sidebar, fullscreen modes. |
| `app/static/chatbot.js` | Chat UI logic. Usa URL relativi (no hardcoded host). |
| `app/static/instructions.txt` | System prompt per l'LLM (Italiano, tutor orientatore). |

### Key dependencies

- **LLM**: Configurable via `.env` — supports **OpenRouter**, **Groq**, **Together.ai**, **DeepSeek**, **OpenAI** (all via `ChatOpenAI` with custom `base_url`)
- **Embeddings**: HuggingFace `sentence-transformers/all-MiniLM-L6-v2`
- **Vector store**: FAISS (local, `app/db/my_database/`)
- **Filesystem**: PyPDF2, python-docx, python-pptx

## Configurazione Provider

| Provider | `LLM_PROVIDER` | Variabile API Key | Modello default | Modello alternativo |
|----------|---------------|-------------------|----------------|---------------------|
| OpenRouter | `openrouter` | `OPENROUTER_API_KEY` | `meta-llama/llama-3.2-3b-instruct:free` | via `OPENROUTER_MODEL` |
| Groq | `groq` | `GROQ_API_KEY` | `llama3-8b-8192` | via `GROQ_MODEL` |
| Together.ai | `togetherai` | `TOGETHERAI_API_KEY` | `mistralai/Mixtral-8x7B-Instruct-v0.1` | via `TOGETHERAI_MODEL` |
| DeepSeek | `deepseek` | `DEEPSEEK_API_KEY` | `deepseek-chat` | via `DEEPSEEK_MODEL` |
| OpenAI | `openai` | `OPENAI_API_KEY` | `gpt-4o-mini` | via `OPENAI_MODEL` |

**Setup**:
```bash
cp ../.env.example app/.env
# edit app/.env: set LLM_PROVIDER + the matching API key
# optional: set the *_MODEL to override the default
```

## Must-know

- `.env` with the chosen provider's API key is required at `app/.env` (loaded via `load_dotenv()`) — set `LLM_PROVIDER=openrouter|groq|togetherai|deepseek|openai` and corresponding `*_API_KEY`
- FAISS loads with `allow_dangerous_deserialization=True` — necessary for local pickle-based index
- The app is in **Italian**: system prompt, UI labels, and expected responses are all Italian
- No tests, no linting, no type checking configured
- `app/upload.py` and `app/backend.py` are separate FastAPI apps — they do NOT share routes
- `app/dependencies.txt` is a generated `pipdeptree` dump, not a real requirements file — edit `../requirements.txt` instead

## Common Tasks (da aggiungere)
TODO
