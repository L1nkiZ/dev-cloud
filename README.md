# Développer pour le cloud

Application de todolist refactorisée en architecture **microservices**, déployable via Docker Compose, Kubernetes ou Terraform/Azure.

## Architecture

| Service | Rôle | Port |
|---|---|---|
| `auth-service` | Inscription, connexion, JWT | 3001 |
| `backend` | CRUD todos + API Gateway | 3000 |
| `client` | Interface React/Vite | 5173 |
| `prometheus` | Collecte des métriques | 9090 |
| `grafana` | Dashboards de monitoring | 3333 |

---

## Docker Compose

### Lancer

```bash
git clone <repo>
cd dev-cloud
docker compose up --build --watch
```

### Conteneurs créés

| Conteneur | Description |
|---|---|
| `auth-service` | Service d'authentification |
| `backend` | API Node.js + proxy |
| `client` | Frontend React/Vite |
| `mysql` | Base de données |
| `phpmyadmin` | Interface MySQL |
| `prometheus` | Métriques |
| `grafana` | Dashboards |
| `nginx` | Reverse proxy |

### Accès

| URL | Service |
|---|---|
| http://localhost | Application (frontend React) |
| http://localhost/api/health | Santé du backend |
| http://db.localhost | phpMyAdmin |
| http://localhost:9090 | Prometheus |
| http://localhost:3333 | Grafana (`admin` / `admin`) |

### Connexion aux conteneurs

# Shell dans un service
```bash
docker compose exec backend sh
docker compose exec auth-service sh
docker compose exec mysql mysql -u root -p
```

# Logs en temps réel
```bash
docker compose logs -f backend
```

# État des conteneurs
```bash
docker compose ps
```

### Arrêt

```bash
docker compose down        # Conserve les données
docker compose down -v     # Supprime aussi les volumes
```

---

## Kubernetes

Prérequis : Docker Desktop avec Kubernetes activé (**Settings > Kubernetes > Enable Kubernetes**)

### Lancer

# 1. Construire les images localement
```bash
docker build -t dev-cloud/client:prod ./client/
docker build -t dev-cloud/auth-service:prod ./auth-service/
docker build -t dev-cloud/backend:prod ./backend/
```
# 2. Déployer localement
```
kubectl apply -f k8s-local/
```

### Ressources créées (namespace `dev-cloud`)

| Manifeste | Ressources |
|---|---|
| `00-namespace.yaml` | Namespace |
| `01-configmap.yaml` | ConfigMap (variables d'env) |
| `02-secret.yaml` | Secret (mots de passe, JWT) |
| `03-mysql.yaml` | StatefulSet + Service + PVC |
| `04-backend.yaml` | Deployment + Service |
| `05-phpmyadmin.yaml` | Deployment + Service |
| `06-auth-service.yaml` | Deployment + Service |
| `07-prometheus.yaml` | Deployment + Service |
| `08-grafana.yaml` | Deployment + Service |
| `09-client.yaml` | Deployment + Service |
| `10-nginx.yaml` | Deployment + LoadBalancer |
| `11-hpa.yaml` | HorizontalPodAutoscaler |

### Vérifier l'état

```bash
kubectl get all -n dev-cloud
kubectl get pods -n dev-cloud -w   # Attendre que tout soit "Running"
```

### Accès

| URL | Service |
|---|---|
| http://localhost | Application |
| http://localhost:8080 | phpMyAdmin |
| http://localhost:9090 | Prometheus |
| http://localhost:3333 | Grafana (`admin` / `admin`) |

### Connexion aux pods

```bash
# Shell dans un conteneur
kubectl exec -it -n dev-cloud deployment/backend -- sh
kubectl exec -it -n dev-cloud statefulset/mysql -- bash

# Logs en temps réel
kubectl logs -n dev-cloud deployment/backend -f

# Supprimer le déploiement
kubectl delete namespace dev-cloud
```

> Documentation complète : [documentation/dok8s.md](documentation/dok8s.md) et [documentation/KUBERNETES.md](documentation/KUBERNETES.md)

---

## Terraform + Azure (AKS)

> Prérequis : Terraform v1.5+, Azure CLI, un abonnement Azure actif

### Infrastructure provisionnée

- Resource Group (`francecentral`)
- Virtual Network `10.0.0.0/16` + sous-réseau AKS
- Cluster AKS — 2 nœuds `Standard_B2s` — Kubernetes 1.29
- Azure Container Registry (ACR) — SKU Basic
- Rôle `AcrPull` sur l'identité managée AKS

### Lancer

```bash
# 1. Provisionner l'infrastructure
cd azure
terraform init -upgrade
terraform plan -out main.tfplan
terraform apply -f main.tfplan

# 2. Build et push de l'image vers l'ACR
az acr login --name <acr-name> # possiblement --admin-enabled true
docker login
docker build -f <acr>.azurecr.io/dev-cloud:prod .
docker push <acr>.azurecr.io/dev-cloud:prod

# 3. Configurer kubectl et déployer
az aks get-credentials --resource-group <rg> --name <cluster>
kubectl apply -f k8s/
```

### Détruire l'infrastructure

```bash
terraform plan -out -destroy main.destroy.tfplan

terraform apply -f main.destroy.tfplan
```

Documentation complète : [documentation/ADR-005-infrastructure-as-code-terraform.md](documentation/ADR-005-infrastructure-as-code-terraform.md)

---

## Credentials par défaut

| Service | Champ | Valeur |
|---|---|---|
| Compte de test | Email | `user@example.com` |
| Compte de test | Mot de passe | `password` |
| MySQL | Utilisateur | `root` |
| MySQL | Mot de passe | `secret` |
| Grafana | Utilisateur | `admin` |
| Grafana | Mot de passe | `admin` |

---

## CI/CD

GitHub Actions déclenché sur push/PR :
- Lint + tests backend et frontend en parallèle
- Build backend et frontend
- SonarQube (si `SONAR_TOKEN` configuré)
- Validation hebdomadaire des dépendances (Dependabot)