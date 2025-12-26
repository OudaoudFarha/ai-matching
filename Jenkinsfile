pipeline {
    agent any

    environment {
        SONAR_HOST_URL = 'http://sonarqube:9000'
        SONAR_LOGIN    = credentials('sonar-token') // à créer dans Jenkins
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend - Build & Tests & Sonar') {
            steps {
                dir('backend/resume-service') {
                    sh 'mvn clean verify sonar:sonar ' +
                       "-Dsonar.host.url=${SONAR_HOST_URL} " +
                       "-Dsonar.login=${SONAR_LOGIN}"
                }
            }
        }

        stage('FastAPI - Tests') {
            steps {
                dir('ai-matching-fast-api') {
                    sh 'python -m pip install -r requirements.txt'
                    // si tu as des tests :
                    // sh 'pytest'
                }
            }
        }

        stage('Frontend - Build') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                    // Si tu veux aussi Sonar ici, tu peux lancer sonar-scanner
                }
            }
        }

        // Optionnel : build images Docker
        stage('Build Docker Images') {
            steps {
                sh 'docker build -t ai-backend:latest backend/resume-service'
                sh 'docker build -t ai-fastapi:latest ai-matching-fast-api'
                sh 'docker build -t ai-frontend:latest frontend'
            }
        }
    }

    post {
        always {
            echo 'Pipeline terminé (succès ou échec).'
        }
    }
}
