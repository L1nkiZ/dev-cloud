# Développer pour le cloud

Application de todolist refactorisée pour le cloud, avec une architecture **microservices**, Docker, TypeScript, tests unitaires, CI/CD et monitoring Prometheus/Grafana.

## Architecture

Le projet est composé de trois services applicatifs et d'une stack de monitoring :

| Service | Rôle | Port interne |
|---|---|---|
| `auth-service` | Inscription, connexion, gestion JWT | 3001 |
| `backend` (todo-service + API Gateway) | CRUD todos, proxy vers auth-service | 3000 |
| `client` | Interface React/Vite | 5173 |
| `prometheus` | Collecte des métriques | 9090 |
| `grafana` | Dashboard de monitoring | 3333 |

## Table des matières

- [Démarrage rapide](#démarrage-rapide)
- [URLs et accès](#urls-et-accès)
- [Credentials par défaut](#credentials-par-défaut)
- [Lancer sans Docker](#lancer-sans-docker)
- [Lancer avec Kubernetes](#lancer-avec-kubernetes)
- [Monitoring Prometheus + Grafana](#monitoring-prometheus--grafana)
- [Commandes utiles](#commandes-utiles)
- [Tests](#tests)
- [CI](#ci)

## Démarrage rapide

### Prérequis

- **Docker Desktop** (recommandé)
- **Node.js 18+** et npm pour lancer sans Docker
- **Git** pour cloner le dépôt

### Lancer avec Docker

```bash
git clone <repo>
cd dev-cloud
docker compose up --build --watch
```

## URLs et accès

| URL | Service | Description |
|---|---|---|
| http://localhost | Application | Interface Todo (frontend React) |
| http://localhost/api/health | API | Santé du backend |
| http://db.localhost | phpMyAdmin | Interface base de données MySQL |
| http://localhost:9090 | Prometheus | Métriques brutes + targets |
| http://localhost:3333 | Grafana | Dashboard de monitoring |

## Credentials par défaut

### Compte utilisateur de test (créé automatiquement au démarrage)

| Champ | Valeur |
|---|---|
| Email | `user@example.com` |
| Mot de passe | `password` |

### Base de données MySQL

| Champ | Valeur |
|---|---|
| Hôte | `mysql` (interne Docker) |
| Utilisateur | `root` |
| Mot de passe | `secret` |
| Base | `todos` |

Interface web : http://db.localhost (phpMyAdmin, déjà connecté automatiquement)

### Grafana

| Champ | Valeur |
|---|---|
| URL | http://localhost:3333 |
| Utilisateur | `admin` |
| Mot de passe | `admin` |

## Lancer avec Kubernetes

### Prérequis

- Les images Docker doivent être buildées localement avant le déploiement

### Build des images

```bash
docker build -t auth-service:latest ./auth-service
docker build -t backend:latest ./backend
docker build -t client:latest ./client
```

### Déploiement

Appliquer tous les manifestes dans l'ordre :

```bash
kubectl apply -f k8s/
```

Ou service par service :

```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secret.yaml
kubectl apply -f k8s/03-mysql.yaml
kubectl apply -f k8s/04-backend.yaml
kubectl apply -f k8s/05-phpmyadmin.yaml
kubectl apply -f k8s/06-auth-service.yaml
kubectl apply -f k8s/07-prometheus.yaml
kubectl apply -f k8s/08-grafana.yaml
kubectl apply -f k8s/09-client.yaml
kubectl apply -f k8s/10-nginx.yaml
kubectl apply -f k8s/11-hpa.yaml
```

### Vérifier l'état des pods

```bash
kubectl get pods -n dev-cloud
kubectl get services -n dev-cloud
```

Attendre que tous les pods soient en état `Running` avant d'accéder à l'application.

### URLs en mode Kubernetes

| URL | Service |
|---|---|
| http://localhost | Application (via nginx LoadBalancer) |
| http://localhost/api/health | Santé du backend |
| http://localhost:9090 | Prometheus |
| http://localhost:3333 | Grafana |

### Supprimer le déploiement

```bash
kubectl delete namespace dev-cloud
```

```bash
# 1. Rebuilder l'image
docker build -t backend:latest ./backend

# 2. Vider le cache containerd de Docker Desktop
docker exec -it $(docker ps -q --filter name=k8s_node) crictl rmi --prune 2>/dev/null || true

# 3. Forcer le redémarrage du pod
kubectl rollout restart deployment/backend -n dev-cloud
```

## Monitoring Prometheus + Grafana

### Grafana — Dashboard principal

1. Ouvre http://localhost:3333
2. Identifiants : `admin` / `admin`
3. Va dans **Dashboards > Browse > Dev Cloud - Microservices**

| Section | Afficher |
|---|---|
| **Auth Service** | Logins réussis/échoués par seconde, inscriptions, échecs de validation token |
| **Todo Service** | Opérations CRUD (create/update/delete/list) par seconde |
| **Performance HTTP** | Latence p50 / p95 / p99 pour chaque service |
| **Ressources Système** | Heap Node.js, Event Loop Lag |

### Prometheus — Targets et métriques brutes

1. Ouvre http://localhost:9090
2. **Status > Targets** — les deux targets `auth-service` et `todo-service` doivent être en état **UP**
3. Champ de recherche, pour explorer une métrique :

| Métrique | Description |
|---|---|
| `auth_login_total` | Compteur de logins par statut |
| `auth_signup_total` | Compteur d'inscriptions |
| `auth_validate_total` | Validations de token inter-service |
| `todo_operations_total` | Opérations CRUD todos |
| `http_request_duration_seconds` | Histogramme de latence |
| `nodejs_heap_size_used_bytes` | Mémoire heap Node.js |

## CI

Le dépôt utilise **GitHub Actions** pour automatiser la validation du code.

### Pipeline principal

Déclenché sur push, pull request et lancement manuel :

- Lint backend et frontend en parallèle
- Contrôle des dépendances
- Tests backend > tests frontend
- Build backend et frontend
- SonarQube (optionnel, si `SONAR_TOKEN` est configuré dans les secrets GitHub)

### Validation hebdomadaire des dépendances

Workflow séparé, tous les lundis à 7h, pour valider les mises à jour de dépendances.

### Dependabot

Mises à jour npm automatiques chaque semaine pour `backend`, `auth-service` et `client`.
