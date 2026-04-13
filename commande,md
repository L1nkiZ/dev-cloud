# Guide commande - Dev Cloud

## Table des matières
- [Installation](#installation)
- [Lancer l'application avec Docker](#lancer-lapplication-avec-docker)
- [Lancer les tests unitaires](#lancer-les-tests-unitaires)
- [Développement local](#développement-local)
- [Accès à la base de données](#accès-à-la-base-de-données)
- [Quelques commandes utiles](#quelques-commandes-utiles)

---

## Installation

### Prérequis
- **Docker Desktop** installé et en cours d'exécution
- **Node.js** (v18+) et **npm** pour le développement local
- **Git** pour cloner le projet

### Installer les dépendances (optionnel pour Docker)
```bash
cd backend && npm install
cd ../client && npm install
```

---

## Lancer l'application avec Docker

### Démarrer toute l'application

```bash
docker compose up --watch
```

**Options utiles :**
- `--watch` : Redémarre automatiquement les services à la détection de changements
- `-d` : Lance en arrière-plan
- `--build` : Reconstructs les images avant de démarrer

### Arrêter l'application
```bash
docker compose down
```

### Réinitialiser tout (nettoyer les volumes)
```bash
docker compose down -v
```

### Accéder à l'application
- **Application** : http://localhost
- **Base de données (phpMyAdmin)** : http://db.localhost
- **Port backend** : http://localhost/api (via le proxy)

---

## Lancer les tests unitaires

### Tests Backend (Jest)

#### Lancer tous les tests
```bash
cd backend
npm test
```

#### Lancer les tests en mode watch (recharge automatique)
```bash
cd backend
npm test -- --watch
```

#### Générer un rapport de couverture
```bash
cd backend
npm run test:coverage
```

Les test coverage génére un rapport dans le dossier `backend/coverage/` ou `client/coverage/`. Ce rapport contient un fichier texte et un rapport html

## Développement local

### Lancer le backend localement (sans Docker)
```bash
cd backend
npm install        # Si les dépendances ne sont pas installées
npm dev            # Lance avec nodemon (hot-reload)
```
Le backend sera accessible sur `http://localhost:3000`

### Lancer le client localement (sans Docker)
```bash
cd client
npm install        # Si les dépendances ne sont pas installées
npm dev            # Lance le server Vite en mode dev
```
Le client sera accessible sur `http://localhost:5173`

### Formater le code

#### Backend
```bash
cd backend
npm run format           # Formate tous les fichiers .js
npm run format-check     # Vérifier le formatage sans modifier
```

#### Client
```bash
cd client
npm run format           # Formate tous les fichiers .jsx
npm run format-check     # Vérifier le formatage
npm run lint             # Lint avec ESLint
```

---

## Accès à la base de données

### phpMyAdmin (dans Docker)
URL : http://db.localhost

**Identifiants (vérifier dans le compose.yaml) :**
- Utilisateur : `root`
- Mot de passe : `secret`

### Utiliser MySQL avec Docker
```bash
docker compose exec db mysql -u root -p
# Entrez le mot de passe quand demandé
```

---

## Quelques commandes utiles

### Logs des services
```bash
# Voir les logs de tous les services
docker compose logs -f

# Logs d'un service spécifique
docker compose logs -f backend
docker compose logs -f client
docker compose logs -f proxy
```

### Rebuildez les images après modifications
```bash
docker compose build
docker compose up --watch
```

### Entrer dans un conteneur
```bash
# Conteneur backend
docker compose exec backend sh

# Conteneur client
docker compose exec client sh
```

### Vérifier l'état des services
```bash
docker compose ps
```

### Supprimer les images Docker
```bash
docker image rm <image-id>
# Ou tous les images non utilisées
docker image prune
```