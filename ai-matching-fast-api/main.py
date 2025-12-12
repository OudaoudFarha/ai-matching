from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
import json
from typing import List
import uvicorn
import core_nlp 
from sentence_transformers import SentenceTransformer
from fastapi import File, Form, UploadFile
from typing import List
app = FastAPI(
    title="API Job Matching AI",
    description="Backend pour le projet S5: Matching CV et Offres [cite: 6]",
    version="2.0.0"
)

# Stockage global du modèle
ml_models = {}

@app.on_event("startup")
async def startup_event():
    ml_models["model"] = core_nlp.load_model()

def get_model():
    if "model" not in ml_models:
        raise HTTPException(status_code=503, detail="Modèle non chargé")
    return ml_models["model"]

# --- MODÈLES DE DONNÉES (Pydantic) ---

class JobInput(BaseModel):
    id: str
    titre: str
    texte_brut: str

class RankedJob(BaseModel):
    job_id: str
    titre_offre: str
    score_pertinence: float
    details_score: str # Pour expliquer le score (debugging)

class CandidateResponse(BaseModel):
    cv_competences: str
    experience_estimee: int
    offres_classees: List[RankedJob]

class RecruiterResult(BaseModel):
    filename: str
    score: float
    competences_detectees: str

# --- ENDPOINT 1 : CÔTÉ CANDIDAT (1 CV -> N OFFRES) [cite: 9, 31] ---
@app.post("/analyze-recruiter")
async def analyze_recruiter(
    jd_text: str = Form(...),
    top_n: int = Form(3),
    files: List[UploadFile] = File(...)
):
    model = get_model()

    jd_clean = core_nlp.clean_text(jd_text)
    jd_vec = core_nlp.get_embedding(model, [jd_clean])[0]

    results = []
    for f in files:
        b = await f.read()
        name = (f.filename or "").lower()

        if name.endswith(".pdf"):
            raw = core_nlp.extract_text_from_pdf(b)
        elif name.endswith(".docx"):
            raw = core_nlp.extract_text_from_docx(b)
        else:
            continue

        meta = core_nlp.analyze_cv_metadata(raw)
        cv_vec = core_nlp.get_embedding(model, [meta.get("text_nettoye", "")])[0]

        score = core_nlp.calculate_hybrid_score(
            cv_vec,
            jd_vec,
            meta.get("competences_cles", []),
            jd_clean
        )

        results.append({
            "filename": f.filename,
            "score": float(score)   # ✅ important
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results   # ✅ renvoyer tout


if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)