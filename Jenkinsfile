pipeline {
    agent any
    stages {

        stage('Clone') { // for display purposes
            // Get some code from a GitHub repository
            steps {
                script {
                    git url: 'https://github.com/BrokenFire/MinecraftUpdateServer.git', branch: 'master'
                }
            }


        }

        stage('Build Docker image') {
            /* This builds the actual image; synonymous to
             * docker build on the command line */
            steps{
                script{
                    app = docker.build("brokenfire/mcupdateserver",'--rm=true .')
                }

            }

        }
        stage('Push Docker image') {
            /* Finally, we'll push the image with two tags:
             * First, the incremental build number from Jenkins
             * Second, the 'latest' tag.
             * Pushing multiple tags is cheap, as all the layers are reused. */
            steps{
                withCredentials([[$class: 'UsernamePasswordMultiBinding', credentialsId: 'docker-hub-credentials', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD']]) {
                    sh 'docker login -u $USERNAME -p $PASSWORD'
                    script {
                            app.push("latest")
                    }
                }
            }
        }
        stage('Cleaning'){
            steps{
                sh "docker image prune -f"
            }

        }
    }
}