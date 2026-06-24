# ADR-003 — Multi-stage Dockerfile de Production

| Champ | Valeur |
|---|---|
| **Statut** | Accepté |
| **Date** | 2026-06-24 |
| **Décideurs** | Guillaume G |

---

## Contexte

Le frontend (React/Vite) et le backend (Express/TypeScript) ont des processus de build radicalement différents. En développement, des Dockerfiles séparés suffisent. En production, il faut optimiser :

- **Taille de l'image** : les dépendances de build (`typescript`, `vite`, `@types/*`) ne doivent pas se retrouver dans l'image finale.
- **Sécurité** : moins d'outils = moins de surface d'attaque.
- **Déploiement** : idéalement un seul container à orchestrer.

---

## Décision

Utiliser un **`Dockerfile.prod` multi-stage** combinant frontend et backend :

```
Stage 1 — client-build   (node:latest)
  └─ npm install
  └─ npm run build  →  dist/  (bundle Vite)

Stage 2 — backend-build  (node:latest)
  └─ npm install
  └─ tsc  →  dist/  (JS compilé)

Stage 3 — production     (node:20-alpine)
  └─ COPY --from=backend-build dist/  →  dist/
  └─ COPY --from=client-build  dist/  →  src/static/
  └─ EXPOSE 3000
  └─ CMD ["node", "dist/index.js"]
```

Le backend Express sert à la fois l'API (`/api`) et les fichiers statiques React (`src/static/`), ce qui permet un **déploiement mono-container**.

En développement, chaque service conserve son propre Dockerfile léger avec hot-reload.

---

## Alternatives considérées

| Alternative | Raison du rejet |
|---|---|
| Image unique sans multi-stage | Inclut les devDependencies (~800 MB vs ~100 MB), non sécurisé |
| Deux containers distincts (frontend nginx + backend) | Complexité K8s accrue (2 deployments, 2 services, ingress), overhead réseau |
| Build hors Docker, copie dans l'image | Non reproductible, dépend de l'environnement CI |

---

## Conséquences

### Positives
- **Image finale ~100 MB** vs ~800 MB sans multi-stage (8× plus légère).
- **Aucune dépendance de dev** dans l'image de production (`typescript`, `vite`, etc.).
- **Un seul container** à déployer et orchestrer dans Kubernetes.
- Build **reproductible** : le résultat est identique quel que soit l'environnement CI.
- `node:20-alpine` = image de base minimaliste, moins de CVE potentielles.

### Négatives / Compromis
- **Temps de build plus long** : trois stages s'exécutent séquentiellement.
- Le **cache Docker par layer** doit être bien géré (copier `package.json` avant `src/` pour bénéficier du cache npm).
- Le debugging de l'image de production est plus difficile (pas de shell bash sur alpine par défaut).

---

## Liens

- [ADR-001 — Architecture Microservices](ADR-001-architecture-microservices.md) — séparer les services justifie aussi des Dockerfiles séparés en dev
