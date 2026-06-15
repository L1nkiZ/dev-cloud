## Commandes utiles

### Logs en temps réel

```bash
# Tous les services
docker compose logs -f

# Un service spécifique
docker compose logs -f auth-service
docker compose logs -f backend
docker compose logs -f client
docker compose logs -f prometheus
docker compose logs -f grafana
```

### État des conteneurs

```bash
docker compose ps
```

### Rebuild un service après modification de package.json

```bash
docker compose build --no-cache auth-service
docker compose build --no-cache backend
```

### Arrêt

```bash
# Arrêter les services (conserve les données)
docker compose down

# Arrêter et tout supprimer (données MySQL + Grafana)
docker compose down -v
```

### Shell dans un conteneur

```bash
docker compose exec auth-service sh
docker compose exec backend sh
docker compose exec mysql mysql -u root -p
```

## Tests

```bash
# Auth-service (12 tests — JWT, bcrypt, validation token)
cd auth-service && npm test

# Backend / todo-service (17 tests — middleware auth, CRUD todos)
cd backend && npm test

# Frontend
cd client && npm test

# Avec couverture
npm run test:coverage
```