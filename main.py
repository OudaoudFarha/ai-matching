from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
import json
from typing import List
import uvicorn
import core_nlp 
from sentence_transformers import SentenceTransformer

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

# --- ENDPOINT 2 : CÔTÉ RECRUTEUR (1 OFFRE -> N CVs)  ---

@app.post("/analyze-recruiter", response_model=List[RecruiterResult])
async def analyze_recruiter(
    job_description: str = Form(..., description="Texte de l'offre"),
    files: List[UploadFile] = File(..., description="Liste de CVs"),
    model: SentenceTransformer = Depends(get_model)
):
    results = []
    
    # 1. Vectoriser l'offre (JD) une seule fois
    jd_vector = core_nlp.get_embedding(model, [job_description])[0]
    
    # 2. Boucle sur chaque CV
    for file in files:
        try:
            content = await file.read()
            if file.filename.endswith('.pdf'):
                text = core_nlp.extract_text_from_pdf(content)
            elif file.filename.endswith('.docx'):
                text = core_nlp.extract_text_from_docx(content)
            else:
                continue # Ignore fichiers non supportés
            
            # Analyse
            meta_cv = core_nlp.analyze_cv_metadata(text)
            
            # Vectorisation
            context_text = f"{meta_cv['competences_str']} {meta_cv['experience_bloc']} {meta_cv['text_nettoye']}"
            cv_vector = core_nlp.get_embedding(model, [context_text])[0]
            
            # Scoring Hybride
            score = core_nlp.calculate_hybrid_score(
                cv_vector, 
                jd_vector, 
                meta_cv['competences_cles'], 
                job_description
            )
            
            results.append(RecruiterResult(
                filename=file.filename,
                score=score,
                competences_detectees=meta_cv['competences_str']
            ))
            
        except Exception as e:
            print(f"Erreur sur le fichier {file.filename}: {e}")

    # 3. Tri pour retourner le Top N (Decroissant)
    results.sort(key=lambda x: x.score, reverse=True)
    
    return results

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)