# dok8s — Lancer et tester l'application sur Kubernetes

Guide pratique de déploiement de l'architecture microservices complète sur Kubernetes (Docker Desktop).

---

## Architecture déployée

```
                         ┌─────────────────────────────────────────┐
                         │          Namespace: dev-cloud            │
                         │                                         │
Internet ──── :80 ──────▶│  [nginx] LoadBalancer                   │
                         │     /      → client:80   (React SPA)    │
                         │     /api   → backend:3000 (API)         │
                         │                                         │
              :8080 ─────▶│  [phpmyadmin] LoadBalancer              │
              :9090 ─────▶│  [prometheus] LoadBalancer              │
              :3333 ─────▶│  [grafana]    LoadBalancer              │
                         │                                         │
                         │  Services internes (ClusterIP) :        │
                         │    client         :80                   │
                         │    backend        :3000                  │
                         │    auth-service   :3001                  │
                         │    mysql          :3306                  │
                         │                                         │
                         │  Volumes persistants :                  │
                         │    mysql-pvc    (1Gi)                   │
                         │    grafana-pvc  (1Gi)                   │
                         └─────────────────────────────────────────┘
```

---

## Prérequis

- Docker Desktop avec Kubernetes activé (**Settings → Kubernetes → Enable Kubernetes**)
- `kubectl` disponible dans le terminal (inclus avec Docker Desktop)

Vérifier que le cluster tourne :

```powershell
kubectl cluster-info
kubectl get nodes
# Attendu : un node "docker-desktop" en statut "Ready"
```

---

## Étape 1 — Construire les images Docker

Les images doivent être construites localement avec Docker Desktop. Le cluster Kubernetes local partage le daemon Docker, donc **pas besoin de registry distant**.

```powershell
# Depuis la racine du projet

# Image du frontend React (nginx + Vite build)
docker build -f client/Dockerfile --target client-prod -t dev-cloud/client:latest .

# Image de l'auth-service
docker build -f auth-service/Dockerfile --target final -t dev-cloud/auth-service:latest .

# Image du backend Node.js
docker build -f Dockerfile.prod -t dev-cloud/backend:latest .
```

Vérifier que les images sont bien présentes :

```powershell
docker images | Select-String "dev-cloud"
# Attendu :
#   dev-cloud/client        latest   ...
#   dev-cloud/auth-service  latest   ...
#   dev-cloud/backend       latest   ...
```

---

## Étape 2 — Déployer sur Kubernetes

```powershell
# Appliquer tous les manifestes dans l'ordre (préfixe 00- à 11-)
kubectl apply -f k8s/
```

> Les fichiers sont appliqués dans l'ordre alphabétique, d'où les préfixes numériques.

---

## Étape 3 — Vérifier le déploiement

### Suivre le démarrage des pods

```powershell
# Voir l'état de tous les pods (relancer jusqu'à tout "Running")
kubectl get pods -n dev-cloud -w
```

Ordre de démarrage attendu :
1. `mysql` démarre en premier (StatefulSet)
2. `auth-service` et `backend` attendent MySQL via leur `initContainer`
3. `client`, `nginx`, `prometheus`, `grafana`, `phpmyadmin` démarrent ensuite

### État global

```powershell
# Vue complète : pods, services, deployments, HPA
kubectl get all -n dev-cloud

# Services exposés et leurs ports
kubectl get services -n dev-cloud

# Volumes persistants
kubectl get pvc -n dev-cloud

# Autoscalers
kubectl get hpa -n dev-cloud
```

---

## Étape 4 — Accéder aux services

| Service | URL | Description |
|---|---|---|
| Application complète | http://localhost | React SPA + API via nginx |
| phpMyAdmin | http://localhost:8080 | Gestion base de données |
| Prometheus | http://localhost:9090 | Métriques raw |
| Grafana | http://localhost:3333 | Dashboards (admin/admin) |

---

## Étape 5 — Importer le dashboard Grafana

Le dashboard est stocké dans `monitoring/grafana/dashboards/dev-cloud.json`. L'injecter comme ConfigMap puis le monter dans Grafana :

```powershell
# Créer le ConfigMap depuis le fichier JSON
kubectl create configmap grafana-dashboard-json `
  --from-file=dev-cloud.json=monitoring/grafana/dashboards/dev-cloud.json `
  -n dev-cloud

# Monter le dashboard dans le pod Grafana (patch du deployment)
kubectl patch deployment grafana -n dev-cloud --type=json -p='[
  {
    "op": "add",
    "path": "/spec/template/spec/volumes/-",
    "value": {
      "name": "grafana-dashboard-json",
      "configMap": {"name": "grafana-dashboard-json"}
    }
  },
  {
    "op": "add",
    "path": "/spec/template/spec/containers/0/volumeMounts/-",
    "value": {
      "name": "grafana-dashboard-json",
      "mountPath": "/etc/grafana/provisioning/dashboards/dev-cloud.json",
      "subPath": "dev-cloud.json"
    }
  }
]'
```

Alternativement, importer manuellement via l'UI Grafana :
1. Ouvrir http://localhost:3333
2. **Dashboards → Import**
3. Cliquer **Upload JSON file**
4. Sélectionner `monitoring/grafana/dashboards/dev-cloud.json`

---

## Commandes de diagnostic

### Logs en temps réel

```powershell
# Backend
kubectl logs -n dev-cloud deployment/backend -f

# Auth service
kubectl logs -n dev-cloud deployment/auth-service -f

# Client (nginx)
kubectl logs -n dev-cloud deployment/client -f

# Nginx reverse proxy
kubectl logs -n dev-cloud deployment/nginx -f

# MySQL
kubectl logs -n dev-cloud statefulset/mysql -f
```

### Logs des initContainers (debug démarrage)

```powershell
kubectl logs -n dev-cloud deployment/backend -c wait-for-mysql
kubectl logs -n dev-cloud deployment/auth-service -c wait-for-mysql
```

### Décrire un pod (erreurs détaillées)

```powershell
kubectl describe pod -n dev-cloud -l app=backend
kubectl describe pod -n dev-cloud -l app=auth-service
kubectl describe pod -n dev-cloud -l app=client
kubectl describe pod -n dev-cloud -l app=mysql
```

### Ouvrir un shell dans un conteneur

```powershell
kubectl exec -it -n dev-cloud deployment/backend -- sh
kubectl exec -it -n dev-cloud deployment/auth-service -- sh
kubectl exec -it -n dev-cloud statefulset/mysql -- bash
```

### Tester la connectivité entre services

```powershell
# Depuis un pod backend, vérifier que auth-service répond
kubectl exec -it -n dev-cloud deployment/backend -- wget -qO- http://auth-service:3001/health

# Depuis un pod backend, vérifier MySQL
kubectl exec -it -n dev-cloud deployment/backend -- nc -zv mysql 3306
```

---

## Mise à jour après modification du code

```powershell
# 1. Reconstruire l'image modifiée (ex: backend)
docker build -f Dockerfile.prod -t dev-cloud/backend:latest .

# 2. Forcer le redémarrage du deployment pour charger la nouvelle image
kubectl rollout restart deployment/backend -n dev-cloud

# 3. Suivre le rolling update
kubectl rollout status deployment/backend -n dev-cloud

# Même chose pour client ou auth-service
docker build -f client/Dockerfile --target client-prod -t dev-cloud/client:latest .
kubectl rollout restart deployment/client -n dev-cloud

docker build -f auth-service/Dockerfile --target final -t dev-cloud/auth-service:latest .
kubectl rollout restart deployment/auth-service -n dev-cloud
```

---

## Scaling manuel

```powershell
# Passer le backend à 3 replicas
kubectl scale deployment backend -n dev-cloud --replicas=3

# Voir l'état de l'autoscaling (HPA)
kubectl get hpa -n dev-cloud

# Voir les métriques CPU/RAM des pods
kubectl top pods -n dev-cloud
```

> Les HPA (11-hpa.yaml) gèrent le scaling automatique si le metrics-server est actif.

---

## Supprimer le déploiement

```powershell
# Supprimer tous les pods/services (garde les volumes PVC)
kubectl delete -f k8s/

# Supprimer TOUT (namespace + volumes — perte des données MySQL et Grafana)
kubectl delete namespace dev-cloud
```

---

## Dépannage rapide

| Symptôme | Cause probable | Solution |
|---|---|---|
| Pod `Pending` | Pas de ressources ou PVC non provisionné | `kubectl describe pod -n dev-cloud -l app=X` |
| Pod `CrashLoopBackOff` | Erreur au démarrage | `kubectl logs -n dev-cloud deployment/X --previous` |
| Pod `Init:0/1` | initContainer attend MySQL | Normal, attendre 30-60s |
| Image `not found` | Image non construite localement | Relancer `docker build ...` |
| Service sans `EXTERNAL-IP` | Kubernetes pas actif dans Docker Desktop | Vérifier Settings → Kubernetes |
| `Connection refused` sur `/api` | Backend pas ready | Vérifier readinessProbe avec `kubectl describe` |
