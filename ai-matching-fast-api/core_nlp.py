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
# Liste étendue pour matcher les compétences techniques
KEY_COMPETENCES_LIST = [
    # Backend Java / Microservices
    "JAVA", "SPRING", "SPRING BOOT", "SPRING MVC", "SPRING SECURITY",
    "SPRING DATA", "SPRING CLOUD", "MICROSERVICES", "MICROSERVICE",
    "JEE", "HIBERNATE",

    # Frontend
    "REACT", "REACT NATIVE", "ANGULAR", "VUEJS", "VUE.JS", "TYPESCRIPT",
    "JAVASCRIPT", "HTML", "CSS",

    # Bases de données
    "SQL", "POSTGRESQL", "MYSQL", "MARIADB", "ORACLE",
    "MONGODB", "NOSQL", "REDIS", "ELASTICSEARCH",

    # DevOps / Cloud
    "DOCKER", "KUBERNETES", "K8S", "JENKINS", "GITLAB CI", "CI/CD",
    "GIT", "GITHUB", "GITLAB", "AZURE", "AWS", "GCP",
    "MINIO", "RABBITMQ", "KAFKA", "KEYCLOAK",

    # Data / ML / IA
    "PYTHON", "NLP", "MACHINE LEARNING", "DEEP LEARNING",
    "TENSORFLOW", "PYTORCH", "KERAS", "SCIKIT-LEARN",
    "MLFLOW",

    # RAG / LLM
    "RAG", "LLM", "LANGCHAIN", "OLLAMA",
    "HUGGINGFACE", "TRANSFORMERS", "BERT", "LLAMA", "MISTRAL",
    "QDRANT", "CHROMADB", "VECTOR DB", "EMBEDDINGS",

    # BI / Analytics
    "TABLEAU", "POWER BI", "EXCEL",

    # Méthodo / Modélisation
    "SCRUM", "AGILE", "DEVOPS", "UML", "MERISE"
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

# ======================================================================
# 4. OUTILS POUR LES RECOMMANDATIONS CANDIDAT
# ======================================================================

def extract_skills_from_text(text: str):
    """
    Extrait les compétences à partir d'un texte libre (CV ou JD).
    """
    cleaned = clean_text(text)
    return extract_competences(cleaned)

def compute_semantic_similarity(model, text1: str, text2: str) -> float:
    """
    Similarité sémantique simple entre deux textes (0–1).
    """
    emb = get_embedding(model, [clean_text(text1), clean_text(text2)])
    v1, v2 = emb[0], emb[1]
    v1_np = v1.cpu().numpy().reshape(1, -1)
    v2_np = v2.cpu().numpy().reshape(1, -1)
    return float(cosine_similarity(v1_np, v2_np)[0][0])

def generate_experience_advice(cv_text: str, jd_text: str) -> str:
    """
    Petit message d'explication sur l'expérience.
    """
    cv_xp = extract_experience_level(cv_text)
    jd_xp = extract_experience_level(jd_text)

    if cv_xp >= jd_xp:
        return (
            "Votre niveau d'expérience semble aligné avec le poste. "
            "Mettez bien en avant vos missions les plus pertinentes dans votre CV."
        )
    elif jd_xp - cv_xp <= 2:
        return (
            "Le poste demande un peu plus d'expérience que votre profil actuel. "
            "Soulignez vos projets académiques, stages et réalisations concrètes."
        )
    else:
        return (
            "Le poste semble viser un profil plus expérimenté. "
            "Ciblez plutôt des offres 'Junior' ou 'Stage' et enrichissez votre CV "
            "avec des projets, contributions open-source ou certifications."
        )
def compare_tech_stacks(cv_skills, jd_skills):
    """
    Compare les stacks techniques CV vs Offre.
    Retourne :
      - common: compétences communes (forces)
      - missing: compétences demandées mais absentes du CV
      - extra: compétences du CV non demandées dans l'offre
    """
    cv_set = set(cv_skills or [])
    jd_set = set(jd_skills or [])

    common = sorted(cv_set & jd_set)
    missing = sorted(jd_set - cv_set)
    extra = sorted(cv_set - jd_set)

    return common, missing, extra


def build_skills_advice(common, missing, extra, score: float) -> str:
    """
    Construit un texte de recommandation technique lisible par le candidat.
    Personnalisé selon :
      - les compétences en commun
      - les compétences manquantes
      - les compétences "bonus" du CV
      - le score global de matching
    """
    parts = []

    # 0) Intro selon le score
    if score >= 75:
        parts.append("🎯 Très bon alignement technique pour ce poste.")
    elif score >= 50:
        parts.append("👍 Bon début de correspondance technique, avec quelques points à renforcer.")
    else:
        parts.append("⚠️ Match technique partiel : plusieurs compétences clés de l’offre ne sont pas encore visibles dans votre CV.")

    # 1) Points forts (compétences en commun)
    if common:
        parts.append(
            "✅ Points forts techniques pour ce poste : "
            + ", ".join(common[:6])
            + "."
        )

    # 2) Compétences à apprendre / rendre visibles
    if missing:
        parts.append(
            "📌 Pour augmenter votre score, il serait utile de vous former "
            "et/ou de mettre davantage en avant dans votre CV : "
            + ", ".join(missing[:6])
            + "."
        )

    # 3) Compétences bonus (non demandées mais potentiellement utiles)
    if extra:
        parts.append(
            "💡 Compétences supplémentaires présentes dans votre CV "
            "qui peuvent être un plus selon le contexte de l’entreprise : "
            + ", ".join(extra[:6])
            + "."
        )

    # Cas extrême : aucune info exploitable
    if not parts:
        return (
            "Nous n'avons pas pu analyser en détail les compétences techniques "
            "pour cette offre, probablement parce qu'elle est très courte ou générique."
        )

    return " ".join(parts)


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