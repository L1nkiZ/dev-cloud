# ADR-001 — Architecture Microservices

| Champ | Valeur |
|---|---|
| **Statut** | Accepté |
| **Date** | 2026-06-24 |
| **Décideurs** | Guillaume G |

---

## Contexte

L'application nécessite une séparation claire entre la logique d'authentification et la logique métier (gestion des todos). Deux approches étaient envisageables :

- **Monolithe** : une seule application Express qui gère à la fois les utilisateurs et les todos.
- **Microservices** : deux services distincts, chacun responsable d'un domaine.

La problématique de départ est : comment isoler les responsabilités pour permettre un déploiement et une évolution indépendants ?

---

## Décision

Séparer l'application en **deux services indépendants** :

- `auth-service` (port 3001) : responsable de l'inscription, de la connexion et de la validation des JWT.
- `backend` (port 3000) : responsable des opérations CRUD sur les todos et de la distribution du frontend React.

Le `backend` proxifie les appels `/api/auth/*` vers l'`auth-service` via `http-proxy-middleware`.

---

## Alternatives considérées

| Alternative | Raison du rejet |
|---|---|
| Monolithe Express unique | Couplage fort, scalabilité limitée, un bug dans l'auth peut crasher le service todo |
| Trois services (frontend séparé) | Complexité supplémentaire sans gain suffisant pour ce projet |

---

## Conséquences

### Positives
- Chaque service est **déployable et scalable indépendamment** (ex. : scaler uniquement le backend en cas de charge).
- **Isolation des responsabilités** (Single Responsibility Principle) : l'auth-service ne connaît pas les todos.
- Un crash ou une faille dans un service n'impacte pas directement l'autre.
- Facilite les tests unitaires de chaque service de manière isolée.

### Négatives / Compromis
- **Complexité réseau accrue** : les appels inter-services nécessitent une résolution DNS interne (Docker/K8s).
- **Latence supplémentaire** : chaque requête authentifiée fait un appel HTTP à l'auth-service pour valider le JWT.
- Nécessite un mécanisme de **découverte de services** (Docker Compose DNS ou K8s Services).

---

## Liens

- [ADR-002 — Authentification JWT](ADR-002-authentification-jwt.md) — choix du mécanisme d'auth inter-services
- [ADR-003 — Multi-stage Dockerfile](ADR-003-multi-stage-dockerfile.md) — conséquence directe : un Dockerfile par service en dev
