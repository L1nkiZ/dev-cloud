# ADR-004 — Todos liés aux utilisateurs (user_id)

---

## Contexte

Dans la version initiale de l'application, la table `todos` ne comportait pas de référence à un utilisateur : **tous les utilisateurs authentifiés voyaient et pouvaient modifier toutes les todos**. Ce comportement ne correspond pas à une vraie application de gestion de tâches, où chaque utilisateur doit avoir ses propres données isolées.

---

## Décision

Ajouter une colonne `user_id` à la table `todos` et **filtrer systématiquement toutes les requêtes SQL** par le `user_id` extrait du JWT :

```sql
-- Migration
ALTER TABLE todos ADD COLUMN user_id INT NOT NULL;

-- Lecture
SELECT * FROM todos WHERE user_id = ?;

-- Création
INSERT INTO todos (text, done, user_id) VALUES (?, ?, ?);

-- Mise à jour / suppression avec vérification d'ownership
UPDATE todos SET text = ?, done = ? WHERE id = ? AND user_id = ?;
DELETE FROM todos WHERE id = ? AND user_id = ?;
```

Le `user_id` est extrait du payload JWT sans appel supplémentaire à la base de données.

---

## Alternatives considérées

| Alternative | Raison du rejet |
|---|---|
| Table `todos` globale sans isolation | Pas d'isolation des données — mauvaise pratique et non réaliste |
| Namespace par utilisateur (table dédiée par user) | Impraticable à l'échelle, incompatible avec les ORM standards |
| Filtrage côté application uniquement | Fragile : oublier un filtre expose les données d'autres utilisateurs |

---

## Conséquences

### Positives
- **Isolation des données** : un utilisateur ne peut voir ni modifier les todos d'un autre.
- **Exploitation du JWT** : le `userId` est déjà disponible après validation du token, aucun appel SQL supplémentaire pour identifier l'utilisateur.
- La contrainte `AND user_id = ?` sur les UPDATE/DELETE protège contre les **attaques d'accès non autorisé** (IDOR — Insecure Direct Object Reference).

### Négatives / Compromis
- **Migration de base de données** nécessaire (ajout de colonne, backfill des données existantes).
- Les tests doivent systématiquement créer un utilisateur avant de créer des todos.
- En cas de suppression d'un utilisateur, il faut prévoir une cascade ou un nettoyage des todos orphelins.

---

## Liens

- [ADR-002 — Authentification JWT](ADR-002-authentification-jwt.md) — le `userId` contenu dans le token est la source de vérité pour le filtrage
