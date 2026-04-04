# 🎬 End-to-End DevOps Automation - Movie Recommendation Web App

## Project Title
End-to-End DevOps Automation for a Microservices-Based Movie Recommendation Web Application
Using Docker, Kubernetes, Terraform, and Ansible

---

## Architecture
Frontend (Nginx) → API Gateway → Auth Service
                              → ML Recommender v1  ← Self-healing + Fallback (NOVELTY)
                              → Fallback Recommender
                ML Recommender v2 (Canary Deployment) (NOVELTY)

---

## Microservices

| Service                      | Port | Purpose                          |
|------------------------------|------|----------------------------------|
| auth-service                 | 3001 | Register & Login with JWT        |
| ml-recommender-service       | 3002 | ML-based recommendations (v1)   |
| fallback-recommender-service | 3003 | Rule-based fallback (NOVELTY)   |
| ml-recommender-v2-service    | 3004 | Canary v2 recommender (NOVELTY) |
| api-gateway                  | 3000 | Routes + graceful fallback logic |
| frontend                     | 80   | HTML/JS movie UI via Nginx       |

---

## STEP 1: Replace Your DockerHub Username
Open the project in VS Code.
Press Ctrl+Shift+H → Find: YOUR_DOCKERHUB_USERNAME → Replace with your actual username.
Click Replace All and save.

---

## STEP 2: Run Locally (Docker Compose)
Make sure Docker Desktop is running, then:

  docker-compose up --build

Open browser → http://localhost
Register → Login → Select genre → Get recommendations!

To stop: Ctrl+C in terminal

---

## STEP 3: Push to GitHub
  git init
  git add .
  git commit -m "feat: initial movie devops project"
  git remote add origin https://github.com/YOUR_GITHUB_USERNAME/movie-devops.git
  git branch -M main
  git push -u origin main

Create feature branches for each service for maximum Version Control marks:
  git checkout -b feature/auth-service
  git checkout -b feature/ml-recommender
  git checkout -b feature/k8s-manifests
  (etc.)

---

## STEP 4: Set Up CI/CD (GitHub Actions)
Go to your GitHub repo → Settings → Secrets and variables → Actions → New secret

Add these secrets:
  DOCKER_USERNAME = your DockerHub username
  DOCKER_PASSWORD = your DockerHub password
  KUBECONFIG      = contents of your ~/.kube/config file

Every push to main will now auto: test → build images → push to DockerHub → deploy to Kubernetes.

---

## STEP 5: Provision Cloud Servers (Terraform)
  cd terraform
  terraform init
  terraform plan
  terraform apply
  (Note the master_ip and worker_ips printed at the end)

---

## STEP 6: Configure Servers (Ansible)
  cd ansible
  # Edit inventory.ini: replace MASTER_IP, WORKER1_IP, WORKER2_IP with Terraform output IPs
  ansible-playbook -i inventory.ini install-k8s.yml

---

## STEP 7: Deploy to Kubernetes
SSH into master node:
  ssh -i ~/.ssh/my-key.pem ubuntu@MASTER_IP

Apply all manifests:
  kubectl apply -f k8s/namespace.yaml
  kubectl apply -f k8s/auth-deployment.yaml
  kubectl apply -f k8s/ml-recommender-deployment.yaml
  kubectl apply -f k8s/fallback-recommender-deployment.yaml
  kubectl apply -f k8s/api-gateway-deployment.yaml
  kubectl apply -f k8s/frontend-deployment.yaml
  kubectl apply -f k8s/hpa.yaml

Check all pods running:
  kubectl get pods -n movie-app

---

## NOVELTY FEATURE 1: Self-Healing + Graceful Fallback DEMO

Simulate ml-recommender failure:
  curl -X POST http://localhost:3002/simulate-failure

Watch Kubernetes auto-restart it:
  kubectl get pods -n movie-app -w

Meanwhile the API Gateway automatically serves fallback recommendations.
Users still see movies - no downtime!

---

## NOVELTY FEATURE 2: Canary Deployment DEMO

Apply v2 canary alongside v1:
  kubectl apply -f k8s/ml-recommender-v2-canary.yaml

See both versions running:
  kubectl get pods -n movie-app

Rollback instantly if needed:
  kubectl delete -f k8s/ml-recommender-v2-canary.yaml

---

## Git Branching Strategy (for Excellent marks)
main
├── feature/auth-service
├── feature/ml-recommender
├── feature/fallback-recommender
├── feature/api-gateway
├── feature/frontend
├── feature/terraform-iac
├── feature/ansible-config
└── feature/k8s-manifests

Open a Pull Request from each branch → merge to main.

---

## Rubric Checklist
| Rubric                      | What you have                                      | Expected Mark |
|-----------------------------|----------------------------------------------------|---------------|
| Version Control (8M)        | Branches, PRs, clear commits, GitHub collab        | 7-8           |
| CI/CD Pipeline (7M)         | GitHub Actions: test + build + deploy (3 stages)   | 6-7           |
| Containerization (8M)       | Dockerfile per service, K8s, HPA, probes           | 7-8           |
| IaC (7M)                    | Terraform (EC2) + Ansible (Docker + K8s install)   | 6-7           |
