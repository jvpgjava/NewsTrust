pipeline {
    agent any
    
    environment {
        NODE_VERSION = '18'
        BACKEND_DIR = 'backend'
        FRONTEND_DIR = 'frontend'
    }
    
    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        
        stage('Setup Node.js') {
            steps {
                script {
                    def nodeHome = tool name: 'NodeJS-18', type: 'jenkins.plugins.nodejs.tools.NodeJSInstallation'
                    env.PATH = "${nodeHome}/bin:${env.PATH}"
                }
            }
        }
        
        stage('Backend Build & Test') {
            steps {
                dir(BACKEND_DIR) {
                    sh 'npm ci'
                    sh 'npm run lint'
                    sh 'npm test'
                }
            }
        }
        
        stage('Frontend Build & Test') {
            steps {
                dir(FRONTEND_DIR) {
                    sh 'npm ci'
                    sh 'npm run lint'
                    sh 'npm run build'
                }
            }
        }
        
        stage('Database Migration') {
            steps {
                dir(BACKEND_DIR) {
                    sh 'npm run migrate'
                }
            }
        }
        
        stage('Deploy Backend') {
            steps {
                dir(BACKEND_DIR) {
                    sh 'npm run build'
                    // Aqui você pode adicionar comandos para deploy do backend
                    // Por exemplo: docker build, kubectl apply, etc.
                }
            }
        }
        
        stage('Deploy Frontend') {
            steps {
                dir(FRONTEND_DIR) {
                    // Aqui você pode adicionar comandos para deploy do frontend
                    // Por exemplo: docker build, kubectl apply, etc.
                }
            }
        }
    }
    
    post {
        always {
            cleanWs()
        }
        success {
            echo 'Deploy realizado com sucesso!'
        }
        failure {
            echo 'Deploy falhou! Verifique os logs.'
        }
    }
}
