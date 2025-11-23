pipeline {
    agent any

    environment {
        PROJECT_DIR = "/var/www/rbx-project"
    }

    stages {
        stage('Checkout Repo') {
            steps {
                git branch: 'main', url: 'https://github.com/rafliafriza12/rbx-project-backup.git'
            }
        }

        stage('Copy Repo to Project Directory') {
            steps {
                sh """
                    rm -rf ${PROJECT_DIR}/*
                    cp -r * ${PROJECT_DIR}
                """
            }
        }

        stage('Install Dependencies') {
            steps {
                dir("${PROJECT_DIR}") {
                    sh 'pnpm install'
                }
            }
        }

        stage('Build Next.js') {
            steps {
                dir("${PROJECT_DIR}") {
                    sh 'pnpm build'
                }
            }
        }

        stage('Restart PM2') {
            steps {
                sh """
                    pm2 stop rbxner || true
                    cd ${PROJECT_DIR}
                    pm2 start pnpm --name "rbxnet" -- start
                    pm2 save
                """
            }
        }
    }
}
