import requests
import json
import time
from pathlib import Path
from typing import List, Dict
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas as pd
from collections import defaultdict

API_URL = "http://localhost:8000"

# ==============================================================================
# 1. TRAITEMENT PAR LOT (BATCH PROCESSING)
# ==============================================================================

def batch_analyze_cvs(cv_folder: Path, jobs: List[Dict]) -> pd.DataFrame:
    """
    Analyse plusieurs CV en parallèle contre les mêmes offres.
    Utile pour: traiter 100+ candidatures rapidement
    """
    print(f"📦 Traitement par lot de {len(list(cv_folder.glob('*.pdf')))} CV...")
    
    results = []
    cv_files = list(cv_folder.glob('*.pdf')) + list(cv_folder.glob('*.docx'))
    
    def analyze_single_cv(cv_path):
        try:
            with open(cv_path, 'rb') as f:
                response = requests.post(
                    f"{API_URL}/analyze-candidate-cv",
                    files={'cv_file': f},
                    data={
                        'jobs_json': json.dumps(jobs),
                        'use_weighted_scoring': 'true'
                    },
                    timeout=30
                )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    'cv_filename': cv_path.name,
                    'processing_time': data['processing_time_ms'],
                    'ranked_jobs': data['ranked_jobs'],
                    'metadata': data['cv_metadata']
                }
        except Exception as e:
            print(f"❌ Erreur pour {cv_path.name}: {e}")
            return None
    
    # Traitement parallèle
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(analyze_single_cv, cv): cv for cv in cv_files}
        
        for future in as_completed(futures):
            result = future.result()
            if result:
                results.append(result)
                print(f"✓ {result['cv_filename']}: {result['processing_time']:.0f}ms")
    
    # Conversion en DataFrame pour analyse
    rows = []
    for result in results:
        for job in result['ranked_jobs'][:5]:  # Top 5 pour chaque CV
            rows.append({
                'cv_filename': result['cv_filename'],
                'job_id': job['job_id'],
                'job_title': job['titre_offre'],
                'score': job['score_pertinence'],
                'candidate_email': result['metadata'].get('email', 'N/A'),
                'experience_years': result['metadata']['experience_niveau_estime']
            })
    
    df = pd.DataFrame(rows)
    print(f"\n✅ {len(results)} CV traités avec succès")
    return df

# ==============================================================================
# 2. SYSTÈME DE CACHE INTELLIGENT
# ==============================================================================

class SmartCache:
    """Cache pour éviter de re-vectoriser les mêmes offres."""
    
    def __init__(self, cache_file='job_embeddings_cache.json'):
        self.cache_file = cache_file
        self.cache = self._load_cache()
    
    def _load_cache(self):
        try:
            with open(self.cache_file, 'r') as f:
                return json.load(f)
        except FileNotFoundError:
            return {}
    
    def save_cache(self):
        with open(self.cache_file, 'w') as f:
            json.dump(self.cache, f)
    
    def get_cached_analysis(self, cv_hash, job_ids):
        """Vérifie si cette analyse a déjà été faite."""
        cache_key = f"{cv_hash}_{'-'.join(sorted(job_ids))}"
        return self.cache.get(cache_key)
    
    def store_analysis(self, cv_hash, job_ids, result):
        """Stocke le résultat d'une analyse."""
        cache_key = f"{cv_hash}_{'-'.join(sorted(job_ids))}"
        self.cache[cache_key] = {
            'timestamp': time.time(),
            'result': result
        }
        self.save_cache()

def analyze_with_cache(cv_path: Path, jobs: List[Dict], cache: SmartCache):
    """Analyse un CV avec système de cache."""
    import hashlib
    
    # Hash du CV pour détecter les doublons
    with open(cv_path, 'rb') as f:
        cv_hash = hashlib.md5(f.read()).hexdigest()
    
    job_ids = [j['id'] for j in jobs]
    
    # Vérifier le cache
    cached_result = cache.get_cached_analysis(cv_hash, job_ids)
    if cached_result:
        age_hours = (time.time() - cached_result['timestamp']) / 3600
        if age_hours < 24:  # Cache valide 24h
            print(f"🔄 Utilisation du cache (âge: {age_hours:.1f}h)")
            return cached_result['result']
    
    # Analyse normale
    print("🆕 Nouvelle analyse...")
    with open(cv_path, 'rb') as f:
        response = requests.post(
            f"{API_URL}/analyze-candidate-cv",
            files={'cv_file': f},
            data={
                'jobs_json': json.dumps(jobs),
                'use_weighted_scoring': 'true'
            }
        )
    
    if response.status_code == 200:
        result = response.json()
        cache.store_analysis(cv_hash, job_ids, result)
        return result
    
    return None

# ==============================================================================
# 3. FILTRAGE AVANCÉ DES RÉSULTATS
# ==============================================================================

def filter_jobs_by_criteria(
    ranked_jobs: List[Dict],
    cv_metadata: Dict,
    min_score: float = 50.0,
    required_skills: List[str] = None,
    min_experience: int = None,
    max_experience: int = None
) -> List[Dict]:
    """
    Filtre les résultats selon des critères avancés.
    
    Args:
        ranked_jobs: Liste des offres classées
        cv_metadata: Métadonnées du CV
        min_score: Score minimum requis
        required_skills: Compétences obligatoires
        min_experience: Expérience minimum
        max_experience: Expérience maximum
    """
    filtered = []
    
    cv_skills = set(cv_metadata['competences_cles'].upper().split(', '))
    cv_experience = cv_metadata['experience_niveau_estime']
    
    for job in ranked_jobs:
        # Filtre par score
        if job['score_pertinence'] < min_score:
            continue
        
        # Filtre par compétences requises
        if required_skills:
            missing_skills = set(s.upper() for s in required_skills) - cv_skills
            if missing_skills:
                continue
        
        # Filtre par expérience
        if min_experience and cv_experience < min_experience:
            continue
        if max_experience and cv_experience > max_experience:
            continue
        
        filtered.append(job)
    
    return filtered

# ==============================================================================
# 4. ANALYTICS ET STATISTIQUES
# ==============================================================================

def generate_matching_analytics(results_df: pd.DataFrame) -> Dict:
    """
    Génère des statistiques détaillées sur les résultats de matching.
    """
    analytics = {
        'total_cvs': results_df['cv_filename'].nunique(),
        'total_jobs': results_df['job_id'].nunique(),
        'avg_score': results_df['score'].mean(),
        'median_score': results_df['score'].median(),
        'std_score': results_df['score'].std(),
        'score_distribution': {
            'excellent (>80)': len(results_df[results_df['score'] >= 80]),
            'good (60-80)': len(results_df[(results_df['score'] >= 60) & (results_df['score'] < 80)]),
            'average (40-60)': len(results_df[(results_df['score'] >= 40) & (results_df['score'] < 60)]),
            'poor (<40)': len(results_df[results_df['score'] < 40])
        },
        'top_jobs': results_df.groupby('job_title')['score'].agg(['mean', 'count']).sort_values('mean', ascending=False).head(5).to_dict(),
        'experience_distribution': results_df.groupby('experience_years').size().to_dict()
    }
    
    return analytics

def print_analytics(analytics: Dict):
    """Affiche les analytics de manière lisible."""
    print("\n" + "="*60)
    print("📊 ANALYTICS DE MATCHING")
    print("="*60)
    
    print(f"\n📈 Vue d'ensemble:")
    print(f"  • CV analysés: {analytics['total_cvs']}")
    print(f"  • Offres comparées: {analytics['total_jobs']}")
    print(f"  • Score moyen: {analytics['avg_score']:.2f}%")
    print(f"  • Score médian: {analytics['median_score']:.2f}%")
    print(f"  • Écart-type: {analytics['std_score']:.2f}")
    
    print(f"\n🎯 Distribution des scores:")
    for category, count in analytics['score_distribution'].items():
        percentage = (count / (analytics['total_cvs'] * analytics['total_jobs'])) * 100
        print(f"  • {category}: {count} ({percentage:.1f}%)")
    
    print(f"\n🏆 Top 5 des offres les plus matchées:")
    for i, (job, stats) in enumerate(analytics['top_jobs']['mean'].items(), 1):
        count = analytics['top_jobs']['count'][job]
        print(f"  {i}. {job}")
        print(f"     Score moyen: {stats:.2f}% | {count} matchs")

# ==============================================================================
# 5. RECOMMANDATIONS INTELLIGENTES
# ==============================================================================

def generate_recommendations(cv_metadata: Dict, ranked_jobs: List[Dict]) -> Dict:
    """
    Génère des recommandations personnalisées pour le candidat.
    """
    recommendations = {
        'profile_strengths': [],
        'improvement_areas': [],
        'best_opportunities': [],
        'skills_to_develop': []
    }
    
    # Analyser les forces
    cv_skills = set(cv_metadata['competences_cles'].split(', '))
    experience = cv_metadata['experience_niveau_estime']
    
    if experience >= 5:
        recommendations['profile_strengths'].append("Profil senior avec expérience significative")
    
    if len(cv_skills) > 10:
        recommendations['profile_strengths'].append("Large palette de compétences techniques")
    
    # Identifier les meilleures opportunités
    top_jobs = sorted(ranked_jobs, key=lambda x: x['score_pertinence'], reverse=True)[:5]
    for job in top_jobs:
        if job['score_pertinence'] >= 70:
            recommendations['best_opportunities'].append({
                'title': job['titre_offre'],
                'score': job['score_pertinence'],
                'reason': 'Excellent match avec votre profil'
            })
    
    # Compétences manquantes communes
    all_job_texts = ' '.join([j.get('texte_brut', '') for j in ranked_jobs[:10]])
    common_missing = []
    
    important_skills = ['DOCKER', 'KUBERNETES', 'AWS', 'REACT', 'PYTHON', 'SPRING BOOT']
    for skill in important_skills:
        if skill.upper() not in ' '.join(cv_skills).upper() and skill in all_job_texts.upper():
            common_missing.append(skill)
    
    if common_missing:
        recommendations['skills_to_develop'] = common_missing[:3]
    
    return recommendations

def print_recommendations(recommendations: Dict):
    """Affiche les recommandations."""
    print("\n" + "="*60)
    print("💡 RECOMMANDATIONS PERSONNALISÉES")
    print("="*60)
    
    if recommendations['profile_strengths']:
        print(f"\n✨ Forces de votre profil:")
        for strength in recommendations['profile_strengths']:
            print(f"  • {strength}")
    
    if recommendations['best_opportunities']:
        print(f"\n🎯 Meilleures opportunités pour vous:")
        for i, opp in enumerate(recommendations['best_opportunities'], 1):
            print(f"  {i}. {opp['title']} ({opp['score']:.1f}%)")
            print(f"     → {opp['reason']}")
    
    if recommendations['skills_to_develop']:
        print(f"\n📚 Compétences à développer:")
        for skill in recommendations['skills_to_develop']:
            print(f"  • {skill}")

# ==============================================================================
# 6. COMPARAISON DE CV (POUR RECRUTEURS)
# ==============================================================================

def compare_candidates(cv_paths: List[Path], job: Dict) -> pd.DataFrame:
    """
    Compare plusieurs candidats pour une même offre.
    Utile pour: recruteurs voulant voir le classement.
    """
    print(f"\n👔 Comparaison de {len(cv_paths)} candidats pour: {job['titre']}\n")
    
    candidates = []
    
    for cv_path in cv_paths:
        try:
            with open(cv_path, 'rb') as f:
                response = requests.post(
                    f"{API_URL}/analyze-candidate-cv",
                    files={'cv_file': f},
                    data={
                        'jobs_json': json.dumps([job]),
                        'use_weighted_scoring': 'true'
                    },
                    timeout=20
                )
            
            if response.status_code == 200:
                data = response.json()
                metadata = data['cv_metadata']
                job_match = data['ranked_jobs'][0]
                
                candidates.append({
                    'cv_filename': cv_path.name,
                    'score': job_match['score_pertinence'],
                    'experience': metadata['experience_niveau_estime'],
                    'skills': metadata['competences_cles'],
                    'languages': metadata['langues_structurees'],
                    'email': metadata.get('email', 'N/A'),
                    'phone': metadata.get('phone', 'N/A')
                })
                
                print(f"✓ {cv_path.name}: {job_match['score_pertinence']:.1f}%")
                
        except Exception as e:
            print(f"❌ Erreur pour {cv_path.name}: {e}")
    
    # Trier par score
    df = pd.DataFrame(candidates).sort_values('score', ascending=False)
    
    print(f"\n🏆 Classement final:")
    for i, row in df.head(10).iterrows():
        print(f"{i+1}. {row['cv_filename']} - {row['score']:.1f}% - {row['experience']}ans exp")
    
    return df

# ==============================================================================
# 7. EXPORT DES RÉSULTATS
# ==============================================================================

def export_results_to_excel(results_df: pd.DataFrame, output_file: str):
    """Exporte les résultats vers Excel avec formatage."""
    with pd.ExcelWriter(output_file, engine='openpyxl') as writer:
        results_df.to_excel(writer, sheet_name='Résultats', index=False)
        
        # Ajouter un onglet de statistiques
        analytics = generate_matching_analytics(results_df)
        stats_df = pd.DataFrame({
            'Métrique': ['CVs analysés', 'Offres', 'Score moyen', 'Score médian'],
            'Valeur': [
                analytics['total_cvs'],
                analytics['total_jobs'],
                f"{analytics['avg_score']:.2f}%",
                f"{analytics['median_score']:.2f}%"
            ]
        })
        stats_df.to_excel(writer, sheet_name='Statistiques', index=False)
    
    print(f"✅ Résultats exportés vers: {output_file}")

# ==============================================================================
# EXEMPLES D'UTILISATION
# ==============================================================================

if __name__ == "__main__":
    # Données de test
    jobs = [
        {
            "id": "1",
            "titre": "Développeur Full Stack",
            "texte_brut": "Recherche développeur Java/Spring Boot avec 3 ans d'expérience..."
        },
        {
            "id": "2",
            "titre": "Data Scientist",
            "texte_brut": "Profil ML/AI avec Python, TensorFlow..."
        }
    ]
    
    test_cv_folder = Path("test_files")
    
    print("🚀 EXEMPLES D'UTILISATION AVANCÉE")
    print("="*60)
    
    # Exemple 1: Batch processing
    # results_df = batch_analyze_cvs(test_cv_folder, jobs)
    
    # Exemple 2: Avec cache
    # cache = SmartCache()
    # result = analyze_with_cache(test_cv_folder / "test_cv.pdf", jobs, cache)
    
    # Exemple 3: Analytics
    # analytics = generate_matching_analytics(results_df)
    # print_analytics(analytics)
    
    # Exemple 4: Recommandations
    # recommendations = generate_recommendations(result['cv_metadata'], result['ranked_jobs'])
    # print_recommendations(recommendations)
    
    # Exemple 5: Export Excel
    # export_results_to_excel(results_df, 'matching_results.xlsx')
    
    print("\n💡 Décommentez les exemples ci-dessus pour les tester!")
    print("📚 Consultez le code pour plus de détails sur chaque fonction.")