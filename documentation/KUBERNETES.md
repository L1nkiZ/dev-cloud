# Kubernetes — Documentation du projet

## Qu'est-ce que Kubernetes ?

**Kubernetes** (abrégé **K8s**) est un système d'orchestration de conteneurs open-source, développé initialement par Google et maintenu par la **Cloud Native Computing Foundation (CNCF)**. Son rôle est d'automatiser le déploiement, la mise à l'échelle et la gestion des applications conteneurisées.

Si Docker permet de **créer et exécuter** des conteneurs, Kubernetes permet de les **orchestrer** : il décide où ils tournent, combien de répliques lancer, comment ils communiquent entre eux, et comment les redémarrer automatiquement en cas de panne.

> Analogie : Docker c'est un camion de livraison. Kubernetes c'est le système logistique qui décide quel camion va où, combien de camions déployer, et qui en commande un nouveau si l'un tombe en panne.

---

## Concepts clés

| Concept | Description |
|---|---|
| **Cluster** | L'ensemble du système Kubernetes. Il contient un ou plusieurs Nodes. Avec Docker Desktop, c'est ton PC qui fait office de cluster. |
| **Node** | Un serveur (physique ou virtuel) qui exécute les Pods. Docker Desktop fournit un seul Node local. |
| **Pod** | L'unité de base de Kubernetes. Un Pod contient un ou plusieurs conteneurs partageant le même réseau et stockage. C'est l'équivalent d'un conteneur Docker, géré par K8s. |
| **Deployment** | Décrit comment déployer et maintenir des Pods sans état (stateless). Si un Pod tombe, le Deployment en relance un nouveau automatiquement. |
| **StatefulSet** | Comme un Deployment, mais pour des applications **avec état** (bases de données). Il garantit un nom de Pod stable et un stockage persistant entre les redémarrages. |
| **Service** | Expose un ou plusieurs Pods sur le réseau interne ou externe. Il donne une adresse DNS stable et agit comme équilibreur de charge. |
| **ConfigMap** | Stocke des données de configuration non-sensibles (variables d'env, fichiers de config). Découple la config du code. |
| **Secret** | Comme un ConfigMap, mais pour des données sensibles (mots de passe, tokens JWT). Encodé en base64. |
| **PersistentVolumeClaim (PVC)** | Requête de stockage persistant. Les données survivent à la suppression/recréation d'un Pod. |
| **Namespace** | Espace d'isolation logique dans le cluster. Sépare les ressources (dev, prod, équipes). |
| **initContainer** | Conteneur qui s'exécute **avant** le conteneur principal. Utilisé ici pour attendre que MySQL soit prêt. |

### Comparaison Docker Compose vs Kubernetes

| Docker Compose | Kubernetes |
|---|---|
| `services:` | `Deployment` / `StatefulSet` |
| `ports:` | `Service` (type `LoadBalancer` ou `NodePort`) |
| `environment:` | `ConfigMap` + `Secret` |
| `volumes:` (nommés) | `PersistentVolumeClaim` |
| `networks:` | DNS interne des Services (automatique) |
| `depends_on: condition: healthy` | `initContainers` |
| `healthcheck:` | `livenessProbe` + `readinessProbe` |
| `image: name` | `image: name` dans le Pod spec |

---

## Architecture Kubernetes de ce projet

### Vue d'ensemble

```
┌──────────────────────────────────────────────────────────┐
│                   Namespace: dev-cloud                    │
│                                                          │
│  ┌──────────────────────┐    ┌────────────────────────┐  │
│  │  Deployment: backend │    │ StatefulSet: mysql      │  │
│  │  image: dev-cloud/   │───▶│  image: mysql:9.3       │  │
│  │         backend:latest│   │  PVC: mysql-pvc (1Gi)  │  │
│  │  Port conteneur: 3000│    │  Port conteneur: 3306  │  │
│  └──────────┬───────────┘    └────────────────────────┘  │
│             │                                            │
│  ┌──────────▼───────────┐    ┌────────────────────────┐  │
│  │ Service: backend     │    │ Deployment: phpmyadmin  │  │
│  │ Type: LoadBalancer   │    │ image: phpmyadmin:latest│  │
│  │ Port 80 → 3000       │    │ Service LB: 8080 → 80  │  │
│  └──────────────────────┘    └────────────────────────┘  │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ConfigMap: dev-cloud-config                         │ │
│  │ MYSQL_HOST, MYSQL_USER, MYSQL_DB, NODE_ENV, PORT    │ │
│  └─────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Secret: dev-cloud-secret                            │ │
│  │ MYSQL_ROOT_PASSWORD, MYSQL_PASSWORD, JWT_SECRET     │ │
│  └─────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────┘
          ↕ localhost:80              ↕ localhost:8080
      Application web               phpMyAdmin
```

### Fichiers créés

| Fichier | Ressource(s) Kubernetes | Description |
|---|---|---|
| `k8s/00-namespace.yaml` | `Namespace` | Espace d'isolation `dev-cloud` |
| `k8s/01-configmap.yaml` | `ConfigMap` | Variables d'env non-sensibles |
| `k8s/02-secret.yaml` | `Secret` | Mots de passe et clé JWT |
| `k8s/03-mysql.yaml` | `StatefulSet` + `Service` + `PVC` | MySQL avec stockage persistant |
| `k8s/04-backend.yaml` | `Deployment` + `Service` | API Node.js + frontend React |
| `k8s/05-phpmyadmin.yaml` | `Deployment` + `Service` | Interface graphique MySQL |
| `Dockerfile.prod` | — | Dockerfile unifié pour la prod |

### Image de production (`Dockerfile.prod`)

Le `Dockerfile.prod` à la racine construit une image en **3 étapes** :

1. **`client-build`** — Compile le frontend React avec Vite → produit `dist/`
2. **`backend-build`** — Compile le TypeScript du backend → produit `dist/`
3. **`production`** — Image finale `node:20-alpine` qui :
   - Copie les JS compilés du backend dans `dist/`
   - Copie les fichiers statiques React dans `src/static/`
   - Démarre avec `node dist/index.js`
   - Express sert `/api` pour l'API et `src/static` pour le frontend

> C'est l'équivalent du stage `final` des Dockerfiles séparés, mais corrigé et regroupé à la racine pour Kubernetes.

---

## Installation et déploiement

### Prérequis

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installé
- **Kubernetes activé dans Docker Desktop** (voir ci-dessous)
- `kubectl` (inclus automatiquement avec Docker Desktop)

### Activer Kubernetes dans Docker Desktop

1. Ouvrir **Docker Desktop**
2. Cliquer sur l'icône **⚙️ Settings**
3. Aller dans l'onglet **Kubernetes**
4. Cocher **Enable Kubernetes**
5. Cliquer sur **Apply & Restart**
6. Attendre que le point vert `Kubernetes running` apparaisse en bas à gauche

### Vérifier que Kubernetes fonctionne

```powershell
kubectl cluster-info
kubectl get nodes
```

Tu dois voir un node `docker-desktop` avec le statut `Ready`.

---

## Déploiement pas à pas

### Étape 1 — Construire l'image de production

Depuis la racine du projet :

```powershell
docker build -f Dockerfile.prod -t dev-cloud/backend:latest .
```

> Docker Desktop partage son daemon Docker avec le cluster Kubernetes local. L'image sera disponible directement sans avoir besoin de la pousser dans un registry distant.

### Étape 2 — Déployer sur Kubernetes

```powershell
kubectl apply -f k8s/
```

Kubernetes applique les fichiers dans l'ordre alphabétique (d'où les préfixes `00-`, `01-`...).

### Étape 3 — Vérifier le déploiement

```powershell
# État de tous les pods
kubectl get pods -n dev-cloud

# État de tous les services
kubectl get services -n dev-cloud

# Vue complète (pods + services + deployments)
kubectl get all -n dev-cloud
```

Attendre que tous les pods soient en état `Running` et `Ready`.

### Étape 4 — Accéder à l'application

| Service | URL |
|---|---|
| Application (frontend + API) | http://localhost |
| phpMyAdmin (base de données) | http://localhost:8080 |

---

## Commandes utiles

```powershell
# Voir les logs d'un service
kubectl logs -n dev-cloud deployment/backend
kubectl logs -n dev-cloud statefulset/mysql

# Suivre les logs en temps réel
kubectl logs -n dev-cloud deployment/backend -f

# Décrire un pod (diagnostic d'erreur)
kubectl describe pod -n dev-cloud -l app=backend

# Ouvrir un shell dans un conteneur
kubectl exec -it -n dev-cloud deployment/backend -- sh

# Voir les volumes persistants
kubectl get pvc -n dev-cloud

# Supprimer tous les déploiements (garde les volumes)
kubectl delete -f k8s/

# Supprimer TOUT y compris le namespace et les volumes
kubectl delete namespace dev-cloud
```

### Mettre à jour l'application après une modification

```powershell
# 1. Reconstruire l'image
docker build -f Dockerfile.prod -t dev-cloud/backend:latest .

# 2. Redémarrer les pods pour charger la nouvelle image
kubectl rollout restart deployment/backend -n dev-cloud

# 3. Suivre le déploiement
kubectl rollout status deployment/backend -n dev-cloud
```

---

## Dépannage

### Pod en état `Pending`
Le cluster n'a pas assez de ressources ou le PVC ne peut pas être provisionné.
```powershell
kubectl describe pod -n dev-cloud -l app=mysql
```

### Pod en état `CrashLoopBackOff`
Le conteneur démarre et crashe en boucle. Regarder les logs :
```powershell
kubectl logs -n dev-cloud deployment/backend --previous
```

### Pod backend en état `Init:0/1`
L'`initContainer` attend que MySQL soit accessible sur le port 3306. C'est normal au démarrage — attendre 30-60 secondes.

### L'image `dev-cloud/backend:latest` n'est pas trouvée
S'assurer que l'image a été construite avec Docker Desktop actif :
```powershell
docker images | Select-String "dev-cloud"
```

### Service backend sans `EXTERNAL-IP`
Vérifier que Kubernetes est bien actif dans Docker Desktop. Avec Docker Desktop, les services `LoadBalancer` obtiennent automatiquement `localhost` comme external IP.
```powershell
kubectl get service backend -n dev-cloud
```
