pipeline {
    // On ne met pas d'agent global, on choisit un agent par stage
    agent none

    environment {
        SONAR_HOST_URL = 'http://sonarqube:9000'
        SONAR_LOGIN    = credentials('sonar-token')  // déjà créé dans Jenkins
    }

    stages {
        stage('Checkout') {
            agent any
            steps {
                checkout scm
            }
        }

        stage('Backend - Build & Tests & Sonar') {
            agent {
                docker {
                    image 'maven:3.9-eclipse-temurin-21'
                    // Jenkins monte automatiquement le workspace dans le conteneur
                }
            }
            steps {
                dir('backend/resume-service') {
                  sh """
                 mvn clean verify sonar:sonar \
                 -DskipTests \
                 -Dsonar.host.url=${SONAR_HOST_URL} \
                -Dsonar.login=${SONAR_LOGIN}
                     """
}

            }
        }

        stage('FastAPI - Tests') {
            agent {
                docker {
                    image 'python:3.11'
                }
            }
            steps {
                dir('ai-matching-fast-api') {
                    sh '''
                        python -m pip install --upgrade pip
                        pip install -r requirements.txt
                        # pytest  # si tu ajoutes des tests
                    '''
                }
            }
        }

        stage('Frontend - Build') {
            agent {
                docker {
                    image 'node:20'
                }
            }
            steps {
                dir('frontend') {
                    sh '''
                        npm install
                        npm run build
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            // Ici on peut réutiliser l’agent Jenkins classique (qui a accès au daemon Docker)
            agent any
            steps {
                sh '''
                    docker build -t ai-backend:latest backend/resume-service
                    docker build -t ai-fastapi:latest ai-matching-fast-api
                    docker build -t ai-frontend:latest frontend
                '''
            }
        }
    }

    post {
        always {
            echo 'Pipeline terminé (succès ou échec).'
        }
    }
}
