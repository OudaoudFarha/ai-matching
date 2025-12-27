FROM jenkins/jenkins:lts

USER root

# Installer le client Docker
RUN apt-get update && \
    apt-get install -y docker.io && \
    rm -rf /var/lib/apt/lists/*

# revenir à l’utilisateur jenkins pour l’exécution normale
USER jenkins
