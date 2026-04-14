# Développer pour le cloud

Ce projet est à but d'apprentissage, le projet original est récupéré depuis le repository de docker. C'est une application de todolist. Le but est est de la refactorisé et de l'optimiser pour le cloud avec Docker, TypeScript, des tests et de la CI/CD

Le projet est composé de deux parties :

- un backend Node.js/Express qui expose l’API
- un frontend React/Vite qui consomme cette API et affiche l’interface utilisateur

L’objectif du dépôt est de proposer une base propre, lisible et évolutive, avec :

- une architecture simple à démarrer en local
- des tests unitaires front et back
- du lint et du build pour les deux applications
- une CI GitHub Actions prête à être utilisée

## Table des matières

- [Présentation](#présentation)
- [Installation locale](#installation-locale)
- [Avec Docker](#avec-docker)
- [Sans Docker](#sans-docker)
- [Commandes utiles](#commandes-utiles)
- [CI](#ci)

## Présentation

L’application permet de gérer une liste de tâches avec les actions classiques : création, édition, changement d’état et suppression.

En environnement Docker, le frontend et le backend sont lancés séparément, puis reliés par un reverse proxy. 

Le projet inclut aussi phpMyAdmin pour inspecter la base MySQL en local.

## Installation locale

### Prérequis

- Docker Desktop, si tu veux utiliser la stack conteneurisée
- Node.js 18 ou supérieur et npm, si tu veux lancer le projet sans Docker
- Git pour cloner le dépôt

### Avec Docker

1. Démarre la stack complète :

```bash
docker compose up --watch
```

2. Ouvre l’application :

- Application : http://localhost
- Base de données : http://db.localhost
- API : http://localhost/api

3. Pour arrêter la stack :

```bash
docker compose down
```

4. Pour tout supprimer, y compris les volumes :

```bash
docker compose down -v
```

### Sans Docker

1. Backend :

```bash
cd backend
npm install
copy .env.example .env
npm run dev

```

Le backend sera disponible sur http://localhost:3000.

2. Frontend :

```bash
cd client
npm install
npm run dev
```

Le frontend sera disponible sur http://localhost:5173.

## Commandes utiles

### Backend

```bash
npm run lint
npm run lint:fix
npm test
npm run test:coverage
npm run build
npm run dev
```

### Frontend

```bash
npm run lint
npm test
npm run test:coverage
npm run build
npm run dev
```

### Docker

```bash
docker compose logs -f
docker compose logs -f backend
docker compose logs -f client
docker compose logs -f proxy
docker compose ps
docker compose build
docker compose exec backend sh
docker compose exec client sh
```

### Base de données

Les identifiants locaux utilisés dans Docker sont les suivants :

- utilisateur : root
- mot de passe : secret

Pour ouvrir un shell MySQL dans le conteneur :

```bash
docker compose exec mysql mysql -u root -p
```

## CI

Le dépôt utilise GitHub Actions pour automatiser la validation du code.

### Pipeline principal

Le workflow principal est déclenché sur push, pull request et lancement manuel.

Il exécute :

- le lint du backend et du frontend en parallèle
- le contrôle des dépendances en parallèle
- les tests backend
- les tests frontend après les tests backend, car le frontend a besoin que le backend soit lancé
- le build du backend
- le build du frontend
- SonarQube si des secrets sont configurés

### SonarQube

Le job SonarQube reste optionnel.

Il se lance uniquement si au moins un token est disponible dans les secrets GitHub :

- `SONAR_TOKEN`
- ou `SONAR_TOKEN_DEFAULT`

L’URL Sonar peut aussi être définie via `SONAR_HOST_URL`, sinon un fallback est utilisé.

### Validation hebdomadaire des dépendances

Un workflow séparé s’exécute tous les lundis à 7h pour valider les mises à jour de dépendances avec les tests et le build.

### Dependabot

Dependabot est configuré pour proposer automatiquement des mises à jour npm pour le backend et le frontend chaque semaine.