"""Ollama-shaped API for scanner fingerprinting. Forwards to host Ollama. Lab/canary only."""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import httpx, os, json

OLLAMA = os.environ.get("OLLAMA_URL", "http://host.docker.internal:11434")
MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2:3b")
app = FastAPI(title="Ollama", version="0.1.0-lab")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def root():
    return "Ollama is running"

@app.get("/api/tags")
async def tags():
    async with httpx.AsyncClient(timeout=30) as c:
        try:
            r = await c.get(f"{OLLAMA}/api/tags")
            return JSONResponse(r.json(), status_code=r.status_code)
        except Exception:
            return {"models": [{"name": MODEL, "model": MODEL, "size": 0, "digest": "lab-canary", "details": {"family": "llama"}}]}

@app.post("/api/generate")
async def generate(req: Request):
    body = await req.json()
    body.setdefault("model", MODEL)
    body.setdefault("stream", False)
    async with httpx.AsyncClient(timeout=120) as c:
        r = await c.post(f"{OLLAMA}/api/generate", json=body)
        return JSONResponse(r.json(), status_code=r.status_code)

@app.post("/api/chat")
async def chat(req: Request):
    body = await req.json()
    body.setdefault("model", MODEL)
    body.setdefault("stream", False)
    async with httpx.AsyncClient(timeout=120) as c:
        r = await c.post(f"{OLLAMA}/api/chat", json=body)
        return JSONResponse(r.json(), status_code=r.status_code)

@app.get("/api/version")
def version():
    return {"version": "0.6.0-lab-shim"}
