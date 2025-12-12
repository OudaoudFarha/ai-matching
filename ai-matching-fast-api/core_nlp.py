import fitz  # PyMuPDF
from docx import Document
import re
import io
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# ==============================================================================
# CONFIGURATION & LISTES
# ==============================================================================

# Liste étendue pour matcher les compétences techniques (Tech Focus du cahier des charges) [cite: 24]
KEY_COMPETENCES_LIST = [
    "JAVA", "SPRING BOOT", "JEE", "REACT", "REACT NATIVE", "ANGULAR", "PYTHON", "NLP", 
    "SENTENCE-BERT", "POSTGRESQL", "SQL", "MONGODB", "NOSQL", "MACHINE LEARNING", 
    "DEEP LEARNING", "TENSORFLOW", "PYTORCH", "KERAS", "AWS", "AZURE", "GCP", 
    "KUBERNETES", "DOCKER", "JENKINS", "GITLAB CI", "FASTAPI", "FLASK", "DJANGO",
    "MLFLOW", "FLUTTER", "SWIFT", "KOTLIN", "CI/CD", "SCRUM", "AGILE", "DEVOPS", 
    "CYBERSECURITE", "TABLEAU", "POWER BI", "EXCEL", "GIT", "JIRA", "UML", "MERISE"
]

# ==============================================================================
# 1. EXTRACTION & NETTOYAGE
# ==============================================================================

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extrait le texte brut d'un PDF."""
    text = ""
    try:
        with fitz.open(stream=io.BytesIO(file_bytes), filetype="pdf") as doc:
            for page in doc:
                text += page.get_text()
    except Exception as e:
        print(f"Erreur PDF : {e}")
    return text.strip()

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extrait le texte brut d'un DOCX."""
    text = ""
    try:
        with io.BytesIO(file_bytes) as file_stream:
            doc = Document(file_stream)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
    except Exception as e:
        print(f"Erreur DOCX : {e}")
    return text.strip()

def clean_text(text):
    """Nettoie le texte : supprime sauts de ligne excessifs et caractères spéciaux."""
    text = re.sub(r'[\n\t\r]+', ' ', text)
    text = re.sub(r'[^\w\s@.+/#-]', ' ', text) # Garde les caractères utiles pour la tech (C++, C#, etc.)
    text = re.sub(r'\s{2,}', ' ', text)
    return text.strip()

# ==============================================================================
# 2. ANALYSE METADONNÉES (Extraction d'infos clés) [cite: 29]
# ==============================================================================

def extract_competences(text):
    """Cherche les mots-clés techniques dans le texte."""
    text_upper = text.upper()
    found_competences = set()
    # Recherche avec word boundary (\b) pour éviter les faux positifs
    for comp in KEY_COMPETENCES_LIST:
        if re.search(r'\b' + re.escape(comp) + r'\b', text_upper):
            found_competences.add(comp)
    return list(found_competences)

def extract_experience_level(text):
    """Estime les années d'expérience via Regex."""
    text_lower = text.lower()
    if "senior" in text_lower or "expert" in text_lower:
        return 5
    if "junior" in text_lower or "débutant" in text_lower or "stage" in text_lower:
        return 0
    match_years = re.search(r'(\d+)\s+an(s)?\s+d\'?exp[ée]rience', text_lower)
    if match_years:
        years = int(match_years.group(1))
        return min(years, 10) # Plafond à 10 pour l'échelle
    return 2 # Valeur par défaut standard

def extract_cv_sections(cv_text):
    """Découpe le CV en sections (Formation, Expérience, etc.)."""
    text_normalized = cv_text.upper()
    section_titles = {
        'PROFIL': r'(PROFIL|SUMMRY|RESUME)',
        'FORMATION': r'(FORMATION|EDUCATION|ETUDES|DIPLOME)',
        'EXPERIENCE': r'(EXP[ÉÈ]RIENCE|PROFESSIONNELLE|PARCOURS)',
        'COMPETENCES': r'(COMP[ÉÈ]TENCES|SKILLS|TECHNIQUES)',
        'LANGUES': r'(LANGUES|LANGUAGES)'
    }
    
    anchors = []
    for title_name, pattern in section_titles.items():
        match = re.search(pattern, text_normalized)
        if match:
            anchors.append((match.start(), title_name))
    
    anchors.sort(key=lambda x: x[0])
    sections = {}

    for i in range(len(anchors)):
        start = anchors[i][0]
        name = anchors[i][1]
        end = anchors[i+1][0] if i + 1 < len(anchors) else len(cv_text)
        sections[name.lower()] = cv_text[start:end].strip()
        
    return sections

def analyze_cv_metadata(raw_cv_text):
    """Fonction principale d'analyse d'un CV."""
    if not raw_cv_text:
        return {}
    
    cv_clean = clean_text(raw_cv_text)
    sections = extract_cv_sections(cv_clean)
    competences_list = extract_competences(cv_clean)
    xp_level = extract_experience_level(cv_clean)
    
    return {
        "text_nettoye": cv_clean,
        "experience_bloc": sections.get('experience', ''),
        "formation_bloc": sections.get('formation', ''),
        "competences_cles": competences_list, # Liste Python
        "competences_str": ", ".join(competences_list), # String pour affichage
        "experience_estimee": xp_level
    }

# ==============================================================================
# 3. INTELLIGENCE ARTIFICIELLE & SCORING HYBRIDE
# ==============================================================================

def load_model():
    print("Chargement du modèle NLP...")
    return SentenceTransformer('all-mpnet-base-v2')

def get_embedding(model, text_list):
    """Vectorise une liste de textes."""
    # Troncature implicite gérée par SentenceTransformer (souvent 384 tokens)
    return model.encode(text_list, convert_to_tensor=True)

def calculate_hybrid_score(cv_vector, jd_vector, cv_skills, jd_text):
    """
    Calcule un score hybride (Sémantique + Mots-clés) pour plus de précision[cite: 30].
    Répartition : 70% Sémantique (Compréhension) + 30% Mots-clés (Technique).
    """
    # 1. Score Sémantique (Cosine Similarity)
    cv_np = cv_vector.cpu().numpy().reshape(1, -1)
    jd_np = jd_vector.cpu().numpy().reshape(1, -1)
    semantic_score = cosine_similarity(cv_np, jd_np)[0][0] # 0.0 à 1.0
    
    # 2. Score Mots-clés (Hard Skills)
    jd_skills_needed = extract_competences(jd_text) # On analyse la JD pour trouver les skills requis
    
    if not jd_skills_needed:
        keyword_match_ratio = 0.5 # Neutre si la JD est trop vague
    else:
        # Intersection des compétences CV et JD
        matches = [s for s in jd_skills_needed if s in cv_skills]
        keyword_match_ratio = len(matches) / len(jd_skills_needed)
    
    # 3. Pondération Finale
    final_score = (semantic_score * 0.7) + (keyword_match_ratio * 0.3)
    
    # Conversion en pourcentage (0-100)
    return round(max(0, final_score) * 100, 2)