pipeline {
    agent any

    stages {

        stage('Checkout Repo') {
            steps {
                git branch: 'main', url: 'https://github.com/rafliafriza12/rbx-project-backup.git'
            }
        }

        stage('Install Dependencies') {
            steps {
                dir('/home/rbxnet/rbx-project') {
                    sh 'pnpm install'
                }
            }
        }

        stage('Build Next.js') {
            steps {
                dir('/home/rbxnet/rbx-project') {
                    sh 'pnpm build'
                }
            }
        }

        stage('Restart PM2') {
            steps {
                sh """
                    pm2 restart rbxnet
                """
            }
        }
    }
}
