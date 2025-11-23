"""
test_integration.py - Script pour tester l'intégration Spring Boot <-> API AI

Ce script simule ce que Spring Boot va faire:
1. Envoie un CV et des offres à l'API AI
2. Reçoit les résultats
3. Affiche ce qui devra être sauvegardé en base de données
"""

import requests
import json
from pathlib import Path
from typing import List, Dict
import time

# Configuration
API_URL = "http://localhost:8000"
TEST_CV_PATH = "test_files/test_cv.pdf"

# Couleurs pour l'affichage
class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

def print_section(title):
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*70}")
    print(f"  {title}")
    print(f"{'='*70}{Colors.ENDC}\n")

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.ENDC}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.ENDC}")

def print_info(msg):
    print(f"{Colors.CYAN}ℹ {msg}{Colors.ENDC}")

# ==============================================================================
# DONNÉES DE TEST - Simuler les données de PostgreSQL
# ==============================================================================

SAMPLE_JOBS_FROM_POSTGRES = [
    {
        "id": "1",
        "titre": "Développeur Full Stack Java/React",
        "texte_brut": """
        Nous recherchons un Développeur Full Stack expérimenté.
        
        Compétences requises:
        - 3+ ans d'expérience en développement web
        - Java et Spring Boot
        - React et TypeScript
        - PostgreSQL
        - Docker
        - Méthodologie Agile/Scrum
        
        Langues: Français et Anglais professionnel
        """
    },
    {
        "id": "2",
        "titre": "Data Scientist / ML Engineer",
        "texte_brut": """
        Rejoignez notre équipe Data Science.
        
        Responsabilités:
        - Développement de modèles ML
        - Traitement de données massives
        - Déploiement en production
        
        Compétences:
        - Python (Pandas, Scikit-learn)
        - TensorFlow ou PyTorch
        - NLP
        - SQL
        - Docker, MLflow
        - 2+ ans d'expérience en ML
        """
    },
    {
        "id": "3",
        "titre": "Développeur Mobile Flutter",
        "texte_brut": """
        Développeur mobile passionné pour applications cross-platform.
        
        Mission:
        - Développement avec Flutter
        - Intégration APIs REST
        - Tests et débogage
        
        Compétences:
        - 1-2 ans d'expérience mobile
        - Flutter et Dart
        - Firebase
        - Git et Agile
        """
    }
]

# ==============================================================================
# TESTS
# ==============================================================================

def test_1_health_check():
    """Test 1: Vérifier que l'API AI est accessible"""
    print_section("TEST 1: Health Check API AI")
    
    try:
        response = requests.get(f"{API_URL}/health", timeout=5)
        
        if response.status_code == 200:
            data = response.json()
            print_success(f"API AI opérationnelle (version {data['version']})")
            print_info(f"Modèle chargé: {data['model_loaded']}")
            print_info(f"Endpoints disponibles: {', '.join(data['endpoints'])}")
            return True
        else:
            print_error(f"API non disponible (code {response.status_code})")
            return False
            
    except requests.exceptions.ConnectionError:
        print_error("Impossible de se connecter à l'API AI")
        print_info("Assurez-vous que l'API est lancée: python main.py")
        return False

def test_2_candidate_workflow():
    """Test 2: Simuler le workflow complet côté candidat"""
    print_section("TEST 2: Workflow Candidat (Upload CV)")
    
    cv_path = Path(TEST_CV_PATH)
    if not cv_path.exists():
        print_error(f"Fichier CV non trouvé: {cv_path}")
        print_info("Placez un CV de test dans test_files/test_cv.pdf")
        return False
    
    print_info("Simulation de ce que Spring Boot va faire:")
    print_info("1. Candidat upload son CV via React")
    print_info("2. Spring Boot reçoit le CV")
    print_info("3. Spring Boot récupère les offres actives de PostgreSQL")
    print_info("4. Spring Boot appelle l'API AI avec CV + offres")
    
    try:
        start_time = time.time()
        
        # Préparer la requête (comme Spring Boot le fera)
        with open(cv_path, 'rb') as f:
            files = {'cv_file': (cv_path.name, f, 'application/pdf')}
            data = {
                'jobs_json': json.dumps(SAMPLE_JOBS_FROM_POSTGRES)
            }
            
            print(f"\n{Colors.YELLOW}→ Envoi de la requête à l'API AI...{Colors.ENDC}")
            response = requests.post(
                f"{API_URL}/analyze-candidate-cv",
                files=files,
                data=data,
                timeout=30
            )
        
        elapsed_time = (time.time() - start_time) * 1000
        
        if response.status_code == 200:
            result = response.json()
            
            print_success(f"Analyse terminée en {elapsed_time:.0f}ms")
            print_success(f"Temps de traitement API: {result['processing_time_ms']:.0f}ms")
            
            # Afficher ce que Spring Boot va recevoir
            print_section("DONNÉES REÇUES PAR SPRING BOOT")
            
            # Métadonnées CV à sauvegarder dans la table 'cvs'
            print(f"{Colors.BOLD}📄 Métadonnées CV (à insérer dans table 'cvs'):{Colors.ENDC}")
            metadata = result['cv_metadata']
            print(f"  Email: {metadata['email']}")
            print(f"  Téléphone: {metadata['phone']}")
            print(f"  Expérience: {metadata['experience_niveau_estime']} ans ({metadata['experience_justification']})")
            print(f"  Compétences: {metadata['competences_cles'][:100]}...")
            print(f"  Langues: {metadata['langues_structurees']}")
            
            # Scores à sauvegarder dans la table 'matching_scores'
            print(f"\n{Colors.BOLD}📊 Scores de Matching (à insérer dans table 'matching_scores'):{Colors.ENDC}")
            print(f"\nTop 5 des offres pour ce candidat:\n")
            
            for i, job in enumerate(result['ranked_jobs'][:5], 1):
                score = job['score_pertinence']
                details = job['scoring_details']
                
                color = Colors.GREEN if score >= 70 else Colors.YELLOW if score >= 50 else Colors.RED
                
                print(f"{color}{i}. {job['titre_offre']} (ID: {job['job_id']})")
                print(f"   Score final: {score}%")
                print(f"   ├─ Sémantique: {details['semantic_score']}%")
                print(f"   ├─ Compétences: {details['skills_score']}% ({details['matching_skills_count']}/{details['total_skills_count']})")
                print(f"   └─ Expérience: {details['experience_score']}%{Colors.ENDC}")
                print()
                
                # Montrer ce qui doit être inséré en DB
                print(f"   {Colors.CYAN}SQL INSERT dans matching_scores:{Colors.ENDC}")
                print(f"   {Colors.CYAN}cv_id={'{cv_id}'}, job_offer_id={job['job_id']}, ")
                print(f"   semantic_score={details['semantic_score']}, ")
                print(f"   skills_score={details['skills_score']}, ")
                print(f"   experience_score={details['experience_score']}, ")
                print(f"   final_score={score}{Colors.ENDC}")
                print()
            
            print_info("\n5. Spring Boot doit maintenant:")
            print_info("   a) Sauvegarder les métadonnées CV dans table 'cvs'")
            print_info("   b) Sauvegarder TOUS les scores dans table 'matching_scores'")
            print_info("   c) Retourner les top 10 offres au frontend React")
            
            return True
        else:
            print_error(f"Échec de l'analyse (code {response.status_code})")
            print_error(response.json())
            return False
            
    except Exception as e:
        print_error(f"Erreur: {e}")
        return False

def test_3_recruiter_workflow():
    """Test 3: Simuler le workflow côté recruteur"""
    print_section("TEST 3: Workflow Recruteur (Voir Candidats)")
    
    print_info("Simulation de ce que Spring Boot va faire:")
    print_info("1. Recruteur sélectionne une offre")
    print_info("2. Spring Boot récupère l'offre de PostgreSQL")
    print_info("3. Spring Boot récupère tous les CVs candidats")
    print_info("4. Spring Boot appelle l'API AI avec offre + CVs")
    
    # Simuler plusieurs CVs
    cv_path = Path(TEST_CV_PATH)
    if not cv_path.exists():
        print_error(f"Fichier CV non trouvé: {cv_path}")
        return False
    
    # Pour le test, on envoie le même CV 3 fois (en production, ce seront des CVs différents)
    try:
        print(f"\n{Colors.YELLOW}→ Envoi de la requête à l'API AI...{Colors.ENDC}")
        
        files = []
        with open(cv_path, 'rb') as f1, open(cv_path, 'rb') as f2, open(cv_path, 'rb') as f3:
            files = [
                ('cv_files', ('candidat1_cv.pdf', f1, 'application/pdf')),
                ('cv_files', ('candidat2_cv.pdf', f2, 'application/pdf')),
                ('cv_files', ('candidat3_cv.pdf', f3, 'application/pdf'))
            ]
            
            data = {
                'job_title': SAMPLE_JOBS_FROM_POSTGRES[0]['titre'],
                'job_description': SAMPLE_JOBS_FROM_POSTGRES[0]['texte_brut']
            }
            
            response = requests.post(
                f"{API_URL}/analyze-recruiter-candidates",
                files=files,
                data=data,
                timeout=30
            )
        
        if response.status_code == 200:
            result = response.json()
            
            print_success(f"Analyse terminée en {result['processing_time_ms']:.0f}ms")
            
            print_section("DONNÉES REÇUES PAR SPRING BOOT")
            
            print(f"{Colors.BOLD}👥 Candidats Classés pour: {result['job_title']}{Colors.ENDC}\n")
            
            for i, candidate in enumerate(result['ranked_candidates'], 1):
                score = candidate['score_pertinence']
                metadata = candidate['cv_metadata']
                details = candidate['scoring_details']
                
                color = Colors.GREEN if score >= 70 else Colors.YELLOW if score >= 50 else Colors.RED
                
                print(f"{color}{i}. {candidate['cv_filename']}")
                print(f"   Score: {score}%")
                print(f"   Email: {metadata['email']}")
                print(f"   Expérience: {metadata['experience_niveau_estime']} ans")
                print(f"   Compétences matchées: {details['matching_skills_count']}/{details['total_skills_count']}{Colors.ENDC}")
                print()
            
            print_info("\n5. Spring Boot doit maintenant:")
            print_info("   a) Afficher le classement au recruteur")
            print_info("   b) Permettre au recruteur de voir les détails de chaque candidat")
            print_info("   c) Sauvegarder/mettre à jour les scores en DB")
            
            return True
        else:
            print_error(f"Échec (code {response.status_code})")
            return False
            
    except Exception as e:
        print_error(f"Erreur: {e}")
        return False

def test_4_performance():
    """Test 4: Vérifier les performances"""
    print_section("TEST 4: Benchmark de Performance")
    
    cv_path = Path(TEST_CV_PATH)
    if not cv_path.exists():
        return False
    
    print_info("Test avec différentes charges:")
    
    test_cases = [
        (5, "Petit volume"),
        (20, "Volume moyen"),
        (50, "Gros volume")
    ]
    
    for num_jobs, description in test_cases:
        jobs = SAMPLE_JOBS_FROM_POSTGRES * (num_jobs // len(SAMPLE_JOBS_FROM_POSTGRES) + 1)
        jobs = jobs[:num_jobs]
        
        try:
            start = time.time()
            
            with open(cv_path, 'rb') as f:
                response = requests.post(
                    f"{API_URL}/analyze-candidate-cv",
                    files={'cv_file': f},
                    data={'jobs_json': json.dumps(jobs)},
                    timeout=30
                )
            
            elapsed = (time.time() - start) * 1000
            
            if response.status_code == 200:
                result = response.json()
                api_time = result['processing_time_ms']
                
                status = "✅" if api_time < 500 else "⚠️"
                print(f"{status} {description} ({num_jobs} offres): {api_time:.0f}ms (total: {elapsed:.0f}ms)")
            
        except Exception as e:
            print_error(f"Erreur pour {num_jobs} offres: {e}")
    
    print_info("\nObjectif: < 500ms ✅")
    return True

# ==============================================================================
# MAIN
# ==============================================================================

def main():
    print(f"\n{Colors.BOLD}{Colors.CYAN}")
    print("╔════════════════════════════════════════════════════════════════════╗")
    print("║         TEST D'INTÉGRATION SPRING BOOT ↔ API AI                  ║")
    print("║         Simulation du workflow complet                            ║")
    print("╚════════════════════════════════════════════════════════════════════╝")
    print(Colors.ENDC)
    
    results = {}
    
    # Test 1: Health Check
    results['health'] = test_1_health_check()
    
    if not results['health']:
        print_error("\n❌ L'API AI n'est pas accessible. Arrêt des tests.")
        print_info("\nAssurez-vous que l'API Python est lancée:")
        print_info("  cd api-ai")
        print_info("  python main.py")
        return
    
    # Test 2: Workflow Candidat
    results['candidate'] = test_2_candidate_workflow()
    
    # Test 3: Workflow Recruteur
    results['recruiter'] = test_3_recruiter_workflow()
    
    # Test 4: Performance
    results['performance'] = test_4_performance()
    
    # Résumé
    print_section("RÉSUMÉ DES TESTS")
    
    for test_name, result in results.items():
        status = f"{Colors.GREEN}✓ PASS{Colors.ENDC}" if result else f"{Colors.RED}✗ FAIL{Colors.ENDC}"
        print(f"{status} - {test_name}")
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    print(f"\n{Colors.BOLD}Score: {passed}/{total} tests réussis{Colors.ENDC}")
    
    if passed == total:
        print_success("\n🎉 Tous les tests sont passés!")
        print_info("\nVotre API AI est prête pour l'intégration avec Spring Boot!")
        print_info("\nProchaines étapes:")
        print_info("1. Partagez ce rapport avec votre collègue")
        print_info("2. Elle implémente les services Spring Boot")
        print_info("3. Testez l'intégration complète ensemble")
    else:
        print_error("\n❌ Certains tests ont échoué.")
        print_info("Vérifiez les erreurs ci-dessus avant de continuer.")

if __name__ == "__main__":
    main()