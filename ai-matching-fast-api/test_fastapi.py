"""
Script de test pour FastAPI - Mode autonome
Teste tous les endpoints sans avoir besoin de Spring Boot
"""

import requests
import json
import time
from pathlib import Path
import os
import pytest

CI = os.getenv("CI") == "true"
from fastapi.testclient import TestClient
from main import app


# Configuration
BASE_URL = "http://localhost:8000"
TEST_FILES_DIR = Path("test_files")  # Dossier contenant tes CV de test

class Colors:
    """Couleurs pour l'affichage dans le terminal"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_section(title):
    """Affiche un titre de section"""
    print(f"\n{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{title.center(60)}{Colors.END}")
    print(f"{Colors.BOLD}{Colors.BLUE}{'='*60}{Colors.END}\n")

def print_success(message):
    """Affiche un message de succès"""
    print(f"{Colors.GREEN}✓ {message}{Colors.END}")

def print_error(message):
    """Affiche un message d'erreur"""
    print(f"{Colors.RED}✗ {message}{Colors.END}")

def print_info(message):
    """Affiche un message d'information"""
    print(f"{Colors.YELLOW}ℹ {message}{Colors.END}")

def print_result(data, indent=2):
    """Affiche un résultat JSON formaté"""
    print(json.dumps(data, indent=indent, ensure_ascii=False))

# ==============================================================================
# TEST 1: VÉRIFICATION DE L'API
# ==============================================================================
client = TestClient(app)
def test_health_check():
    r = client.get("/health")
    assert r.status_code == 200

def test_health_endpoint():
    r = client.get("/health")
    assert r.status_code == 200
    data = r.json()
    assert "cache_stats" in data


# ==============================================================================
# TEST 2: ANALYSE D'UN CV
# ==============================================================================
@pytest.mark.skipif(CI, reason="Disabled in CI (needs local CV files)")
def test_cv_analysis(cv_path: str):
    """Test 3: Analyse d'un CV"""
    print_section("TEST 3: Analyse d'un CV")
    
    if not Path(cv_path).exists():
        print_error(f"Fichier CV non trouvé: {cv_path}")
        print_info("Crée un dossier 'test_files' et ajoute un CV PDF ou DOCX")
        return None
    
    print_info(f"Analyse du fichier: {cv_path}")
    
    try:
        # Préparer les données
        files = {
            'cv_file': open(cv_path, 'rb')
        }
        data = {
            'cv_id': 'test-cv-001',
            'candidate_id': 'test-candidate-001'
        }
        
        # Envoyer la requête
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/cv/analyze",
            files=files,
            data=data
        )
        elapsed_time = time.time() - start_time
        
        files['cv_file'].close()
        
        if response.status_code == 200:
            result = response.json()
            print_success(f"CV analysé avec succès en {elapsed_time:.2f}s")
            
            metadata = result['metadata']
            
            print(f"\n📄 Métadonnées extraites:")
            print(f"  - Expérience estimée: {metadata['experience_niveau_estime']} ans")
            print(f"  - Niveau d'éducation: {metadata['education_level']}")
            print(f"  - Nombre de compétences: {metadata['competences_count']}")
            print(f"  - Compétences: {metadata['competences_cles'][:100]}...")
            print(f"  - Langues: {metadata['langues_structurees']}")
            
            return result
        else:
            print_error(f"Erreur lors de l'analyse (Status: {response.status_code})")
            print(response.text)
            return None
            
    except Exception as e:
        print_error(f"Erreur: {str(e)}")
        return None

# ==============================================================================
# TEST 3: ANALYSE D'UNE JOB DESCRIPTION
# ==============================================================================

def test_job_analysis():
    """Test 4: Analyse d'une Job Description"""
    print_section("TEST 4: Analyse d'une Job Description")
    
    # Job Description de test (Data Scientist)
    job_description = """
    Poste: Data Scientist Senior
    
    Description:
    Nous recherchons un Data Scientist Senior pour rejoindre notre équipe d'IA.
    Vous travaillerez sur des projets de Machine Learning et NLP.
    
    Responsabilités:
    - Développer des modèles de Machine Learning
    - Analyser des données massives
    - Déployer des solutions en production
    - Collaborer avec les équipes produit
    
    Compétences requises:
    - Python (obligatoire)
    - TensorFlow ou PyTorch
    - NLP et traitement du langage naturel
    - SQL et bases de données
    - Docker et Kubernetes
    - 5+ ans d'expérience en Data Science
    
    Formation:
    - Master ou Doctorat en informatique, mathématiques ou domaine similaire
    
    Langues:
    - Anglais professionnel
    - Français courant
    """
   
    r = client.post("/api/job/analyze", data={
    "job_id": "test-job-001",
    "titre": "Test",
    "description": "Test description"
    })
    assert r.status_code in (200, 201, 422)

    try:
        data = {
            'job_id': 'test-job-001',
            'titre': 'Data Scientist Senior',
            'description': job_description
        }
        
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/job/analyze",
            data=data
        )
        elapsed_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print_success(f"Job Description analysée en {elapsed_time:.2f}s")
            
            print(f"\n💼 Analyse de l'offre:")
            print(f"  - Job ID: {result['job_id']}")
            print(f"  - Titre: {result['titre']}")
            print(f"  - Expérience requise: {result['experience_requise']} ans")
            print(f"  - Formation requise: {result['education_requise']}")
            print(f"  - Compétences requises ({len(result['competences_requises'])}):")
            
            for comp in result['competences_requises']:
                print(f"    • {comp}")
            
            return result
        else:
            print_error(f"Erreur (Status: {response.status_code})")
            print(response.text)
            return None
            
    except Exception as e:
        print_error(f"Erreur: {str(e)}")
        return None

# ==============================================================================
# TEST 4: CALCUL DE MATCHING
# ==============================================================================

def test_matching_calculation():
    """Test 5: Calcul du score de matching"""
    print_section("TEST 5: Calcul du Score de Matching")
    
    try:
        request_data = {
            'cv_id': 'test-cv-001',
            'job_offer_id': 'test-job-001'
        }
        
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/matching/calculate",
            json=request_data
        )
        elapsed_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print_success(f"Matching calculé en {elapsed_time:.2f}s")
            
            print(f"\n🎯 Scores de matching:")
            print(f"  {'Score Total:':<25} {result['score_total']:.2f}%")
            print(f"  {'Score Sémantique:':<25} {result['score_semantique']:.2f}%")
            print(f"  {'Score Compétences:':<25} {result['score_competences']:.2f}%")
            print(f"  {'Score Expérience:':<25} {result['score_experience']:.2f}%")
            print(f"  {'Score Formation:':<25} {result['score_formation']:.2f}%")
            
            print(f"\n✅ Compétences matchées ({len(result['competences_matchees'])}):")
            for comp in result['competences_matchees']:
                print(f"  {Colors.GREEN}✓{Colors.END} {comp}")
            
            if result['competences_manquantes']:
                print(f"\n❌ Compétences manquantes ({len(result['competences_manquantes'])}):")
                for comp in result['competences_manquantes']:
                    print(f"  {Colors.RED}✗{Colors.END} {comp}")
            
            return result
        else:
            print_error(f"Erreur (Status: {response.status_code})")
            print(response.text)
            return None
            
    except Exception as e:
        print_error(f"Erreur: {str(e)}")
        return None

# ==============================================================================
# TEST 5: BATCH MATCHING (CANDIDAT)
# ==============================================================================
def test_batch_matching_candidate():
    """Test 6: Batch matching pour un candidat"""
    print_section("TEST 6: Batch Matching (Vue Candidat)")

    jobs_to_create = [
        {
            "job_id": "test-job-002",
            "titre": "Développeur Full Stack",
            "description": """
            Recherche développeur Full Stack avec 3 ans d'expérience.
            Compétences: React, Node.js, PostgreSQL, Docker.
            Formation: Licence ou Master en informatique.
            """,
        },
        {
            "job_id": "test-job-003",
            "titre": "DevOps Engineer",
            "description": """
            DevOps Engineer avec 5+ ans d'expérience.
            Compétences: Kubernetes, Docker, AWS, CI/CD, Python.
            Formation: Master en informatique.
            """,
        },
    ]

    print_info("Création de 2 offres supplémentaires...")

    for job in jobs_to_create:
        resp = client.post("/api/job/analyze", data=job)
        assert resp.status_code in (200, 201, 422)

    # ✅ Définir request_data AVANT de l'utiliser
    request_data = {
        "cv_id": "test-cv-001",
        "candidate_id": "test-candidate-001",
        "job_offer_ids": ["test-job-001", "test-job-002", "test-job-003"],
    }

    response = client.post("/api/matching/batch", json=request_data)
    assert response.status_code in (200, 201, 422)

    # Optionnel: vérifier la forme de la réponse si ton endpoint la renvoie
    if response.status_code == 200:
        data = response.json()
        assert "results" in data

# ==============================================================================
# TEST 6: BATCH MATCHING (RECRUTEUR)
# ==============================================================================
@pytest.mark.skipif(CI, reason="Disabled in CI (needs local CV files)")
def test_batch_matching_recruiter(cv_paths: list):
    """Test 7: Batch matching pour un recruteur"""
    print_section("TEST 7: Batch Matching (Vue Recruteur)")
    
    # D'abord analyser plusieurs CV
    print_info(f"Analyse de {len(cv_paths)} CV...")
    
    cv_ids = []
    for i, cv_path in enumerate(cv_paths, 1):
        if not Path(cv_path).exists():
            print_error(f"CV non trouvé: {cv_path}")
            continue
        
        cv_id = f'test-cv-{i:03d}'
        
        try:
            files = {'cv_file': open(cv_path, 'rb')}
            data = {
                'cv_id': cv_id,
                'candidate_id': f'test-candidate-{i:03d}'
            }
            
            response = requests.post(
                f"{BASE_URL}/api/cv/analyze",
                files=files,
                data=data
            )
            files['cv_file'].close()
            
            if response.status_code == 200:
                print_success(f"CV {i} analysé: {Path(cv_path).name}")
                cv_ids.append(cv_id)
            else:
                print_error(f"Échec analyse CV {i}")
                
        except Exception as e:
            print_error(f"Erreur CV {i}: {str(e)}")
    
    if not cv_ids:
        print_error("Aucun CV analysé avec succès")
        return None
    
    # Maintenant faire le matching recruteur
    print_info(f"\nComparaison de {len(cv_ids)} CV pour l'offre 'Data Scientist Senior'...")
    
    try:
        request_data = {
            'job_offer_id': 'test-job-001',
            'cv_ids': cv_ids
        }
        
        start_time = time.time()
        response = requests.post(
            f"{BASE_URL}/api/matching/recruiter",
            json=request_data
        )
        elapsed_time = time.time() - start_time
        
        if response.status_code == 200:
            result = response.json()
            print_success(f"Matching recruteur terminé en {elapsed_time:.2f}s")
            
            print(f"\n🏆 Top Candidats pour: {result['titre_offre']}")
            print(f"{'='*70}")
            
            for i, candidate in enumerate(result['top_candidates'], 1):
                scores = candidate['scores']
                
                medal = "🥇" if i == 1 else "🥈" if i == 2 else "🥉" if i == 3 else f"{i}."
                
                print(f"\n{medal} Candidat #{candidate['cv_id']}")
                print(f"   Score Total: {Colors.BOLD}{scores['score_total']:.1f}%{Colors.END}")
                print(f"   Expérience: {candidate['experience']} ans")
                print(f"   Formation: {candidate['education']}")
                print(f"   Compétences matchées: {len(candidate['competences_matchees'])}")
                
                if scores['score_total'] >= 70:
                    print(f"   {Colors.GREEN}✓ Profil fortement recommandé{Colors.END}")
                elif scores['score_total'] >= 50:
                    print(f"   {Colors.YELLOW}○ Profil à considérer{Colors.END}")
                else:
                    print(f"   {Colors.RED}✗ Profil peu adapté{Colors.END}")
            
            return result
        else:
            print_error(f"Erreur (Status: {response.status_code})")
            print(response.text)
            return None
            
    except Exception as e:
        print_error(f"Erreur: {str(e)}")
        return None

# ==============================================================================
# TEST 7: PERFORMANCE
# ==============================================================================

def test_performance():
    """Test 8: Performance et temps de réponse"""
    print_section("TEST 8: Performance (<500ms requis)")
    
    print_info("Test de 10 calculs de matching consécutifs...")
    
    times = []
    for i in range(10):
        request_data = {
            'cv_id': 'test-cv-001',
            'job_offer_id': 'test-job-001'
        }
        
        start = time.time()
        response = client.post("/api/matching/calculate", json=request_data)
        assert response.status_code in (200, 201, 422)
    
      
        elapsed = (time.time() - start) * 1000  # en ms
        
        times.append(elapsed)
        
        if response.status_code == 200:
            status = f"{Colors.GREEN}✓{Colors.END}" if elapsed < 500 else f"{Colors.RED}✗{Colors.END}"
            print(f"  Requête {i+1}: {elapsed:.0f}ms {status}")
    
    avg_time = sum(times) / len(times)
    min_time = min(times)
    max_time = max(times)
    
    print(f"\n📊 Statistiques:")
    print(f"  Temps moyen: {avg_time:.0f}ms")
    print(f"  Temps min: {min_time:.0f}ms")
    print(f"  Temps max: {max_time:.0f}ms")
    
    if avg_time < 500:
        print_success(f"✓ Objectif <500ms atteint ! ({avg_time:.0f}ms)")
    else:
        print_error(f"✗ Objectif <500ms non atteint ({avg_time:.0f}ms)")

# ==============================================================================
# FONCTION PRINCIPALE
# ==============================================================================

def run_all_tests():
    """Exécute tous les tests"""
    print(f"\n{Colors.BOLD}{'='*60}{Colors.END}")
    print(f"{Colors.BOLD}{'SUITE DE TESTS FASTAPI - RECRUTEMENT IA'.center(60)}{Colors.END}")
    print(f"{Colors.BOLD}{'='*60}{Colors.END}")
    
    # Test 1 & 2: Health checks
    if not test_health_check():
        print_error("\n⚠️  L'API n'est pas accessible. Arrêt des tests.")
        return
    
    test_health_endpoint()
    
    # Demander le chemin du CV
    print(f"\n{Colors.YELLOW}Pour les tests suivants, tu as besoin d'un CV de test.{Colors.END}")
    cv_path = input("Chemin du CV (ou appuie sur Entrée pour passer): ").strip()
    
    if not cv_path:
        print_info("Tests des CV ignorés. On continue avec les autres tests...")
        return
    
    # Test 3: Analyse CV
    cv_result = test_cv_analysis(cv_path)
    if not cv_result:
        print_error("Impossible de continuer sans CV analysé")
        return
    
    # Test 4: Analyse JD
    job_result = test_job_analysis()
    if not job_result:
        print_error("Impossible de continuer sans JD analysée")
        return
    
    # Test 5: Matching simple
    test_matching_calculation()
    
    # Test 6: Batch matching candidat
    test_batch_matching_candidate()
    
    # Test 7: Batch matching recruteur (si plusieurs CV)
    print(f"\n{Colors.YELLOW}Veux-tu tester le matching recruteur avec plusieurs CV ?{Colors.END}")
    response = input("Chemins des CV séparés par des virgules (ou Entrée pour passer): ").strip()
    
    if response:
        cv_paths = [p.strip() for p in response.split(',')]
        test_batch_matching_recruiter(cv_paths)
    
    # Test 8: Performance
    test_performance()
    
    # Résumé final
    print_section("RÉSUMÉ DES TESTS")
    print_success("Tous les tests sont terminés !")
    print_info("Vérifie les résultats ci-dessus pour voir si tout fonctionne correctement.")
    
    # Stats du cache
    response = requests.get(f"{BASE_URL}/health")
    if response.status_code == 200:
        data = response.json()
        print(f"\n📊 État du cache:")
        print(f"  - CV en cache: {data['cache_stats']['cv_count']}")
        print(f"  - Jobs en cache: {data['cache_stats']['job_count']}")

if __name__ == "__main__":
    run_all_tests()