# 🚀 3-Tier App — GitHub Actions Demo

A **complete demo** of a 3-tier application with:
- **GitHub Actions** CI/CD pipeline
- **DockerHub** image registry
- **EC2** deployment with Docker Compose

-  ********************

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   GitHub Actions                     │
│  Push to main → Build Images → Push to DockerHub    │
│              → SSH into EC2 → docker-compose up     │
└─────────────────────────────────────────────────────┘
                          │
              ┌───────────▼───────────┐
              │        EC2            │
              │  ┌────────────────┐   │
              │  │  Frontend :80  │   │  ← Nginx + HTML
              │  └───────┬────────┘   │
              │  ┌───────▼────────┐   │
              │  │  Backend :5000 │   │  ← Node.js API
              │  └───────┬────────┘   │
              │  ┌───────▼────────┐   │
              │  │  Database :3306│   │  ← MySQL 8
              │  └────────────────┘   │
              └───────────────────────┘
```

---

## 📂 Project Structure

```
3tier-app/
├── .github/
│   └── workflows/
│       └── deploy.yml          ← CI/CD pipeline
├── frontend/
│   ├── index.html              ← Static web app
│   └── Dockerfile
├── backend/
│   ├── app.js                  ← Express REST API
│   ├── package.json
│   └── Dockerfile
├── database/
│   └── init.sql                ← DB initialization
├── docker-compose.yml          ← Multi-service setup
├── setup-ec2.sh                ← One-time EC2 bootstrap
└── README.md
```

---

## ⚡ Quick Start (Step-by-Step)

### Step 1 — Fork / Clone this repo
```bash
git clone https://github.com/YOUR_USERNAME/3tier-app.git
cd 3tier-app
```

### Step 2 — Set up DockerHub
1. Go to https://hub.docker.com → Account Settings → Security
2. Click **New Access Token** → copy the token
3. Note your DockerHub **username**

### Step 3 — Set up EC2
1. Launch an **Ubuntu 22.04** EC2 instance (t2.micro is fine)
2. Allow inbound ports: **22, 80, 5000** in Security Group
3. SSH into the instance:
   ```bash
   ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
   ```
4. Run the bootstrap script:
   ```bash
   # Upload and run (from your local machine)
   scp -i your-key.pem setup-ec2.sh ubuntu@<EC2_IP>:~
   ssh -i your-key.pem ubuntu@<EC2_IP> "bash ~/setup-ec2.sh"
   ```
5. Log out and SSH back in (for docker group to take effect)

### Step 4 — Add GitHub Secrets
Go to your GitHub repo → **Settings → Secrets and variables → Actions** → New secret:

| Secret Name          | Value                                         |
|----------------------|-----------------------------------------------|
| `DOCKERHUB_USERNAME` | Your DockerHub username                       |
| `DOCKERHUB_TOKEN`    | DockerHub access token (from Step 2)          |
| `EC2_HOST`           | EC2 public IP or DNS hostname                 |
| `EC2_USER`           | `ubuntu`                                      |
| `EC2_SSH_KEY`        | Entire contents of your `.pem` private key    |

> ⚠️ For `EC2_SSH_KEY`, open the `.pem` file and paste **everything** including the `-----BEGIN RSA PRIVATE KEY-----` lines.

### Step 5 — Push to trigger the pipeline
```bash
git add .
git commit -m "Initial deploy"
git push origin main
```

### Step 6 — Watch the pipeline
- Go to your GitHub repo → **Actions** tab
- Watch the **3-Tier App CI/CD Pipeline** run

### Step 7 — Access the app
| Service  | URL                              |
|----------|----------------------------------|
| Frontend | `http://<EC2_PUBLIC_IP>`         |
| Backend  | `http://<EC2_PUBLIC_IP>:5000/health` |

---

## 🐳 Local Development (without EC2)

```bash
# Build images locally
docker-compose build

# Start all services
DOCKERHUB_USERNAME=local IMAGE_TAG=dev docker-compose up -d

# Check logs
docker-compose logs -f

# Stop everything
docker-compose down
```

---

## 🔁 Pipeline Flow

```
git push main
     │
     ▼
GitHub Actions triggered
     │
     ├─── Job 1: build-and-push
     │         Checkout code
     │         Login to DockerHub
     │         Build frontend image → push :sha + :latest
     │         Build backend image  → push :sha + :latest
     │
     └─── Job 2: deploy  (runs after Job 1)
               Copy docker-compose.yml to EC2 (SCP)
               SSH into EC2
               docker login
               docker pull (frontend + backend)
               docker-compose down
               docker-compose up -d
               ✅ Done!
```

---

## 🛠️ Troubleshooting

**Pipeline fails at SSH step?**
- Check `EC2_SSH_KEY` secret includes full key with header/footer lines
- Verify EC2 Security Group allows port 22 from anywhere (0.0.0.0/0)

**Containers not starting on EC2?**
```bash
ssh ubuntu@<EC2_IP>
cd ~/app
docker-compose ps       # check status
docker-compose logs     # check errors
```

**Frontend can't reach backend?**
- Make sure port 5000 is open in EC2 Security Group
- The frontend uses `window.location.hostname` to call the backend

**DB connection issues?**
- Backend retries DB connection 10 times with 3s delay
- Check: `docker-compose logs backend`
