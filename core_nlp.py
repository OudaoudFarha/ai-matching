# core_nlp.py
import fitz  # PyMuPDF
from docx import Document
import re
import io
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

# ==============================================================================
# ÉTAPE 1 : EXTRACTION / PARSING (MODIFIÉ POUR L'API)
# ==============================================================================

def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extrait le texte brut à partir d'octets (bytes) PDF."""
    text = ""
    try:
        # Ouvrir le PDF depuis un flux d'octets en mémoire
        with fitz.open(stream=io.BytesIO(file_bytes), filetype="pdf") as doc:
            for page in doc:
                text += page.get_text()
    except Exception as e:
        print(f"Erreur PDF : {e}")
    return text.strip()

def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extrait le texte brut à partir d'octets (bytes) DOCX."""
    text = ""
    try:
        # Ouvrir le DOCX depuis un flux d'octets en mémoire
        with io.BytesIO(file_bytes) as file_stream:
            doc = Document(file_stream)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\n"
    except Exception as e:
        print(f"Erreur DOCX : {e}")
    return text.strip()

def clean_text(text):
    """Nettoie le texte extrait pour le préparer à l'IA."""
    # Remplace les sauts de ligne, tabulations, etc., par un seul espace
    text = re.sub(r'[\n\t\r]+', ' ', text)
    # Supprime les "fausses" puces (☐) que PyMuPDF peut extraire
    text = re.sub(r'[☐§]', ' ', text)
    # Réduit les espaces multiples à un seul espace
    text = re.sub(r'\s{2,}', ' ', text)
    return text.strip()

# ==============================================================================
# ÉTAPE 2 : EXTRACTION DE MÉTADONNÉES (CORRECTIONS FINALES)
# ==============================================================================

KEY_COMPETENCES_LIST = [
    "JAVA", "SPRING BOOT", "REACT", "REACT NATIVE", "ANGULAR", "PYTHON", "NLP", "SENTENCE-BERT",
    "POSTGRESQL", "SQL", "MONGODB", "MACHINE LEARNING", "TENSORFLOW", "PYTORCH", 
    "AWS", "KUBERNETES", "DOCKER", "FASTAPI", "MLFLOW", "FLUTTER",
    "CI/CD", "SCRUM", "AGILE", "DEVOPS", "CYBERSECURITE", "TABLEAU", "POWER BI",
    "GIT", "UML", "FIGMA", "FIREBASE", "MQTT"
]

def extract_competences(text):
    text_upper = text.upper()
    found_competences = set()
    for comp in KEY_COMPETENCES_LIST:
        # Utiliser une regex pour trouver le mot exact (word boundary)
        if re.search(r'\b' + re.escape(comp) + r'\b', text_upper):
            found_competences.add(comp)
    return ", ".join(sorted(list(found_competences)))

def extract_experience_level(text):
    text_lower = text.lower()
    if "senior" in text_lower or "expert" in text_lower:
        return 5
    if "junior" in text_lower or "débutant" in text_lower or "stage" in text_lower:
        return 0
    match_years = re.search(r'(\d+)\s+an(s)?\s+d\'?exp[ée]rience', text_lower)
    if match_years:
        years = int(match_years.group(1))
        return years if years < 5 else 5
    return 3 # Par défaut

def extract_cv_sections(cv_text):
    text_normalized = cv_text.upper()
    
    # <-- CORRECTION N°1 (FINALE) : Ce dictionnaire matche les titres exacts de votre CV
    #     pour délimiter parfaitement les blocs.
    section_titles = {
        'PROFIL': r'(PROFIL)',
        'FORMATION': r'(FORMATION)',
        'EXPERIENCE': r'(EXP[ÉÈ]RIENCE\sPROFESSIONNELLE)', # Cible "EXPÉRIENCE PROFESSIONNELLE"
        'PROJETS': r'(PROJETS)',
        'CERTIFICATIONS': r'(CERTIFICATIONS)',
        'LANGUES': r'(LANGUES)'
    }
    
    anchors = []
    for title_name, pattern in section_titles.items():
        match = re.search(pattern, text_normalized)
        if match:
            anchors.append((match.start(), title_name))
    
    anchors.sort(key=lambda x: x[0])
    sections = {}

    for i in range(len(anchors)):
        start_index = anchors[i][0]
        section_name = anchors[i][1]
        if i + 1 < len(anchors):
            end_index = anchors[i+1][0]
        else:
            end_index = len(cv_text)
        
        # On prend le contenu *après* le titre de la section
        section_title_match = re.search(section_titles[section_name], cv_text[start_index:end_index].upper())
        if section_title_match:
            content_start_index = start_index + section_title_match.end()
        else:
            content_start_index = start_index
            
        section_content = cv_text[content_start_index:end_index].strip()
        sections[section_name.lower()] = section_content
        
    return sections

def extract_languages_from_section(langues_section_text):
    text_lower = langues_section_text.lower()
    languages_data = []
    langues_a_chercher = r'(anglais|espagnol|allemand|chinois|japonais|italien|arabe|portugais|russe|francais)'
    
    # <-- CORRECTION N°2 (FINALE) : Ajout de "professionnel" pour matcher votre CV
    niveaux_standard = r'(a\d|b\d|c\d|natif|courant|professionnel|intermediaire|debutant|lu|ecrit)'
    
    # Le texte nettoyé est "Français Courant Anglais Professionnel"
    pattern = re.compile(rf'({langues_a_chercher})\s+({niveaux_standard})', re.IGNORECASE)
    
    for match in pattern.finditer(text_lower):
        langue = match.group(1).capitalize()
        niveau = match.group(2).upper().replace('É', 'E')
        
        if (langue, niveau) not in languages_data:
            languages_data.append((langue, niveau))
            
    return ", ".join([f"{l}:{n}" for l, n in languages_data])

def analyze_cv_metadata(raw_cv_text):
    """Fonction Maîtresse (COPIÉE DE COLAB)"""
    if not raw_cv_text:
        return {}
    
    cv_text_clean = clean_text(raw_cv_text)
    sections = extract_cv_sections(cv_text_clean)
    
    # On cherche les compétences dans le texte TOTAL
    competences_cles = extract_competences(cv_text_clean)
    
    experience_section_text = sections.get('experience', '')
    # On estime le niveau d'expérience sur tout le CV pour plus de robustesse
    experience_level_estimee = extract_experience_level(cv_text_clean)
    
    formation_section_text = sections.get('formation', '')
    
    langues_section_text = sections.get('langues', '')
    # Si la section est vide, on tente de chercher dans tout le CV
    if not langues_section_text:
        langues_section_text = cv_text_clean
        
    langues_structurees = extract_languages_from_section(langues_section_text)
    
    return {
        "text_nettoye": cv_text_clean,
        "experience_bloc_texte": experience_section_text,
        "experience_niveau_estime": experience_level_estimee,
        "formation_bloc_texte": formation_section_text,
        "competences_cles": competences_cles,
        "langues_structurees": langues_structurees
    }

# ==============================================================================
# ÉTAPE 3 : MODÈLE ET SCORING (COPIÉ DE COLAB)
# ==============================================================================

def load_model(model_name: str = 'all-mpnet-base-v2') -> SentenceTransformer:
    """Charge le modèle SentenceTransformer."""
    return SentenceTransformer(model_name)

def get_embedding(model: SentenceTransformer, text_list: list):
    """Convertit une liste de textes en vecteurs (embeddings)."""
    return model.encode(text_list, convert_to_tensor=True)

def calculate_job_fit_score(cv_vector, jd_vector):
    """Calcule le score de similarité cosinus (0-100)."""
    cv_np = cv_vector.cpu().numpy().reshape(1, -1)
    jd_np = jd_vector.cpu().numpy().reshape(1, -1)
    
    similarity = cosine_similarity(cv_np, jd_np)[0][0]
    
    # Normalisation : S-BERT donne souvent entre 0 et 1.
    # On ramène à 0-100.
    score = round(max(0, similarity) * 100, 2)
    return score