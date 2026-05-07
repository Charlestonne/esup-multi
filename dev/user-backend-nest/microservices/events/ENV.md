# Configuration — Microservice Events

Le fichier `.env` n'est pas versionné (gitignore). Copie `.env.dist` comme point de départ :

```bash
cp .env.dist .env
```

---

## Variables

| Variable | Description | Exemple |
|---|---|---|
| `EVENTS_SERVICE_HOST` | Hôte d'écoute du microservice | `localhost` |
| `EVENTS_SERVICE_PORT` | Port HTTP du microservice (healthcheck) | `3021` |
| `EVENTS_SERVICE_NATS_SERVERS` | URL(s) du broker NATS (séparées par virgule) | `nats://localhost:4222` |
| `EVENTS_SERVICE_PROVIDER_API_URL` | URL de la source de données events | voir ci-dessous |
| `EVENTS_SERVICE_PROVIDER_API_BEARER_TOKEN` | Token Bearer si la source requiert une auth | (vide = pas d'auth) |
| `EVENTS_SERVICE_CACHE_TTL_MS` | Durée de vie du cache en ms (`0` = illimité) | `300000` (5 min) |
| `EVENTS_SERVICE_CACHE_MAX` | Nombre maximum d'entrées en cache | `200` |

---

## `EVENTS_SERVICE_PROVIDER_API_URL` — Deux modes

### Mode mock (données statiques de test)

Pointe sur le serveur mock local. Les données sont codées en dur dans
`dev/user-backend-mocks/src/events/events.mock.js`.

```env
EVENTS_SERVICE_PROVIDER_API_URL=http://localhost:3099/mocking/events
```

Prérequis : le mock server doit tourner (`npm start` dans `dev/user-backend-mocks`).

### Mode Directus (données réelles agrégées)

Pointe directement sur l'API Directus. Les événements sont ingérés depuis
les sources externes (Portail VA, etc.) via les scripts dans `directus-aggregator/ingestors/`.

```env
EVENTS_SERVICE_PROVIDER_API_URL=http://localhost:8055/items/events
```

Prérequis :
- Directus doit tourner : `docker compose up -d` dans `directus-aggregator/`
- Le schéma doit être appliqué : `docker compose exec directus npx directus schema apply ./schema.yaml -y`
- Les rôles/permissions doivent être initialisés : `docker compose exec directus node /directus/scripts/001-init.js`
- Au moins un ingesteur doit avoir été lancé pour peupler la base

---

## Commandes de démarrage complètes

### Avec mock
```bash
# Terminal 1 — Mock server
cd dev/user-backend-mocks && npm start

# Terminal 2 — Microservice events
npm run back:events -- npm run start:dev

# Terminal 3 — API Gateway
cd dev/user-backend-nest/main && npm run start:dev
```

### Avec Directus
```bash
# Terminal 1 — Directus
cd directus-aggregator && docker compose up -d

# Terminal 2 — Microservice events
npm run back:events -- npm run start:dev

# Terminal 3 — API Gateway
cd dev/user-backend-nest/main && npm run start:dev
```
