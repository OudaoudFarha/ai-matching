from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
import json
from typing import List, Optional
import uvicorn
import core_nlp 
from sentence_transformers import SentenceTransformer

app = FastAPI(
    title="API Job Matching AI",
    description="Backend pour le projet S5: Matching CV et Offres",
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
    competences_detectees: Optional[str] = None

# --- ENDPOINT 1 : CÔTÉ CANDIDAT (1 CV -> N OFFRES) ---

@app.post("/analyze-candidate", response_model=CandidateResponse)
async def analyze_candidate(
    cv_file: UploadFile = File(...),
    jobs_json: str = Form(...), # JSON stringifié contenant la liste des offres
    model: SentenceTransformer = Depends(get_model)
):
    # 1. Parsing CV
    content = await cv_file.read()
    if cv_file.filename.endswith('.pdf'):
        raw_text = core_nlp.extract_text_from_pdf(content)
    elif cv_file.filename.endswith('.docx'):
        raw_text = core_nlp.extract_text_from_docx(content)
    else:
        raise HTTPException(400, "Format invalide. PDF ou DOCX uniquement.")

    # 2. Analyse Métadonnées CV
    meta_cv = core_nlp.analyze_cv_metadata(raw_text)
    
    # 3. Vectorisation CV
    # Astuce : On concatène Compétences + Expérience + Texte pour focaliser le modèle
    context_text = f"{meta_cv['competences_str']} {meta_cv['experience_bloc']} {meta_cv['text_nettoye']}"
    cv_vector = core_nlp.get_embedding(model, [context_text])[0]

    # 4. Traitement des Offres (Batch)
    try:
        jobs_data = json.loads(jobs_json)
        jobs_list = [JobInput(**j) for j in jobs_data]
    except:
        raise HTTPException(400, "JSON des offres invalide")

    # Vectorisation des JDs en une seule passe (plus rapide)
    jd_texts = [j.texte_brut for j in jobs_list]
    jd_vectors = core_nlp.get_embedding(model, jd_texts)

    # 5. Calcul des Scores Hybrides
    results = []
    for i, job in enumerate(jobs_list):
        score = core_nlp.calculate_hybrid_score(
            cv_vector, 
            jd_vectors[i], 
            meta_cv['competences_cles'], 
            job.texte_brut
        )
        results.append(RankedJob(
            job_id=job.id,
            titre_offre=job.titre,
            score_pertinence=score,
            details_score="Score calculé via Hybride (Sémantique + Mots-clés)"
        ))

    # Tri décroissant
    results.sort(key=lambda x: x.score_pertinence, reverse=True)

    return CandidateResponse(
        cv_competences=meta_cv['competences_str'],
        experience_estimee=meta_cv['experience_estimee'],
        offres_classees=results
    )


# --- ENDPOINT 2 : CÔTÉ RECRUTEUR (1 OFFRE -> N CVs) ---

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

        raw = ""
        if name.endswith(".pdf"):
            raw = core_nlp.extract_text_from_pdf(b)
        elif name.endswith(".docx"):
            raw = core_nlp.extract_text_from_docx(b)
        else:
            continue

        meta = core_nlp.analyze_cv_metadata(raw)
        # Utilisation de .get pour éviter les erreurs si la clé manque
        cv_vec = core_nlp.get_embedding(model, [meta.get("text_nettoye", "")])[0]

        score = core_nlp.calculate_hybrid_score(
            cv_vec,
            jd_vec,
            meta.get("competences_cles", []),
            jd_clean
        )

        results.append({
            "filename": f.filename,
            "score": float(score)
        })

    results.sort(key=lambda x: x["score"], reverse=True)
    return results

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)