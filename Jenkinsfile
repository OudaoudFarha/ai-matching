pipeline {
    agent none

    environment {
        // On garde l'URL, mais le token sera géré par Jenkins
        SONAR_HOST_URL = 'http://sonarqube:9000'
    }

    stages {
        stage('Checkout') {
            agent any
            steps {
                checkout scm
            }
        }

        stage('Backend - Build') {
            agent {
                docker {
                    image 'maven:3.9-eclipse-temurin-21'
                    args '--network dev-net'
                }
            }
            steps {
                dir('backend/resume-service') {
                    sh """
                        mvn clean verify -DskipTests
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
                dir('frontend/resume-ui') {
                    sh '''
                        npm install
                        npm run build
                    '''
                }
            }
        }

        stage('SonarQube Analysis') {
            agent {
                docker {
                    image 'maven:3.9-eclipse-temurin-21'
                    args '--network dev-net'
                }
            }
            steps {
                // scannerName doit être le même que dans "Global Tool Configuration"
                withSonarQubeEnv('sonarqube') {
                    script {
                        def scannerHome = tool 'sonar-scanner'
                        dir('backend/resume-service') {
                            sh """
                                ${scannerHome}/bin/sonar-scanner \
                                  -Dsonar.projectKey=resume-service \
                                  -Dsonar.projectName=resume-service \
                                  -Dsonar.sources=src/main/java \
                                  -Dsonar.java.binaries=target/classes \
                                  -Dsonar.host.url=${SONAR_HOST_URL}
                            """
                        }
                    }
                }
            }
        }

        stage('Build Docker Images') {
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
