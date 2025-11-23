from fastapi import FastAPI, Query
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer

app = FastAPI(title="NLP Service")
model = SentenceTransformer("all-MiniLM-L6-v2")

class EmbedIn(BaseModel):
    text: str

@app.get("/health")
def health():
    return {"ok": True}

@app.get("/embed")
def embed_get(text: str = Query(..., min_length=1)):
    vec = model.encode(text).tolist()
    return {"embedding": vec}

@app.post("/embed")
def embed_post(inp: EmbedIn):
    vec = model.encode(inp.text).tolist()
    return {"embedding": vec}
