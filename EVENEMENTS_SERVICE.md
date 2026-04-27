# Service "Événements" — Documentation d'implémentation

Ce document décrit toutes les étapes suivies pour ajouter le service **Événements** dans Esup-Multi.
Le pattern suivi est celui du microservice `restaurants` (liste + détail + état réactif).

---

## Architecture globale

```
Mock API (port 3099)
       ↓  HTTP GET
Microservice events (port 3021, NATS queue "events")
       ↓  NATS
API Gateway / main (port 3000)
       ↓  HTTP
Frontend Angular/Ionic (port 8100)
```

MongoDB (port 27017) est utilisé par le microservice pour persister les likes.

---

## PARTIE 1 — Mock de données de test

### Fichiers créés

#### `dev/user-backend-mocks/src/events/events.mock.js`

5 événements de test avec des dates dynamiques (`Date.now() + N jours`).
Chaque événement a : `id`, `title`, `description`, `creator`, `location`, `locationLat`, `locationLng`, `contactInfo`, `association`, `type`, `startDate`, `endDate`, `imageUrl`.

```js
const eventsData = [
  {
    id: '1',
    title: 'Soirée de bienvenue BDE',
    startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
    // ...
  },
  // ... 4 autres événements
];
module.exports = { eventsData };
```

#### `dev/user-backend-mocks/src/events/events.route.js`

Route Express qui expose les données mock :

```js
const express = require('express');
const router = express.Router();
const { eventsData } = require('./events.mock');
router.get('/', (req, res) => res.json(eventsData));
module.exports = router;
```

### Fichier modifié

#### `dev/user-backend-mocks/src/app.js`

Ajout de l'import et du montage du router events :

```js
// Ajouté parmi les autres imports
const eventsRouter = require('./events/events.route');

// Ajouté parmi les autres routes
app.use('/mocking/events', eventsRouter);
```

---

## PARTIE 2 — Microservice NestJS

Répertoire créé : `dev/user-backend-nest/microservices/events/`

### 2.1 — `package.json`

Copié depuis `microservices/restaurants/package.json` et adapté :
- `"name": "events"`
- Dépendances ajoutées : `@nestjs/mongoose`, `mongoose`
- **Correction critique** : `prettier` mis à `^3.0.0` (au lieu de `^2.3.2`) pour résoudre un conflit de peer dependency avec `@nestjs/schematics@11`.

### 2.2 — `tsconfig.json` / `tsconfig.build.json`

Copiés depuis `microservices/restaurants/` sans modification.

### 2.3 — `src/infos.json`

```json
{ "version": "1.0.0" }
```

Utilisé par `update-infos.js` (script `prebuild`) pour horodater le build.

### 2.4 — `src/config/configuration.interfaces.ts`

Types TypeScript pour la configuration :

```typescript
export interface EventsProviderApi {
  apiUrl: string;
  bearerToken: string;
}

export interface KeepAliveOptions {
  keepAlive?: boolean;
  keepAliveMsecs?: number;
  // ...
}
```

### 2.5 — `src/config/configuration.ts`

Fonction de configuration NestJS qui lit les variables d'environnement :

```typescript
export default () => ({
  eventsProviderApi: {
    apiUrl: process.env.EVENTS_SERVICE_PROVIDER_API_URL,
    bearerToken: process.env.EVENTS_SERVICE_PROVIDER_API_BEARER_TOKEN,
  },
  cacheTtlMs: parseInt(process.env.EVENTS_SERVICE_CACHE_TTL_MS) || 300000,
  cacheMax: parseInt(process.env.EVENTS_SERVICE_CACHE_MAX) || 200,
  mongoUri: process.env.EVENTS_SERVICE_MONGODB_URI || 'mongodb://localhost:27017/events',
  keepAliveOptions: { /* ... options agentkeepalive */ },
});
```

### 2.6 — `src/keepalive-http.module.ts`

Copié depuis `microservices/restaurants/`. Module NestJS qui configure `HttpModule` avec `agentkeepalive` pour des connexions HTTP persistantes vers l'API externe.

### 2.7 — `src/events/events.dto.ts`

Interfaces TypeScript définissant les contrats de données :

```typescript
// Ce que retourne l'API externe
export interface EventExternalApiDto { id, title, description, creator, location,
  locationLat?, locationLng?, contactInfo, association?, type?, startDate, endDate?, imageUrl? }

// Ce que retourne le microservice (ajoute likesCount)
export interface EventDto extends EventExternalApiDto { likesCount: number; }

// Messages NATS
export interface LikeEventDto { eventId: string; username: string; }
export interface LikeEventResponseDto { eventId: string; liked: boolean; likesCount: number; }
export interface GetUserLikesDto { username: string; }
```

### 2.8 — `src/likes/likes.schema.ts`

Document MongoDB pour les likes :

```typescript
@Schema()
export class Like extends Document {
  @Prop({ required: true }) eventId: string;
  @Prop({ required: true }) username: string;
  @Prop({ default: Date.now }) createdAt: Date;
}
export const LikeSchema = SchemaFactory.createForClass(Like);
// Index unique pour éviter les doublons (un user = un like par événement)
LikeSchema.index({ eventId: 1, username: 1 }, { unique: true });
```

### 2.9 — `src/likes/likes.repository.ts`

Repository encapsulant toutes les requêtes MongoDB :

| Méthode | Description |
|---|---|
| `countByEventId(eventId)` | Compte les likes d'un événement |
| `countByEventIds(eventIds[])` | Aggregate : counts pour une liste d'événements en une requête |
| `findByUsername(username)` | Retourne les `eventId` likés par un utilisateur |
| `create(eventId, username)` | Crée un like |
| `delete(eventId, username)` | Supprime un like |
| `exists(eventId, username)` | Vérifie si un like existe |

### 2.10 — `src/likes/likes.module.ts`

Module NestJS qui enregistre le schema Mongoose et exporte `LikesRepository` :

```typescript
@Module({
  imports: [MongooseModule.forFeature([{ name: Like.name, schema: LikeSchema }])],
  providers: [LikesRepository],
  exports: [LikesRepository],
})
export class LikesModule {}
```

### 2.11 — `src/events/events.service.ts`

Service qui appelle l'API externe et enrichit les données avec les compteurs de likes :

```typescript
getEvents(): Observable<EventDto[]> {
  return this.httpService.get(apiUrl, { headers: { Authorization: `Bearer ${token}` } }).pipe(
    map(res => res.data),
    switchMap(externalEvents => from(this.enrichWithLikeCounts(externalEvents))),
  );
}

private async enrichWithLikeCounts(events): Promise<EventDto[]> {
  const likeCounts = await this.likesRepository.countByEventIds(eventIds);
  return events.map(e => ({ ...e, likesCount: likeCounts[e.id] || 0 }));
}
```

### 2.12 — `src/events/events.controller.ts`

Controller NATS avec 4 message patterns :

| Pattern | Description |
|---|---|
| `{ cmd: 'events' }` | Retourne la liste (avec cache) |
| `{ cmd: 'event/like' }` | Like un événement, invalide le cache |
| `{ cmd: 'event/unlike' }` | Unlike un événement, invalide le cache |
| `{ cmd: 'event/user-likes' }` | Retourne les eventIds likés par un utilisateur |

Le cache (`@nestjs/cache-manager`) stocke la liste des événements avec la clé `'events'` et est invalidé à chaque like/unlike.

### 2.13 — `src/events/events.module.ts`

Module NestJS qui assemble le tout :

```typescript
@Module({
  imports: [ConfigModule, KeepaliveHttpModule, LikesModule,
    CacheModule.registerAsync({ useFactory: (config) => ({ max: config.get('cacheMax') }) })],
  controllers: [EventsController],
  providers: [EventsService],
})
export class EventsModule {}
```

### 2.14 — `src/monitoring/monitoring.controller.ts` + `monitoring.module.ts`

Copiés depuis `microservices/restaurants/`. Expose `/healthcheck` HTTP.

### 2.15 — `src/app.module.ts`

Module racine du microservice :

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ load: [configuration] }),
    MongooseModule.forRootAsync({
      useFactory: (configService) => ({ uri: configService.get('mongoUri') }),
    }),
    EventsModule,
    LikesModule,
    MonitoringModule,
  ],
})
export class AppModule {}
```

### 2.16 — `src/main.ts`

Bootstrap du microservice :
- Crée l'application NestJS
- Connecte le transport NATS avec la queue `'events'`
- Écoute sur le port HTTP défini par `EVENTS_SERVICE_PORT`

### 2.17 — `.env`

```env
EVENTS_SERVICE_HOST=localhost
EVENTS_SERVICE_PORT=3021
EVENTS_SERVICE_NATS_SERVERS=nats://localhost:4222

EVENTS_SERVICE_PROVIDER_API_URL=http://localhost:3099/mocking/events
EVENTS_SERVICE_PROVIDER_API_BEARER_TOKEN=

# Credentials MongoDB Docker (root défini dans env/local/docker/auth/docker-compose.yml)
EVENTS_SERVICE_MONGODB_URI=mongodb://root:example@localhost:27017/events?authSource=admin

EVENTS_SERVICE_CACHE_TTL_MS=300000
EVENTS_SERVICE_CACHE_MAX=200
```

**Problèmes rencontrés et résolus :**
- Port `3020` déjà utilisé → changé à `3021`
- `mongodb://localhost:27017/events` → erreur d'auth car MongoDB Docker requiert credentials
- `mongodb://multi:multi@...` → refus car l'utilisateur `multi` n'a accès qu'à la base `multi2023`
- Solution finale : `mongodb://root:example@localhost:27017/events?authSource=admin`

---

## PARTIE 3 — Intégration dans l'API Gateway

### 3.1 — Fichier créé : `dev/user-backend-nest/main/src/config/microservice-events.config.ts`

Config NATS pour le client events dans la gateway :

```typescript
export default registerAs('microservice-events', () => ({
  transport: Transport.NATS,
  options: {
    servers: process.env.EVENTS_SERVICE_NATS_SERVERS.split(',').map(s => s.trim()),
  },
}));
```

### 3.2 — Fichier modifié : `dev/user-backend-nest/main/src/app.module.ts`

**Ajout 1** — Import de la config :
```typescript
import microserviceEventsConfig from './config/microservice-events.config';
```

**Ajout 2** — Dans `ConfigModule.forRoot({ load: [...] })` :
```typescript
microserviceEventsConfig,
```

**Ajout 3** — Dans `ClientsModule.registerAsync([...])` :
```typescript
{
  name: 'EVENTS_SERVICE',
  useFactory: (config: ConfigService) => config.get<ClientOptions>('microservice-events'),
  inject: [ConfigService],
},
```

### 3.3 — Fichier modifié : `dev/user-backend-nest/main/src/app.controller.ts`

**Ajout 1** — Injection du client events dans le constructeur :
```typescript
@Inject('EVENTS_SERVICE') private eventsClient: ClientProxy,
```

**Ajout 2** — 4 nouvelles routes HTTP :

```typescript
// Route publique — pas d'authentification requise
@Get('/events')
getEvents() {
  return this.eventsClient.send({ cmd: 'events' }, {});
}

// Routes authentifiées — getUserOrThrowError valide le token et extrait le username
@Post('/event/like')
likeEvent(@Body() body) {
  return this.authClient.send({ cmd: 'getUserOrThrowError' }, body).pipe(
    concatMap(user => this.eventsClient.send({ cmd: 'event/like' }, { eventId: body.eventId, username: user.username }))
  );
}

@Post('/event/unlike')
unlikeEvent(@Body() body) { /* même pattern que like */ }

@Post('/event/user-likes')
getUserLikes(@Body() body) {
  return this.authClient.send({ cmd: 'getUserOrThrowError' }, body).pipe(
    concatMap(user => this.eventsClient.send({ cmd: 'event/user-likes' }, { username: user.username }))
  );
}
```

---

## PARTIE 4 — Frontend Angular/Ionic

Répertoire créé : `dev/user-frontend-ionic/projects/events/`

### 4.1 — `ng-package.json`

Configuré pour compiler vers `dist/events` :

```json
{
  "dest": "../../dist/events",
  "lib": { "entryFile": "src/public-api.ts" }
}
```

### 4.2 — `src/public-api.ts`

Exports publics de la librairie :

```typescript
export * from './lib/events.module';
export * from './lib/events.service';
export * from './lib/models/event.model';
```

### 4.3 — `src/lib/models/event.model.ts`

Interfaces TypeScript :

```typescript
export interface Event { id, title, description, creator, location,
  locationLat?, locationLng?, contactInfo, association?, type?,
  startDate, endDate?, imageUrl?, likesCount }

export interface EventWithUserLike extends Event { isLikedByUser: boolean; }
export type EventSortOption = 'date' | 'likes';
export interface EventFilters { association?, type?, location? }
export interface LikeEventResponse { eventId, liked, likesCount }
```

### 4.4 — `src/lib/events.repository.ts`

Store réactif avec `@ngneat/elf` :
- `withEntities<Event>()` — liste des événements indexée par `id`
- `withProps<{ userLikedEventIds: string[] }>` — IDs des événements likés par l'utilisateur

Sélecteurs exportés : `events$`, `userLikedEventIds$`

Mutations exportées : `setEvents()`, `setUserLikes()`, `addUserLike(eventId, newCount)`, `removeUserLike(eventId, newCount)`, `clearEvents()`

### 4.5 — `src/lib/events.service.ts`

Service Angular avec 4 méthodes :

| Méthode | Endpoint | Auth |
|---|---|---|
| `loadAndStoreEvents()` | `GET /events` | Non |
| `loadAndStoreUserLikes()` | `POST /event/user-likes` | Oui (`authToken` dans le body) |
| `likeEvent(eventId)` | `POST /event/like` | Oui |
| `unlikeEvent(eventId)` | `POST /event/unlike` | Oui |

Toutes les méthodes authentifiées utilisent `getAuthToken()` de `@multi/shared` pour lire le token depuis le stockage sécurisé (Capacitor `SecureStoragePlugin`).

### 4.6 — `src/lib/components/event-card/event-card.component.ts`

Composant carte réutilisable :
- `@Input() event: EventWithUserLike` — données de l'événement
- `@Output() likeToggled = new EventEmitter<string>()` — émis au clic sur le bouton like
- `@Output() cardClicked = new EventEmitter<string>()` — émis au clic sur la carte

`onLikeClick()` appelle `event.stopPropagation()` pour ne pas déclencher `cardClicked` en même temps.

### 4.7 — `src/lib/pages/events-list/events-list.page.ts`

Page principale :
- Charge les événements et les likes utilisateur dans `ngOnInit`
- `buildFilteredEvents()` — combine `events$` et `userLikedEventIds$`, applique les filtres et le tri
- `sortOption: 'date' | 'likes'` — modifié via `onSortChange()`
- `filters: EventFilters` — modifié via `openFilterSheet()`
- `toggleLike(event)` — appelle `likeEvent()` ou `unlikeEvent()` selon l'état
- `availableAssociations`, `availableTypes`, `availableLocations` — extraits dynamiquement des données chargées

**Correction** : la méthode `buildFilteredEvents()` doit être `public` (pas `private`) car le template Angular y accède.

### 4.8 — `src/lib/pages/event-detail/event-detail.page.ts`

Page détail :
- Récupère l'événement par ID depuis le store (via `ActivatedRoute`)
- `toggleLike()` appelle le service et met à jour l'état local (`isLikedByUser`, `likesCount`)

### 4.9 — `src/lib/pages/events-map/events-map.page.ts`

Page carte :
- Filtre les événements qui ont des coordonnées (`locationLat != null && locationLng != null`)
- Affiche les marqueurs dans le template HTML (sans librairie carte externe pour l'instant)

### 4.10 — `src/lib/events-routing.module.ts`

Routes de la librairie :

```typescript
const routes: Routes = [
  { path: 'events', component: EventsListPage },
  { path: 'events/map', component: EventsMapPage },
  { path: 'events/:id', component: EventDetailPage },
];
```

### 4.11 — `src/lib/events.module.ts`

Module Angular qui :
- Déclare les 4 composants/pages
- Importe `IonicModule`, `TranslateModule`, `SharedComponentsModule`, etc.
- Enregistre le module dans l'app via `APP_INITIALIZER` → `ProjectModuleService.initProjectModule({ name: 'events', translation: true })`
- Expose `static routerLink = '/events'` pour que le menu puisse créer le lien

---

## PARTIE 5 — Internationalisation

### Fichiers créés

#### `dev/user-frontend-ionic/src/theme/app-theme/i18n/modules/events/fr.json`

```json
{
  "EVENTS": {
    "TITLE": "Événements",
    "NO_DATA": "Aucun événement trouvé",
    "SORT": { "LABEL": "Trier par", "DATE": "Date", "LIKES": "Popularité" },
    "FILTER": { "LABEL": "Filtrer", "ASSOCIATION": "Association",
      "TYPE": "Type d'événement", "LOCATION": "Lieu", "CLEAR": "Effacer" },
    "DETAIL": { "CONTACT": "Informations de contact", "CREATOR": "Organisateur",
      "LOCATION": "Lieu", "DATE": "Date" },
    "LIKE": "J'aime", "UNLIKE": "Je n'aime plus",
    "MAP": "Voir sur la carte", "MAP_TITLE": "Carte des événements"
  }
}
```

#### `dev/user-frontend-ionic/src/theme/app-theme/i18n/modules/events/en.json`

Version anglaise des mêmes clés.

---

## PARTIE 6 — Enregistrement dans l'application

### 6.1 — `dev/user-frontend-ionic/tsconfig.json`

Ajout du path alias pour que TypeScript resolv `@multi/events` vers le dossier compilé :

```json
"@multi/events": ["dist/events"]
```

### 6.2 — `dev/user-frontend-ionic/angular.json`

Ajout du projet `events` dans la section `"projects"` avec la configuration `ng-packagr` pointant vers `projects/events/ng-package.json`.

### 6.3 — `dev/user-frontend-ionic/src/environments/environment.ts`

```typescript
// Import ajouté
import { EventsModule } from '@multi/events';

// Dans enabledModules
EventsModule,
```

### 6.4 — `dev/user-frontend-ionic/package.json`

Ajout de `&& npm run module:build events` à la fin du script `module:build-all`.

### 6.5 — `package.json` (racine du projet)

Ajout d'un script pour démarrer le microservice :

```json
"back:events": "cd dev/user-backend-nest/microservices/events && "
```

Usage : `npm run back:events -- npm run start:dev`

---

## PARTIE 7 — Visibilité du service dans l'app (CMS)

Le service "Événements" doit être créé dans **WordPress** (CMS headless) pour apparaître dans la rubrique Services de l'application. Le connecteur `multi-cms-connector` (port 4000) expose les services via une API GraphQL avec un **cache mémoire de 24h** (`CACHE_TTL_FEATURES=86400000`).

Pour que le service apparaisse immédiatement après l'ajout dans WordPress :
- Redémarrer le connecteur `multi-cms-connector`, **ou**
- Définir `CACHE_ENABLED=false` dans son `.env`

---

## Commandes utiles

### Installation des dépendances du microservice

```bash
cd dev/user-backend-nest/microservices/events
npm install
```

### Démarrer le microservice en mode watch

```bash
npm run back:events -- npm run start:dev
```

### Compiler la librairie frontend

```bash
cd dev/user-frontend-ionic
npx ng build events
```

### Démarrer l'app frontend

```bash
cd dev/user-frontend-ionic
npm run start
# ou ionic serve
```

### Tester les endpoints

```bash
# Liste des événements (public)
curl http://localhost:3000/events

# Likes d'un utilisateur (requiert authToken)
curl -X POST http://localhost:3000/event/user-likes \
  -H "Content-Type: application/json" \
  -d '{"authToken":"<token>"}'

# Liker un événement
curl -X POST http://localhost:3000/event/like \
  -H "Content-Type: application/json" \
  -d '{"authToken":"<token>","eventId":"1"}'
```

---

## Infrastructure MongoDB

Le MongoDB utilisé est le container Docker défini dans `env/local/docker/auth/docker-compose.yml` :

| Paramètre | Valeur |
|---|---|
| Image | `mongo:6.0` |
| Port | `27017` |
| Root user | `root` / `example` |
| User applicatif | `multi` / `multi`` (accès limité à `multi2023`) |
| Admin UI | `mongo-express` sur le port `8081` (login: `mexpress`/`mexpress`) |

Le microservice events utilise le user **root** avec `authSource=admin` car la base `events` est nouvelle et l'utilisateur `multi` n'y a pas accès.

Pour un environnement de production, créer un utilisateur dédié :

```js
// Dans mongosh, connecté en root
use events
db.createUser({ user: "events", pwd: "<mot-de-passe>", roles: [{ role: "readWrite", db: "events" }] })
```

Puis mettre à jour `EVENTS_SERVICE_MONGODB_URI` dans le `.env`.
