# Modifier le service "Événements" — Guide de référence

---

## Structure des fichiers clés

```
BACKEND
dev/user-backend-nest/microservices/events/src/
├── .env                              ← Variables d'environnement (URL API, MongoDB, cache)
├── config/
│   ├── configuration.ts              ← Mapping env vars → objet de config
│   └── configuration.interfaces.ts   ← Types TypeScript de la config
├── events/
│   ├── events.dto.ts                 ← Contrats de données (interfaces)
│   ├── events.service.ts             ← Appel API externe + enrichissement likes
│   ├── events.controller.ts          ← Message patterns NATS
│   └── events.module.ts              ← Assemblage du module
└── likes/
    ├── likes.schema.ts               ← Schéma MongoDB
    ├── likes.repository.ts           ← Requêtes MongoDB
    └── likes.module.ts               ← Module NestJS

GATEWAY
dev/user-backend-nest/main/src/
├── app.controller.ts                 ← Routes HTTP exposées au frontend
└── config/microservice-events.config.ts  ← Config NATS du client events

FRONTEND
dev/user-frontend-ionic/projects/events/src/lib/
├── models/event.model.ts             ← Interfaces TypeScript
├── events.repository.ts              ← État réactif (store elf)
├── events.service.ts                 ← Appels HTTP vers la gateway
├── events.module.ts                  ← Module Angular + enregistrement
├── events-routing.module.ts          ← Routes Angular
├── components/event-card/            ← Composant carte réutilisable
└── pages/
    ├── events-list/                  ← Page liste avec tri et filtres
    ├── event-detail/                 ← Page détail d'un événement
    └── events-map/                   ← Page carte des événements

I18N
dev/user-frontend-ionic/src/theme/app-theme/i18n/modules/events/
├── fr.json
└── en.json
```

---

## CAS 1 — Changer l'API externe des événements

### Fichiers à modifier

**1. `.env` du microservice**
```
EVENTS_SERVICE_PROVIDER_API_URL=https://nouvelle-url-api.fr/events
EVENTS_SERVICE_PROVIDER_API_BEARER_TOKEN=mon-token
```

**2. `src/events/events.dto.ts`** — si les champs retournés par la nouvelle API sont différents

Modifier `EventExternalApiDto` pour qu'elle corresponde aux champs réels de l'API :

```typescript
export interface EventExternalApiDto {
  // Adapter selon la réponse réelle de l'API
  id: string;
  titre: string;          // ex: l'API utilise "titre" au lieu de "title"
  // ...
}
```

**3. `src/events/events.service.ts`** — adapter le mapping dans `enrichWithLikeCounts()`

```typescript
return externalEvents.map(e => ({
  id: e.id,
  title: e.titre,    // ← adapter le nom du champ source
  // ...
  likesCount: likeCounts[e.id] || 0,
}));
```

### Rebuild nécessaire
```bash
# Redémarrer le microservice (le watch recharge automatiquement)
npm run back:events -- npm run start:dev
```

---

## CAS 2 — Ajouter un champ à un événement

Exemple : ajouter un champ `capacity` (nombre de places).

### Fichiers à modifier dans l'ordre

**1. `dev/user-backend-nest/microservices/events/src/events/events.dto.ts`**

```typescript
export interface EventExternalApiDto {
  // ... champs existants
  capacity?: number;   // ← ajouter ici
}

export interface EventDto {
  // ... champs existants
  capacity?: number;   // ← ajouter ici
}
```

**2. `src/events/events.service.ts`** — inclure le champ dans le mapping

```typescript
return externalEvents.map(e => ({
  // ... champs existants
  capacity: e.capacity,   // ← ajouter ici
  likesCount: likeCounts[e.id] || 0,
}));
```

**3. `dev/user-frontend-ionic/projects/events/src/lib/models/event.model.ts`**

```typescript
export interface Event {
  // ... champs existants
  capacity?: number;   // ← ajouter ici
}
```

**4. Templates HTML** — afficher le champ dans les pages concernées

- `pages/event-detail/event-detail.page.html` — pour la page détail
- `components/event-card/event-card.component.html` — pour la carte dans la liste

**5. i18n** si le champ a un label

```json
// fr.json
"CAPACITY": "Nombre de places"

// en.json
"CAPACITY": "Capacity"
```

### Rebuild nécessaire
```bash
# Côté frontend : recompiler la librairie
cd dev/user-frontend-ionic && npx ng build events
# Le serveur Ionic rechargera automatiquement
```

---

## CAS 3 — Modifier le tri ou les filtres

Tout se passe dans un seul fichier côté frontend.

**`pages/events-list/events-list.page.ts`** — méthode `buildFilteredEvents()`

```typescript
buildFilteredEvents() {
  this.filteredEvents$ = combineLatest([events$, userLikedEventIds$]).pipe(
    map(([events, likedIds]) => {
      const enriched = events.map(e => ({ ...e, isLikedByUser: likedIds.includes(e.id) }));

      // ← Modifier les conditions de filtre ici
      const filtered = enriched.filter(e => {
        if (this.filters.association && e.association !== this.filters.association) return false;
        if (this.filters.type && e.type !== this.filters.type) return false;
        if (this.filters.location && e.location !== this.filters.location) return false;
        return true;
      });

      // ← Modifier le tri ici
      if (this.sortOption === 'date') {
        return filtered.sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
      } else {
        return filtered.sort((a, b) => b.likesCount - a.likesCount);
      }
    })
  );
}
```

Pour ajouter un nouveau type de filtre :

1. Ajouter le champ dans `EventFilters` (`models/event.model.ts`)
2. Ajouter la condition dans `buildFilteredEvents()`
3. Ajouter `available<NouveauFiltre>: string[]` dans la page et le peupler dans `ngOnInit()`
4. Appeler `openFilterSheet('nouveauFiltre')` depuis le template

---

## CAS 4 — Modifier le comportement des likes

### Côté backend — `src/likes/likes.repository.ts`

Toute la logique de persistance est ici : `create`, `delete`, `exists`, `countByEventId`, `countByEventIds`, `findByUsername`.

### Côté backend — `src/events/events.controller.ts`

La logique de like/unlike (vérification doublon, invalidation cache) est dans `likeEvent()` et `unlikeEvent()`.

### Côté frontend — `events.repository.ts`

`addUserLike()` et `removeUserLike()` mettent à jour le store local (liste des IDs likés + compteur).

### Côté frontend — `events.service.ts`

`likeEvent()` et `unlikeEvent()` font l'appel HTTP. Modifier ici si le format de la requête change.

---

## CAS 5 — Modifier le cache des événements

**`.env` du microservice :**
```
EVENTS_SERVICE_CACHE_TTL_MS=300000   # Durée en ms (300000 = 5 minutes)
EVENTS_SERVICE_CACHE_MAX=200          # Nombre max d'entrées en cache
```

Pour **désactiver le cache** complètement :
```
EVENTS_SERVICE_CACHE_TTL_MS=0
```

Le cache est géré dans `src/events/events.controller.ts`, méthode `getEvents()`.
La clé de cache est `'events'`. Elle est invalidée à chaque like/unlike.

---

## CAS 6 — Ajouter une nouvelle page

Exemple : page "Mes événements likés".

**1. Créer les fichiers de la page**
```
pages/my-liked-events/
├── my-liked-events.page.ts
├── my-liked-events.page.html
└── my-liked-events.page.scss
```

**2. `events-routing.module.ts`** — ajouter la route

```typescript
{ path: 'events/liked', component: MyLikedEventsPage },
```

**3. `events.module.ts`** — déclarer le composant

```typescript
declarations: [
  EventsListPage,
  EventDetailPage,
  EventsMapPage,
  EventCardComponent,
  MyLikedEventsPage,   // ← ajouter
],
```

**4. i18n** — ajouter les clés nécessaires dans `fr.json` et `en.json`

---

## CAS 7 — Ajouter une route dans la gateway (nouvel endpoint)

**1. `dev/user-backend-nest/microservices/events/src/events/events.controller.ts`**

Ajouter un nouveau `@MessagePattern` :

```typescript
@MessagePattern({ cmd: 'events/featured' })
async getFeaturedEvents(): Promise<EventDto[]> {
  // logique
}
```

**2. `dev/user-backend-nest/main/src/app.controller.ts`**

Ajouter la route HTTP correspondante :

```typescript
@Get('/events/featured')
getFeaturedEvents() {
  return this.eventsClient.send({ cmd: 'events/featured' }, {});
}
```

**3. `dev/user-frontend-ionic/projects/events/src/lib/events.service.ts`**

Ajouter la méthode de service :

```typescript
public loadFeaturedEvents(): Observable<Event[]> {
  const url = `${this.multiTenantService.getApiEndpoint()}/events/featured`;
  return this.http.get<Event[]>(url);
}
```

---

## CAS 8 — Modifier le schéma MongoDB des likes

Si tu changes `likes.schema.ts` en ajoutant un champ :

**1. `src/likes/likes.schema.ts`** — ajouter la propriété

```typescript
@Prop({ default: false })
anonymous: boolean;
```

**2. `src/likes/likes.repository.ts`** — utiliser le champ dans les requêtes si besoin

**3. `src/events/events.dto.ts`** — si ce champ doit remonter dans la réponse API, adapter les DTOs

**Important :** Mongoose ne migre pas automatiquement les documents existants. Les anciens documents n'auront pas le nouveau champ (il sera `undefined`). Utiliser des valeurs par défaut (`@Prop({ default: ... })`) pour éviter les problèmes.

---

## Rebuild et redémarrage

| Modification | Action requise |
|---|---|
| Fichiers backend (`*.ts` dans microservices/events) | Automatique si `start:dev` (watch mode) |
| `.env` du microservice | Redémarrer le microservice |
| Fichiers frontend (`*.ts`, `*.html`, `*.scss`) | Automatique si `ionic serve` (hot reload) — **sauf** si c'est un fichier de la librairie compilée |
| Fichiers dans `projects/events/src/lib/` | `npx ng build events` puis le serveur ionic recharge |
| Fichiers i18n (`fr.json`, `en.json`) | Automatique (hot reload) |
| `environment.ts`, `angular.json`, `tsconfig.json` | Redémarrer `ionic serve` |
| `app.controller.ts` ou `app.module.ts` de la gateway | Automatique si gateway en `start:dev` |

### Commande de rebuild complet de la librairie frontend

```bash
cd dev/user-frontend-ionic && npx ng build events
```

---

## Variables d'environnement du microservice

Fichier : `dev/user-backend-nest/microservices/events/.env`

| Variable | Rôle | Valeur par défaut |
|---|---|---|
| `EVENTS_SERVICE_PORT` | Port HTTP du microservice | `3020` |
| `EVENTS_SERVICE_NATS_SERVERS` | Serveurs NATS | `nats://localhost:4222` |
| `EVENTS_SERVICE_PROVIDER_API_URL` | URL de l'API externe | — |
| `EVENTS_SERVICE_PROVIDER_API_BEARER_TOKEN` | Token Bearer pour l'API | — |
| `EVENTS_SERVICE_MONGODB_URI` | URI MongoDB | `mongodb://localhost:27017/events` |
| `EVENTS_SERVICE_CACHE_TTL_MS` | TTL du cache en ms | `300000` (5 min) |
| `EVENTS_SERVICE_CACHE_MAX` | Max entrées en cache | `200` |
