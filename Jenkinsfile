pipeline {
    agent any

    environment {
        // ---- Matched to docker-compose.yml ----
        // DOCKER_REGISTRY is the registry HOST only (used for docker login).
        // This is Docker Hub's canonical registry endpoint -- do NOT append a namespace/username here.
        DOCKER_REGISTRY   = 'https://index.docker.io/v1/'
        DOCKER_NAMESPACE  = 'haritejarv'
        IMAGE_TAG         = "${env.BRANCH_NAME}-${env.BUILD_NUMBER}"

        FRONTEND_IMAGE_NAME = '3tier-frontend'
        BACKEND_IMAGE_NAME  = '3tier-backend'

        FRONTEND_FULL_IMAGE  = "${DOCKER_NAMESPACE}/${FRONTEND_IMAGE_NAME}:${IMAGE_TAG}"
        BACKEND_FULL_IMAGE   = "${DOCKER_NAMESPACE}/${BACKEND_IMAGE_NAME}:${IMAGE_TAG}"

        FRONTEND_DIR       = 'frontend'   // path within repo containing frontend Dockerfile
        BACKEND_DIR        = 'backend'    // path within repo containing backend Dockerfile

        EC2_HOST          = 'ec2-100-30-179-59.compute-1.amazonaws.com'
        EC2_USER          = 'ubuntu'

        APP_NETWORK       = 'app_network'

        FRONTEND_CONTAINER_NAME = 'app_frontend'
        BACKEND_CONTAINER_NAME  = 'app_backend'
        DB_CONTAINER_NAME       = 'app_db'

        FRONTEND_HOST_PORT      = '80'
        FRONTEND_CONTAINER_PORT = '80'
        BACKEND_HOST_PORT       = '5000'
        BACKEND_CONTAINER_PORT  = '5000'
        DB_HOST_PORT             = '3306'
        DB_CONTAINER_PORT        = '3306'

        DB_IMAGE          = 'mysql:8.0'
        DB_NAME           = 'appdb'
        DB_DATA_VOLUME    = 'db_data'
        // Path on the EC2 host containing init.sql, copied/cloned there separately
        // (see note below the pipeline about getting this file onto the box)
        DB_INIT_SQL_PATH  = '/home/ubuntu/database/init.sql'

        // Jenkins credential IDs
        DOCKER_CREDS_ID   = 'docker-registry-creds'
        EC2_SSH_CRED_ID   = 'ec2-ssh-key'
        DB_ROOT_CRED_ID   = 'db-root-password'      // Secret text credential
        DB_APP_CRED_ID    = 'db-app-credentials'    // Username/Password credential (appuser / apppassword)

        SCANNER_HOME = tool 'SonarScanner'
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '15'))
    }

    stages {

        stage('Checkout') {
            steps {
                // Multibranch Pipeline: check out whatever branch triggered this build,
                // using the SCM config already defined on the job (GitHub Branch Source).
                checkout scm
            }
        }

        stage('Build Docker Images') {
            parallel {
                stage('Build Frontend') {
                    steps {
                        script {
                            frontendImage = docker.build("${FRONTEND_FULL_IMAGE}", "${FRONTEND_DIR}")
                        }
                    }
                }
                stage('Build Backend') {
                    steps {
                        script {
                            backendImage = docker.build("${BACKEND_FULL_IMAGE}", "${BACKEND_DIR}")
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            // Only run full static analysis on main/develop -- keeps feature branches fast.
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                    branch 'develop'
                }
            }
            steps {
                withSonarQubeEnv('SonarQubeServer') {   // must match the server name configured in Jenkins
                    sh '''
                        ${SCANNER_HOME}/bin/sonar-scanner
                    '''
                }
            }
        }

        stage('Quality Gate') {
            when {
                anyOf {
                    branch 'main'
                    branch 'staging'
                    branch 'develop'
                }
            }
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Push Docker Images') {
            // Only push from main -- avoids polluting the registry with feature-branch builds
            // and avoids anything but main being eligible for the production deploy step below.
            when {
                branch 'main'
                branch 'staging'
            }
            steps {
                script {
                    docker.withRegistry("${DOCKER_REGISTRY}", DOCKER_CREDS_ID) {
                        frontendImage.push()
                        frontendImage.push('latest')

                        backendImage.push()
                        backendImage.push('latest')
                    }
                }
            }
        }

        stage('Deploy to Dev') {
            // develop branch: auto-deploy to a dev environment.
            // NOTE: this reuses the same EC2_HOST/container names as production for now --
            // point these at a separate dev host/containers before relying on this for real dev testing.
            when {
                branch 'develop'
                branch 'staging'
            }
            steps {
                echo "Deploying branch ${env.BRANCH_NAME} to DEV environment of ${EC2_HOST}"
                // sh './deploy.sh dev'
            }
        }

        stage('Deploy Feature Preview') {
            // feature/* branches: spin up an ephemeral/preview deployment instead of touching prod.
            when {
                expression { env.BRANCH_NAME.startsWith('feature/') }
            }
            steps {
                echo "Deploying feature branch ${env.BRANCH_NAME} to an ephemeral review environment (placeholder)"
                // sh "./deploy.sh feature ${env.BRANCH_NAME}"
            }
        }

        stage('Deploy to EC2 (Production)') {
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    string(credentialsId: DB_ROOT_CRED_ID, variable: 'DB_ROOT_PASSWORD'),
                    usernamePassword(credentialsId: DB_APP_CRED_ID, usernameVariable: 'DB_USER', passwordVariable: 'DB_PASSWORD')
                ]) {
                    sshagent(credentials: [EC2_SSH_CRED_ID]) {
                        sh """
                            ssh -o StrictHostKeyChecking=no ${EC2_USER}@${EC2_HOST} '
                                set -e

                                echo "Ensuring Docker network exists..."
                                docker network inspect ${APP_NETWORK} >/dev/null 2>&1 || docker network create ${APP_NETWORK}

                                echo "Ensuring db data volume exists..."
                                docker volume inspect ${DB_DATA_VOLUME} >/dev/null 2>&1 || docker volume create ${DB_DATA_VOLUME}

                                echo "Pulling latest images..."
                                docker pull ${FRONTEND_FULL_IMAGE}
                                docker pull ${BACKEND_FULL_IMAGE}
                                docker pull ${DB_IMAGE}

                                echo "Stopping old containers if running..."
                                docker stop ${FRONTEND_CONTAINER_NAME} ${BACKEND_CONTAINER_NAME} ${DB_CONTAINER_NAME} || true
                                docker rm ${FRONTEND_CONTAINER_NAME} ${BACKEND_CONTAINER_NAME} ${DB_CONTAINER_NAME} || true

                                echo "Starting db container..."
                                docker run -d \\
                                    --name ${DB_CONTAINER_NAME} \\
                                    --restart always \\
                                    --network ${APP_NETWORK} \\
                                    -e MYSQL_ROOT_PASSWORD="${DB_ROOT_PASSWORD}" \\
                                    -e MYSQL_DATABASE="${DB_NAME}" \\
                                    -e MYSQL_USER="${DB_USER}" \\
                                    -e MYSQL_PASSWORD="${DB_PASSWORD}" \\
                                    -v ${DB_DATA_VOLUME}:/var/lib/mysql \\
                                    -v ${DB_INIT_SQL_PATH}:/docker-entrypoint-initdb.d/init.sql \\
                                    -p ${DB_HOST_PORT}:${DB_CONTAINER_PORT} \\
                                    --health-cmd="mysqladmin ping -h localhost -u\\${DB_USER} -p\\${DB_PASSWORD}" \\
                                    --health-interval=10s \\
                                    --health-timeout=5s \\
                                    --health-retries=10 \\
                                    ${DB_IMAGE}

                                echo "Waiting for db to become healthy..."
                                for i in \$(seq 1 30); do
                                    status=\$(docker inspect --format="{{.State.Health.Status}}" ${DB_CONTAINER_NAME} 2>/dev/null || echo starting)
                                    if [ "\$status" = "healthy" ]; then
                                        echo "db is healthy"
                                        break
                                    fi
                                    echo "db status: \$status, waiting..."
                                    sleep 5
                                done

                                echo "Starting backend container..."
                                docker run -d \\
                                    --name ${BACKEND_CONTAINER_NAME} \\
                                    --restart always \\
                                    --network ${APP_NETWORK} \\
                                    -e DB_HOST=${DB_CONTAINER_NAME} \\
                                    -e DB_NAME="${DB_NAME}" \\
                                    -e DB_USER="${DB_USER}" \\
                                    -e DB_PASSWORD="${DB_PASSWORD}" \\
                                    -p ${BACKEND_HOST_PORT}:${BACKEND_CONTAINER_PORT} \\
                                    ${BACKEND_FULL_IMAGE}

                                echo "Starting frontend container..."
                                docker run -d \\
                                    --name ${FRONTEND_CONTAINER_NAME} \\
                                    --restart always \\
                                    --network ${APP_NETWORK} \\
                                    -p ${FRONTEND_HOST_PORT}:${FRONTEND_CONTAINER_PORT} \\
                                    ${FRONTEND_FULL_IMAGE}

                                echo "Cleaning up old images..."
                                docker image prune -f
                            '
                        """
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Build ${env.BUILD_NUMBER} on branch ${env.BRANCH_NAME} finished successfully"
        }
        failure {
            echo "Build ${env.BUILD_NUMBER} on branch ${env.BRANCH_NAME} failed. Check logs above."
        }
        always {
            sh 'docker system prune -f || true'
        }
    }
}