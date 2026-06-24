# ADR-005 — Infrastructure-as-Code avec Terraform sur Azure

| Champ | Valeur |
|---|---|
| **Statut** | Accepté |
| **Date** | 2026-06-24 |
| **Décideurs** | Guillaume G |

---

## Contexte

Le déploiement cloud doit être **reproductible, versionné et traçable**. Les opérations manuelles via la console Azure présentent plusieurs risques :

- Pas de traçabilité (qui a créé quoi, quand, pourquoi).
- Impossible de recréer l'environnement de manière identique (snowflake servers).
- Pas de processus de review (PR) avant d'appliquer un changement d'infrastructure.
- Rollback complexe ou impossible.

---

## Décision

Utiliser **Terraform** (v1.5+) avec le provider `azurerm` pour provisionner l'ensemble de l'infrastructure Azure :

```
terraform/
├── main.tf        → Provider azurerm + resource group
├── network.tf     → VNet (10.0.0.0/16) + subnet AKS (10.0.1.0/24)
├── aks.tf         → Cluster AKS (2× Standard_B2s, K8s 1.29, Azure CNI)
├── acr.tf         → Azure Container Registry (SKU Basic) + rôle AcrPull
├── kubernetes.tf  → Namespace K8s + secret bootstrap
├── variables.tf   → Paramètres configurables
└── outputs.tf     → Nom du cluster, ACR login server, commande kubeconfig
```

**Ressources provisionnées :**
- Resource Group Azure (région : `francecentral`)
- Virtual Network `10.0.0.0/16` + sous-réseau AKS `10.0.1.0/24`
- Cluster AKS — 2 nœuds `Standard_B2s` — Kubernetes 1.29 — Azure CNI — Load Balancer Standard
- Azure Container Registry (ACR) — SKU Basic
- Attribution de rôle `AcrPull` à l'identité managée de l'AKS

---

## Alternatives considérées

| Alternative | Raison du rejet |
|---|---|
| Console Azure (manuel) | Non versionné, non reproductible, pas de review possible |
| Azure Bicep | Moins portable (Azure uniquement), écosystème plus petit, moins de ressources pédagogiques |
| Pulumi | Nécessite un vrai langage de programmation (TypeScript/Python), courbe d'apprentissage plus élevée |
| Scripts Azure CLI | Non idempotents : rejouer le script crée des erreurs si les ressources existent déjà |
| ARM Templates | Verbose, difficile à lire et maintenir |

---

## Conséquences

### Positives
- **Infrastructure versionnée dans Git** : chaque modification passe par une PR, revue par l'équipe.
- **Idempotent** : `terraform apply` peut être rejoué sans effet de bord (crée ce qui manque, ne touche pas ce qui existe déjà).
- **Terraform state** documente l'état réel de l'infrastructure en permanence.
- **Plan avant apply** : `terraform plan` montre exactement ce qui va changer avant d'exécuter.
- Portable vers d'autres clouds (GCP, AWS) avec un changement de provider.

### Négatives / Compromis
- **Courbe d'apprentissage HCL** (HashiCorp Configuration Language).
- Le **Terraform state** doit être stocké dans un backend distant (Azure Blob Storage) pour le travail en équipe — risque de corruption si deux personnes appliquent en même temps.
- **Coût Azure réel** si l'infrastructure reste provisionnée (AKS + VMs).
- `terraform destroy` doit être exécuté explicitement pour éviter les coûts inutiles.

### Workflow de déploiement

```bash
cd terraform
terraform init                    # Initialise les providers
terraform plan                    # Aperçu des changements
terraform apply                   # Provisionne l'infrastructure

az acr login --name <acr-name>   # Connexion au registry
docker build -f Dockerfile.prod -t <acr>.azurecr.io/dev-cloud:latest .
docker push <acr>.azurecr.io/dev-cloud:latest

az aks get-credentials --resource-group <rg> --name <cluster>
kubectl apply -f k8s/             # Déploie les manifests
```

---

## Liens

- [ADR-006 — Kubernetes](ADR-006-kubernetes.md) — l'AKS provisionné par Terraform est le cluster cible des manifests K8s
