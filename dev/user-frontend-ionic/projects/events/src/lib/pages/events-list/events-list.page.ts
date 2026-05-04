import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { NetworkService } from '@multi/shared';
import { Observable, Subscription } from 'rxjs';
import { debounceTime, finalize, switchMap, take } from 'rxjs/operators';
import { Event } from '../../models/event.model';
import {
  defaultEventsFilter,
  EventsFilter,
  EventsSortOrder,
} from '../../models/events-filter.model';
import { events$ } from '../../events.repository';
import {
  eventsFilter$,
  getEventsFilterSnapshot,
  resetEventsFilter,
  setEventsFilter,
} from '../../events-filter.repository';
import { EventsService } from '../../events.service';
import { EventsTabService } from '../../events-tab.service';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.page.html',
  styleUrls: ['./events-list.page.scss'],
})
export class EventsListPage implements OnInit, OnDestroy {
  public events$: Observable<Event[]> = events$;
  public filter$: Observable<EventsFilter> = eventsFilter$;
  public defaultFilter: EventsFilter = defaultEventsFilter;
  public availableAssociations: string[] = [];
  public availableTypes: string[] = [];
  public isLoading = false;
  public isFilterOpen = false;
  public isSortOpen = false;

  private subscriptions: Subscription[] = [];
  public activeTab$: Observable<'feed' | 'calendar'>;
  public urlBeforeEvents = '/';

  constructor(
    private eventsService: EventsService,
    private networkService: NetworkService,
    private navController: NavController,
    private eventsTabService: EventsTabService,
    private translate: TranslateService,
  ) {
    this.activeTab$ = this.eventsTabService.getActiveTab();
  }

  ionViewWillEnter() {
    this.urlBeforeEvents = this.eventsTabService.getUrlBeforeEvents();
  }

  async ngOnInit(): Promise<void> {
    if (!(await this.networkService.getConnectionStatus()).connected) {
      return;
    }

    this.subscriptions.push(
      this.eventsService.fetchAvailableFacets().pipe(take(1)).subscribe((facets) => {
        this.availableAssociations = facets.associations;
        this.availableTypes = facets.types;
      }),
    );

    this.subscriptions.push(
      this.filter$
        .pipe(
          debounceTime(200),
          switchMap((filter) => {
            this.isLoading = true;
            return this.eventsService
              .loadAndStoreEvents(filter)
              .pipe(finalize(() => (this.isLoading = false)));
          }),
        )
        .subscribe(),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  removeAssociation(name: string): void {
    const current = getEventsFilterSnapshot();
    setEventsFilter({ associations: current.associations.filter((a) => a !== name) });
  }

  removeType(name: string): void {
    const current = getEventsFilterSnapshot();
    setEventsFilter({ types: current.types.filter((t) => t !== name) });
  }

  resetPeriod(): void {
    setEventsFilter({ period: 'all' });
  }

  resetDateRange(): void {
    setEventsFilter({ from: undefined, to: undefined });
  }

  clearAllFilters(): void {
    setEventsFilter({
      period: 'all',
      associations: [],
      types: [],
      from: undefined,
      to: undefined,
    });
  }

  getActiveFilterCount(filter: EventsFilter): number {
    let count = 0;
    if (filter.period !== 'all') {
      count += 1;
    }
    count += filter.associations?.length ?? 0;
    count += filter.types?.length ?? 0;
    if (filter.from || filter.to) {
      count += 1;
    }
    return count;
  }

  formatDateRange(from?: string, to?: string): string {
    const locale = this.translate.currentLang || this.translate.defaultLang || 'fr';
    const fmt = new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short' });
    const fromLabel = from ? fmt.format(new Date(from)) : '';
    const toLabel = to ? fmt.format(new Date(to)) : '';
    if (from && to) {
      return this.translate.instant('EVENTS.FILTERS.DATE_RANGE_VALUE', { from: fromLabel, to: toLabel });
    }
    if (from) {
      return this.translate.instant('EVENTS.FILTERS.DATE_FROM_ONLY', { from: fromLabel });
    }
    if (to) {
      return this.translate.instant('EVENTS.FILTERS.DATE_TO_ONLY', { to: toLabel });
    }
    return '';
  }

  openFilterModal(): void {
    this.isFilterOpen = true;
  }

  closeFilterModal(): void {
    this.isFilterOpen = false;
  }

  onFilterApply(filter: EventsFilter): void {
    setEventsFilter(filter);
    this.closeFilterModal();
  }

  onFilterReset(): void {
    resetEventsFilter();
    this.closeFilterModal();
  }

  onSegmentChange(event: any) {
    const value = event.detail.value;
    if (value === 'calendar') {
      this.navController.navigateRoot('/events/calendar', { animated: false });
    } else if (value === 'feed') {
      this.navController.navigateRoot('/events/feed', { animated: false });
    }
  }

  openSortModal(): void {
    this.isSortOpen = true;
  }

  closeSortModal(): void {
    this.isSortOpen = false;
  }

  onSortApply(sortOrder: EventsSortOrder): void {
    setEventsFilter({ sortOrder });
    this.closeSortModal();
  }
}
