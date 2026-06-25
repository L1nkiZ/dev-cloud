# ADR-007 — Monitoring avec Prometheus et Grafana

---

## Contexte

En production, il est indispensable d'**observer le comportement du système** : taux d'erreurs, latences, consommation mémoire, nombre d'opérations par seconde. Sans observabilité, un incident est détecté par les utilisateurs avant les équipes techniques.

Les questions auxquelles le monitoring doit répondre :
- L'application répond-elle correctement ? À quelle vitesse ?
- Combien d'utilisateurs se connectent par minute ?
- La mémoire Node.js augmente-t-elle anormalement (memory leak) ?
- Combien de todos sont créés/lus/modifiés/supprimés ?

---

## Décision

Instrumenter chaque service avec **`prom-client`** (bibliothèque Prometheus officielle pour Node.js) et déployer **Prometheus + Grafana** comme stack de monitoring :

### Métriques exposées

**Auth-Service (`/metrics`)** :
- `auth_login_total` — counter, labelé `status` (success/failure)
- `auth_signup_total` — counter
- `auth_validate_total` — counter

**Backend (`/api/metrics`)** :
- `todo_operations_total` — counter, labelé `operation` (create/read/update/delete)
- `http_request_duration_seconds` — histogram (buckets: 0.05s à 10s)
- `nodejs_heap_size_used_bytes` — gauge

### Configuration Prometheus (`prometheus.yml`)
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'todo-service'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/api/metrics'

  - job_name: 'auth-service'
    static_configs:
      - targets: ['auth-service:3001']
    metrics_path: '/metrics'
```

### Dashboard Grafana
Dashboard "Dev Cloud — Microservices" **auto-provisionné** au démarrage, avec les panneaux :
- Auth : logins/signups/validations par seconde
- Todo : opérations CRUD par seconde
- Performance : latences HTTP p50 / p95 / p99
- Système : heap Node.js, event loop lag

---

## Alternatives considérées

| Alternative | Raison du rejet |
|---|---|
| Logs uniquement (Winston/Morgan) | Pas de métriques agrégées, difficile de calculer des taux ou percentiles |
| Datadog / New Relic | Solutions SaaS payantes, dépendance externe non nécessaire |
| OpenTelemetry seul | Plus complexe à configurer, overkill pour ce projet (tracing > métriques simples) |
| Métriques maison (endpoint JSON) | Pas de standard, pas d'intégration dashboards |

---

## Conséquences

### Positives
- **Visibilité complète** sur le comportement de l'application dès le démarrage.
- **Dashboards disponibles immédiatement** : Grafana provisione automatiquement la datasource Prometheus et le dashboard.
- **Alerting possible** via Grafana Alertmanager sans infrastructure supplémentaire.
- Stack **open source et standard** dans l'industrie (CNCF).
- Les métriques `http_request_duration_seconds` permettent de calculer les **SLOs** (p99 < 500ms par exemple).

### Négatives / Compromis
- **Stockage Prometheus éphémère** : pas de PersistentVolumeClaim configuré — les métriques sont perdues si le pod redémarre.
- `prom-client` ajoute une dépendance et quelques lignes d'instrumentation dans chaque service.
- Grafana expose des données sensibles sur l'activité de l'application — à sécuriser (auth obligatoire en production).

### Points d'amélioration pour la production
- Ajouter un **PVC pour Prometheus** (rétention configurable, ex. 30 jours).
- **Alertes Grafana** sur les métriques critiques (taux d'erreur > 1%, heap > 400 MB).
- **Tracing distribué** avec OpenTelemetry + Jaeger pour corréler les appels inter-services.
- Activer l'authentification Grafana (désactiver `anonymous_access`).

---

## Liens

- [ADR-001 — Architecture Microservices](ADR-001-architecture-microservices.md) — chaque service expose indépendamment ses métriques
- [ADR-006 — Kubernetes](ADR-006-kubernetes.md) — Prometheus et Grafana sont déployés comme workloads K8s
