import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ActionSheetController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { NetworkService } from '@multi/shared';
import { combineLatest, Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import {
  EventFilters,
  EventSortOption,
  EventWithUserLike,
} from '../../models/event.model';
import { events$, userLikedEventIds$ } from '../../events.repository';
import { EventsService } from '../../events.service';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.page.html',
  styleUrls: ['./events-list.page.scss'],
})
export class EventsListPage implements OnInit {
  public filteredEvents$: Observable<EventWithUserLike[]>;
  public isLoading = false;
  public sortOption: EventSortOption = 'date';
  public filters: EventFilters = {};

  public availableAssociations: string[] = [];
  public availableTypes: string[] = [];
  public availableLocations: string[] = [];

  constructor(
    private eventsService: EventsService,
    private router: Router,
    private networkService: NetworkService,
    private actionSheetController: ActionSheetController,
    private translate: TranslateService,
  ) {}

  async ngOnInit() {
    if (!(await this.networkService.getConnectionStatus()).connected) {
      return;
    }
    this.isLoading = true;
    this.eventsService
      .loadAndStoreEvents()
      .pipe(take(1))
      .subscribe((events) => {
        this.availableAssociations = [
          ...new Set(events.map((e) => e.association).filter(Boolean)),
        ];
        this.availableTypes = [
          ...new Set(events.map((e) => e.type).filter(Boolean)),
        ];
        this.availableLocations = [
          ...new Set(events.map((e) => e.location).filter(Boolean)),
        ];
        this.isLoading = false;
      });

    this.eventsService.loadAndStoreUserLikes().pipe(take(1)).subscribe();
    this.buildFilteredEvents();
  }

  buildFilteredEvents() {
    this.filteredEvents$ = combineLatest([events$, userLikedEventIds$]).pipe(
      map(([events, likedIds]) => {
        const enriched: EventWithUserLike[] = events.map((e) => ({
          ...e,
          isLikedByUser: likedIds.includes(e.id),
        }));

        const filtered = enriched.filter((e) => {
          if (this.filters.association && e.association !== this.filters.association) {
            return false;
          }
          if (this.filters.type && e.type !== this.filters.type) {
            return false;
          }
          if (this.filters.location && e.location !== this.filters.location) {
            return false;
          }
          return true;
        });

        if (this.sortOption === 'date') {
          return filtered.sort(
            (a, b) =>
              new Date(a.startDate).getTime() - new Date(b.startDate).getTime(),
          );
        } else {
          return filtered.sort((a, b) => b.likesCount - a.likesCount);
        }
      }),
    );
  }

  onSortChange(event: CustomEvent) {
    this.sortOption = event.detail.value;
    this.buildFilteredEvents();
  }

  async openFilterSheet(filterType: 'association' | 'type' | 'location') {
    const options =
      filterType === 'association'
        ? this.availableAssociations
        : filterType === 'type'
          ? this.availableTypes
          : this.availableLocations;

    const buttons = options.map((opt) => ({
      text: opt,
      handler: () => {
        this.filters = { ...this.filters, [filterType]: opt };
        this.buildFilteredEvents();
      },
    }));

    const clearLabel = await this.translate
      .get('EVENTS.FILTER.CLEAR')
      .toPromise();
    buttons.push({
      text: clearLabel,
      handler: () => {
        this.filters = { ...this.filters, [filterType]: undefined };
        this.buildFilteredEvents();
      },
    });

    const sheet = await this.actionSheetController.create({ buttons });
    await sheet.present();
  }

  clearAllFilters() {
    this.filters = {};
    this.buildFilteredEvents();
  }

  get hasActiveFilters(): boolean {
    return !!(
      this.filters.association ||
      this.filters.type ||
      this.filters.location
    );
  }

  toggleLike(event: EventWithUserLike) {
    if (event.isLikedByUser) {
      this.eventsService.unlikeEvent(event.id).pipe(take(1)).subscribe();
    } else {
      this.eventsService.likeEvent(event.id).pipe(take(1)).subscribe();
    }
  }

  navigateToDetail(eventId: string) {
    this.router.navigate(['events', eventId]);
  }

  navigateToMap() {
    this.router.navigate(['events', 'map']);
  }
}
