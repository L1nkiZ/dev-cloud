# ADR-006 — Orchestration avec Kubernetes

---

## Contexte

Docker Compose est suffisant pour le développement local, mais il ne répond pas aux besoins d'un environnement de production :

- **Pas de haute disponibilité** : si un container crash, il ne redémarre pas automatiquement de manière fiable.
- **Pas de rolling update** : mettre à jour un service nécessite un downtime.
- **Pas de scalabilité** : impossible de passer à N instances d'un service dynamiquement.
- **Pas de gestion de ressources** : un service peut consommer toute la RAM du host.

---

## Décision

Utiliser **Kubernetes** pour l'orchestration en production, avec des manifests YAML organisés par ordre d'application dans `/k8s/` :

```
k8s/
├── 00-namespace.yaml      → Namespace dédié dev-cloud
├── 01-configmap.yaml      → Variables d'environnement non-sensibles
├── 02-secret.yaml         → Credentials et JWT_SECRET (base64)
├── 03-mysql.yaml          → StatefulSet + PersistentVolumeClaim (1 Gi)
├── 04-backend.yaml        → Deployment + Service ClusterIP
├── 05-phpmyadmin.yaml     → Deployment phpMyAdmin
├── 06-auth-service.yaml   → Deployment + Service ClusterIP
├── 07-prometheus.yaml     → Deployment + ConfigMap scrape + LoadBalancer
├── 08-grafana.yaml        → Deployment + provisioning datasource + LoadBalancer
├── 09-client.yaml         → Deployment client (si séparé)
└── 10-proxy.yaml          → Ingress / proxy
```

**Patterns Kubernetes utilisés :**

| Pattern | Usage |
|---|---|
| `Namespace` | Isolation de tous les objets dans `dev-cloud` |
| `ConfigMap` | Variables non-sensibles (MYSQL_HOST, AUTH_SERVICE_URL…) |
| `Secret` | Credentials et JWT_SECRET encodés en base64 |
| `StatefulSet` | MySQL : garantit un nom de pod stable (`mysql-0`) et une association fixe au PVC |
| `Deployment` | Services stateless : backend, auth-service, prometheus, grafana |
| `PersistentVolumeClaim` | Stockage MySQL persistant (1 Gi) |
| `Service ClusterIP` | Communication interne entre pods |
| `Service LoadBalancer` | Exposition externe (Prometheus, Grafana) |
| `readinessProbe` | Vérifie qu'un pod est prêt avant de recevoir du trafic |
| `livenessProbe` | Redémarre un pod bloqué ou crashé |
| `initContainers` | Pattern wait-for-MySQL : attend que le port 3306 soit disponible |
| `resources.requests/limits` | Garantie CPU/RAM min, limitation CPU/RAM max |

**Resource limits appliquées à chaque pod :**
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

---

## Alternatives considérées

| Alternative | Raison du rejet |
|---|---|
| Docker Compose en production | Pas de HA, pas de self-healing, pas de rolling update |
| Docker Swarm | Moins riche en fonctionnalités, écosystème en déclin |
| Nomad (HashiCorp) | Moins standard, moins de ressources pédagogiques |

---

## Conséquences

### Positives
- **Self-healing** : K8s redémarre automatiquement les pods crashés.
- **Rolling updates** sans downtime : les pods sont remplacés progressivement.
- **Scalabilité horizontale** via `kubectl scale deployment backend --replicas=3`.
- **Isolation** via le namespace `dev-cloud` : pas d'interférence avec d'autres workloads.
- Compatible avec le cluster **AKS provisionné par Terraform**.

### Négatives / Compromis
- **Complexité opérationnelle importante** par rapport à Docker Compose.
- **Nécessite Docker Desktop** avec Kubernetes activé pour les tests en local.
- Les `Secret` K8s en base64 **ne sont pas chiffrés** — voir les points d'amélioration.
- Courbe d'apprentissage YAML + kubectl significative.

### Points d'amélioration pour la production
- **Sealed Secrets** (Bitnami) ou **Azure Key Vault** pour chiffrer les secrets K8s.
- **HPA** (Horizontal Pod Autoscaler) pour scaler automatiquement selon la charge CPU.
- **RBAC** granulaire pour limiter les permissions par service.
- **NetworkPolicy** pour restreindre la communication inter-pods.

---

## Liens

- [ADR-005 — Terraform Azure](ADR-005-infrastructure-as-code-terraform.md) — provisionne le cluster AKS cible
- [ADR-007 — Prometheus & Grafana](ADR-007-monitoring-prometheus-grafana.md) — le monitoring est déployé comme workload K8s
