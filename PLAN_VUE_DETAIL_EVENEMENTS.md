# Plan d'implémentation : Vue Détail des Événements

## Contexte

Le module `events` dispose d'une page liste (`EventsListPage`) et d'un composant carte (`EventCardComponent`), mais aucune vue détail n'existe. Le mock possède déjà des champs `locationLat` / `locationLng`, mais ils ne sont pas exposés dans les DTOs ni dans le modèle frontend. Leaflet est déjà installé dans le projet (utilisé par le module `map`).

---

## Vue d'ensemble des changements

| Couche | Fichier | Type de changement |
|---|---|---|
| Mock server | `events.route.js` | Ajout route `GET /:id` |
| Backend DTO | `events.dto.ts` | Ajout `locationLat`, `locationLng` |
| Frontend model | `event.model.ts` | Ajout `locationLat`, `locationLng` |
| Frontend routing | `events-routing.module.ts` | Ajout route `/events/:id` |
| Frontend component | `event-card.component.html/.ts` | Ajout navigation au clic |
| Frontend page (NEW) | `event-detail.page.ts/.html/.scss` | Création complète |
| Frontend module | `events.module.ts` | Déclaration + imports Leaflet CSS |
| i18n | `fr.json` / `en.json` | Ajout clés de traduction |
| Styles | `app-theme/styles/events/` | Ajout SCSS pour la carte Leaflet |

---

## Étapes détaillées

### Étape 1 — Mock server : exposer `locationLat` / `locationLng` via `GET /:id`

**Fichier** : `dev/user-backend-mocks/src/events/events.route.js`

Ajouter un endpoint `GET /:id` qui retourne un événement unique par son `id`. Les données mock contiennent déjà `locationLat` et `locationLng` — il suffit d'exposer ce endpoint.

```js
router.get('/:id', (req, res) => {
  const event = eventsData.find(e => e.id === req.params.id);
  if (!event) return res.status(404).json({ message: 'Not found' });
  res.json(event);
});
```

---

### Étape 2 — Backend microservice : mettre à jour les DTOs

**Fichier** : `dev/user-backend-nest/microservices/events/src/events/events.dto.ts`

Ajouter les champs optionnels de coordonnées dans les deux interfaces :

```typescript
export interface EventExternalApiDto {
  // ...champs existants...
  locationLat?: number;
  locationLng?: number;
}

export interface EventDto {
  // ...champs existants...
  locationLat?: number;
  locationLng?: number;
}
```

---

### Étape 3 — Mettre à jour le modèle frontend

**Fichier** : `dev/user-frontend-ionic/projects/events/src/lib/models/event.model.ts`

```typescript
export interface Event {
  // ...champs existants...
  locationLat?: number;
  locationLng?: number;
}
```

---

### Étape 4 — Mettre à jour le routing

**Fichier** : `dev/user-frontend-ionic/projects/events/src/lib/events-routing.module.ts`

Ajouter une route enfant `/events/:id` :

```typescript
const routes: Routes = [
  {
    path: 'events',
    component: EventsListPage,
  },
  {
    path: 'events/:id',
    component: EventDetailPage,
  },
];
```

---

### Étape 5 — Rendre la carte événement cliquable

**Fichier** : `dev/user-frontend-ionic/projects/events/src/lib/components/event-card/event-card.component.html`

Envelopper `<ion-card>` avec un `routerLink` pointant vers `/events/:id` :

```html
<ion-card [routerLink]="['/events', event.id]">
  <!-- contenu existant inchangé -->
</ion-card>
```

**Fichier** : `dev/user-frontend-ionic/projects/events/src/lib/components/event-card/event-card.component.ts`

Ajouter `RouterModule` dans les imports du module (voir Étape 8) — aucun changement dans le composant lui-même.

---

### Étape 6 — Créer la page de détail

**Nouveaux fichiers** :
- `dev/user-frontend-ionic/projects/events/src/lib/pages/event-detail/event-detail.page.ts`
- `dev/user-frontend-ionic/projects/events/src/lib/pages/event-detail/event-detail.page.html`
- `dev/user-frontend-ionic/projects/events/src/lib/pages/event-detail/event-detail.page.scss`

#### 6a. Logique TypeScript (`event-detail.page.ts`)

```typescript
@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.page.html',
  styleUrls: ['./event-detail.page.scss'],
})
export class EventDetailPage implements OnDestroy {
  event: Event | undefined;
  isLoading = false;
  private map: Leaflet.Map | undefined;

  constructor(
    private route: ActivatedRoute,
    private eventsService: EventsService,
    private location: Location,
  ) {}

  async ionViewWillEnter() {
    const id = this.route.snapshot.paramMap.get('id');
    // Récupère l'événement depuis le store ELF (déjà chargé par la liste)
    // Si le store est vide (navigation directe), déclenche le chargement
    this.event = await firstValueFrom(selectEventById(id));
    if (!this.event) {
      this.isLoading = true;
      await this.eventsService.loadEvents().toPromise();
      this.event = await firstValueFrom(selectEventById(id));
      this.isLoading = false;
    }
    if (this.event?.locationLat && this.event?.locationLng) {
      await this.initMap(this.event.locationLat, this.event.locationLng);
    }
  }

  ionViewWillLeave() {
    this.map?.remove();
    this.map = undefined;
  }

  goBack() {
    this.location.back();
  }

  getContactLinks(): string[] {
    // Parse contactInfo pour séparer email(s) et téléphone(s)
    return this.event?.contactInfo?.split('|').map(s => s.trim()) ?? [];
  }

  isEmail(contact: string): boolean {
    return contact.includes('@');
  }

  private async initMap(lat: number, lng: number) {
    this.map = Leaflet.map('event-map', { center: [lat, lng], zoom: 15 });
    Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    const icon = Leaflet.icon({
      iconSize: [25, 41],
      iconAnchor: [13, 41],
      iconUrl: './assets/icons/leaflet/marker-icon.png',
      iconRetinaUrl: './assets/icons/leaflet/marker-icon-2x.png',
      shadowUrl: './assets/icons/leaflet/marker-shadow.png',
    });
    Leaflet.marker([lat, lng], { icon })
      .bindPopup(`<b>${this.event!.location}</b>`)
      .addTo(this.map)
      .openPopup();
  }
}
```

#### 6b. Template HTML (`event-detail.page.html`)

Structure de la page :
```html
<app-header></app-header>
<ion-content>
  <ion-progress-bar *ngIf="isLoading" type="indeterminate"></ion-progress-bar>

  <ng-container *ngIf="event">
    <!-- Image de couverture (si disponible) -->
    <ion-img *ngIf="event.imageUrl" [src]="event.imageUrl"></ion-img>

    <div class="event-detail-container ion-padding">

      <!-- Chips association / type -->
      <ion-chip *ngIf="event.association" color="primary" outline="true">
        <ion-label>{{ event.association }}</ion-label>
      </ion-chip>
      <ion-chip *ngIf="event.type" color="secondary" outline="true">
        <ion-label>{{ event.type }}</ion-label>
      </ion-chip>

      <!-- Titre -->
      <h1 class="app-title-4">{{ event.title }}</h1>

      <!-- Organisateur -->
      <ion-item lines="none">
        <ion-icon name="person-outline" slot="start"></ion-icon>
        <ion-label>
          <p class="label">{{ 'EVENTS.DETAIL.ORGANIZER' | translate }}</p>
          <p>{{ event.creator }}</p>
        </ion-label>
      </ion-item>

      <!-- Dates -->
      <ion-item lines="none">
        <ion-icon name="calendar-outline" slot="start"></ion-icon>
        <ion-label>
          <p class="label">{{ 'EVENTS.DETAIL.START_DATE' | translate }}</p>
          <p>{{ event.startDate | date:'dd/MM/yyyy HH:mm' }}</p>
          <ng-container *ngIf="event.endDate">
            <p class="label">{{ 'EVENTS.DETAIL.END_DATE' | translate }}</p>
            <p>{{ event.endDate | date:'dd/MM/yyyy HH:mm' }}</p>
          </ng-container>
        </ion-label>
      </ion-item>

      <!-- Lieu -->
      <ion-item lines="none">
        <ion-icon name="location-outline" slot="start"></ion-icon>
        <ion-label>
          <p class="label">{{ 'EVENTS.DETAIL.LOCATION' | translate }}</p>
          <p>{{ event.location }}</p>
        </ion-label>
      </ion-item>

      <!-- Description -->
      <div class="section">
        <h2 class="app-title-6">{{ 'EVENTS.DETAIL.DESCRIPTION' | translate }}</h2>
        <p class="app-text-4">{{ event.description }}</p>
      </div>

      <!-- Carte Leaflet (si coordonnées disponibles) -->
      <div class="section" *ngIf="event.locationLat && event.locationLng">
        <h2 class="app-title-6">{{ 'EVENTS.DETAIL.MAP' | translate }}</h2>
        <div id="event-map" class="event-map"></div>
      </div>

      <!-- Contact organisateur -->
      <div class="section" *ngIf="event.contactInfo">
        <h2 class="app-title-6">{{ 'EVENTS.DETAIL.CONTACT' | translate }}</h2>
        <ng-container *ngFor="let contact of getContactLinks()">
          <!-- Email → bouton mailto -->
          <ion-button
            *ngIf="isEmail(contact)"
            [href]="'mailto:' + contact"
            fill="outline"
            expand="block"
          >
            <ion-icon name="mail-outline" slot="start"></ion-icon>
            {{ contact }}
          </ion-button>
          <!-- Téléphone ou autre → texte simple -->
          <ion-item lines="none" *ngIf="!isEmail(contact)">
            <ion-icon name="call-outline" slot="start"></ion-icon>
            <ion-label>{{ contact }}</ion-label>
          </ion-item>
        </ng-container>
      </div>

    </div>
  </ng-container>
</ion-content>
```

#### 6c. Styles SCSS (`event-detail.page.scss`)

```scss
.event-map {
  height: 250px;
  width: 100%;
  border-radius: 8px;
  overflow: hidden;
}

.event-detail-container {
  .section {
    margin-top: 16px;
  }
  .label {
    font-size: 0.75rem;
    color: var(--ion-color-medium);
  }
}
```

---

### Étape 7 — Mettre à jour le repository ELF pour sélectionner par ID

**Fichier** : `dev/user-frontend-ionic/projects/events/src/lib/events.repository.ts`

Ajouter une fonction `selectEventById(id: string)` :

```typescript
export const selectEventById = (id: string) =>
  eventsStore.pipe(selectEntity(id));
```

---

### Étape 8 — Mettre à jour `EventsModule`

**Fichier** : `dev/user-frontend-ionic/projects/events/src/lib/events.module.ts`

- Déclarer `EventDetailPage`
- Importer `RouterModule` (pour `routerLink` dans `EventCardComponent`)

```typescript
import { RouterModule } from '@angular/router';
// ...
declarations: [EventsListPage, EventCardComponent, EventDetailPage],
imports: [CommonModule, IonicModule, RouterModule, EventsRoutingModule, TranslateModule, SharedComponentsModule],
```

**CSS Leaflet** : Vérifier que `leaflet/dist/leaflet.css` est importé dans `angular.json` (il l'est probablement déjà via le module `map`).

---

### Étape 9 — Mettre à jour les fichiers i18n

**Fichier** : `dev/user-frontend-ionic/src/theme/app-theme/i18n/modules/events/fr.json`

```json
{
  "EVENTS": {
    "TITLE": "Événements",
    "NO_DATA": "Aucun événement trouvé",
    "DETAIL": {
      "ORGANIZER": "Organisateur",
      "START_DATE": "Début",
      "END_DATE": "Fin",
      "LOCATION": "Lieu",
      "DESCRIPTION": "Description",
      "MAP": "Localisation",
      "CONTACT": "Contacter l'organisateur"
    }
  }
}
```

**Fichier** : `dev/user-frontend-ionic/src/theme/app-theme/i18n/modules/events/en.json`

```json
{
  "EVENTS": {
    "TITLE": "Events",
    "NO_DATA": "No events found",
    "DETAIL": {
      "ORGANIZER": "Organizer",
      "START_DATE": "Start",
      "END_DATE": "End",
      "LOCATION": "Location",
      "DESCRIPTION": "Description",
      "MAP": "Location map",
      "CONTACT": "Contact organizer"
    }
  }
}
```

---

## Ordre d'exécution recommandé

```
1. Étape 2  → events.dto.ts           (backend)
2. Étape 1  → events.route.js         (mock)
3. Étape 3  → event.model.ts          (frontend model)
4. Étape 7  → events.repository.ts    (store selector)
5. Étape 6  → event-detail.page.*     (nouvelle page)
6. Étape 4  → events-routing.module   (routing)
7. Étape 5  → event-card.component    (navigation)
8. Étape 8  → events.module.ts        (déclarations)
9. Étape 9  → fr.json / en.json       (i18n)
```

---

## Points d'attention

- **Carte sans coordonnées** : Si `locationLat`/`locationLng` sont absents, la section carte est masquée (`*ngIf`). L'adresse texte reste toujours visible.
- **Contact multi-format** : `contactInfo` peut contenir `email | téléphone`. La méthode `getContactLinks()` sépare par `|`. Les emails génèrent un bouton `mailto:`, le reste est affiché en texte.
- **Store vide (deep link)** : Si l'utilisateur navigue directement vers `/events/:id` sans avoir chargé la liste, `ionViewWillEnter` déclenche `EventsService.loadEvents()` avant d'afficher le détail.
- **Nettoyage Leaflet** : `ionViewWillLeave` appelle `map.remove()` pour éviter les fuites mémoire, exactement comme le module `map`.
- **CSS Leaflet** : Vérifier dans `angular.json` que `"node_modules/leaflet/dist/leaflet.css"` est dans `styles`. Si absent, l'ajouter.
- **`www/i18n`** : Les fichiers dans `www/` sont des artefacts de build. Ne les modifier que via les sources dans `src/theme/app-theme/i18n/`.
