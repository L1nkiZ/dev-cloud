# ADR-002 — Authentification JWT Stateless

---

## Contexte

Dans une architecture microservices, l'authentification doit fonctionner dans un contexte distribué où plusieurs instances de chaque service peuvent tourner. Le mécanisme choisi doit être compatible avec la scalabilité horizontale.

Deux familles de solutions existent :
- **Sessions côté serveur** : le serveur stocke l'état de session (en mémoire ou dans un store partagé comme Redis).
- **Tokens côté client (JWT)** : le client transporte un token signé, le serveur vérifie la signature sans stocker d'état.

---

## Décision

Utiliser des **JSON Web Tokens (JWT)** pour l'authentification :

1. L'`auth-service` génère un JWT signé avec `JWT_SECRET` lors du login/signup.
2. Le token contient les claims : `userId`, `email`.
3. Pour chaque requête protégée, le `backend` appelle `GET /validate` sur l'`auth-service` en passant le token.
4. L'`auth-service` vérifie la signature et retourne les informations de l'utilisateur.
5. Les mots de passe sont hachés avec **bcryptjs** avant stockage en base.

---

## Alternatives considérées

| Alternative | Raison du rejet |
|---|---|
| Sessions Express en mémoire | Non compatible load balancing (sticky sessions requises), état non partagé entre instances |
| Sessions avec store Redis | Dépendance supplémentaire (Redis), complexité accrue |
| OAuth2 / OpenID Connect | Over-engineering pour ce projet académique, complexité de mise en œuvre |

---

## Conséquences

### Positives
- **Stateless** : aucune session à stocker côté serveur, simplifie le déploiement.
- Compatible **scalabilité horizontale** : n'importe quelle instance peut valider un token sans synchronisation.
- Le token **transporte l'identité** (`userId`) évitant des appels supplémentaires à la base pour identifier l'utilisateur.
- Standard ouvert, large écosystème de bibliothèques.

### Négatives / Compromis
- **Impossible de révoquer un token** avant son expiration sans mécanisme de liste noire (ex. Redis blacklist).
- Le `JWT_SECRET` doit être protégé : compromis = compromission de tous les tokens actifs.
- Chaque requête authentifiée implique un appel HTTP à `/validate` sur l'auth-service (latence ~1-5 ms en local).

### Points d'amélioration pour la production
- Rotation du `JWT_SECRET` via Azure Key Vault ou Vault HashiCorp.
- Liste noire Redis pour l'invalidation immédiate (déconnexion forcée, changement de mot de passe).
- Durée d'expiration courte (15 min) + refresh token pour limiter l'exposition.

---

## Liens

- [ADR-001 — Architecture Microservices](ADR-001-architecture-microservices.md) — contexte distribuéqui motive ce choix
- [ADR-004 — Todos liés aux utilisateurs](ADR-004-todos-par-utilisateur.md) — exploitation du `userId` contenu dans le JWT
