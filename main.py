# main.py
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Depends
from pydantic import BaseModel
import json
from typing import List, Dict
import uvicorn

# Importer toutes nos fonctions depuis le fichier core_nlp
import core_nlp 
from sentence_transformers import SentenceTransformer

# ==============================================================================
# 1. DÉFINITION DES MODÈLES DE DONNÉES (CONTRATS API)
# ==============================================================================

# Ce que l'API attend comme entrée pour une offre
class JobInput(BaseModel):
    id: str # L'ID de la base de données Spring Boot
    titre: str
    texte_brut: str

# Les métadonnées du CV que nous renvoyons
class CVMetaData(BaseModel):
    text_nettoye: str
    experience_bloc_texte: str
    experience_niveau_estime: int
    formation_bloc_texte: str
    competences_cles: str
    langues_structurees: str

# L'offre classée que nous renvoyons
class RankedJob(BaseModel):
    job_id: str
    titre_offre: str
    score_pertinence: float

# La réponse complète de l'API
class CandidateAnalysisResponse(BaseModel):
    cv_metadata: CVMetaData
    ranked_jobs: List[RankedJob]

# ==============================================================================
# 2. APPLICATION FASTAPI ET GESTION DU MODÈLE
# ==============================================================================

app = FastAPI(
    title="Service de Matching IA",
    description="API pour l'analyse de CV et le matching avec les offres d'emploi.",
    version="1.0.0"
)

# Dictionnaire pour stocker notre modèle en mémoire
ml_models = {}

@app.on_event("startup")
async def startup_event():
    """Charge le modèle NLP au démarrage du serveur."""
    model_name = 'all-mpnet-base-v2'
    ml_models["sentence_transformer"] = core_nlp.load_model(model_name)
    print(f"--- Modèle '{model_name}' chargé avec succès ---")

def get_model() -> SentenceTransformer:
    """Fonction "Dependency" pour obtenir le modèle dans les endpoints."""
    model = ml_models.get("sentence_transformer")
    if model is None:
        raise HTTPException(status_code=503, detail="Le modèle IA n'est pas encore chargé.")
    return model

# ==============================================================================
# 3. ENDPOINT PRINCIPAL (CÔTÉ CANDIDAT)
# ==============================================================================

@app.post("/analyze-candidate-cv", 
          response_model=CandidateAnalysisResponse,
          summary="Analyse 1 CV et le classe par rapport à N offres")
async def analyze_and_rank_cv(
    cv_file: UploadFile = File(..., description="Le CV du candidat (PDF ou DOCX)"),
    jobs_json: str = Form(..., description="Un string JSON d'offres. Ex: [{'id': '1', 'titre': '...', 'texte_brut': '...'}, ...]"),
    model: SentenceTransformer = Depends(get_model)
):
    """
    Exécute le workflow complet "Candidat"[cite: 9, 27]:
    1.  Parse le CV et extrait le texte brut[cite: 27].
    2.  Extrait les métadonnées structurées (compétences, expérience...).
    3.  Calcule le score de matching sémantique contre chaque offre[cite: 30].
    4.  Renvoie les métadonnées du CV et la liste des offres classées[cite: 31].
    """
    
    # --- 1. Lecture et Parsing du CV ---
    try:
        cv_bytes = await cv_file.read()
        
        if cv_file.filename.endswith('.pdf'):
            raw_cv_text = core_nlp.extract_text_from_pdf(cv_bytes)
        elif cv_file.filename.endswith('.docx'):
            raw_cv_text = core_nlp.extract_text_from_docx(cv_bytes)
        else:
            raise HTTPException(status_code=400, detail="Format de fichier non supporté. Utilisez PDF ou DOCX.")
        
        if not raw_cv_text:
            raise HTTPException(status_code=400, detail="Impossible d'extraire le texte du CV.")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors du parsing du CV: {str(e)}")

    # --- 2. Analyse des Métadonnées du CV (Votre "Fonction Maîtresse") ---
    cv_metadata_dict = core_nlp.analyze_cv_metadata(raw_cv_text)
    
    # --- 3. Parsing et Vectorisation (Batch) ---
    try:
        jobs_list = [JobInput(**job) for job in json.loads(jobs_json)]
    except Exception:
        raise HTTPException(status_code=400, detail="Format JSON des offres invalide.")

    # Vectoriser le CV (en tant que liste de 1)
    cv_vector = core_nlp.get_embedding(model, [cv_metadata_dict["text_nettoye"]])[0]
    
    # Vectoriser TOUTES les JDs en un seul appel (batch)
    jd_texts = [job.texte_brut for job in jobs_list]
    jd_embeddings = core_nlp.get_embedding(model, jd_texts)

    # --- 4. Calcul des Scores et Classement ---
    results = []
    for i, job in enumerate(jobs_list):
        jd_vector = jd_embeddings[i]
        
        score = core_nlp.calculate_job_fit_score(cv_vector, jd_vector)
        
        results.append(RankedJob(
            job_id=job.id,
            titre_offre=job.titre,
            score_pertinence=score
        ))

    # Trier les résultats par score
    results.sort(key=lambda x: x.score_pertinence, reverse=True)

    # --- 5. Renvoyer la Réponse Complète ---
    return CandidateAnalysisResponse(
        cv_metadata=CVMetaData(**cv_metadata_dict),
        ranked_jobs=results
    )

@app.get("/", summary="Statut du service")
def root():
    return {"status": "Service de Matching IA opérationnel."}

# Pour lancer le serveur localement (test)
if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=8000)