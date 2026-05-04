import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { IonPopover, NavController } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { NetworkService } from '@multi/shared';
import { EventsTabService } from '../../events-tab.service';
import { EventsService } from '../../events.service';
import { CalendarDay, CalendarEvent, CalendarHour, CalendarService } from '../../services/calendar.service';

export type ViewMode = 'day' | 'week' | '5days';
export type CalendarEventWithLayout = CalendarEvent & { left: string; width: string; zIndex: number };

@Component({
  selector: 'app-events-calendar',
  templateUrl: './events-calendar.page.html',
  styleUrls: ['./events-calendar.page.scss'],
})
export class EventsCalendarPage implements OnInit, OnDestroy {
  @ViewChild('viewPopover') viewPopover: IonPopover;

  public activeTab$: Observable<'feed' | 'calendar'>;
  public currentWeekDays: CalendarDay[] = [];
  public hours: CalendarHour[] = [];
  public weekLabel = '';
  public selectedDay: CalendarDay | null = null;
  public selectedDayEvents$: Observable<CalendarEventWithLayout[]> | null = null;
  public weekDayEvents$: Observable<CalendarEventWithLayout[]>[] = [];
  public viewMode: ViewMode = (localStorage.getItem('events-calendar-view') as ViewMode) ?? 'day';
  public urlBeforeEvents = '/';
  public readonly dayAbbr = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  private weekSub: Subscription | null = null;

  readonly viewModeOptions: { value: ViewMode; label: string; icon: string }[] = [
    { value: 'day',   label: 'Jour',    icon: 'today-outline'    },
    { value: '5days', label: '5 jours', icon: 'calendar-outline' },
    { value: 'week',  label: 'Semaine', icon: 'grid-outline'     },
  ];

  get viewModeLabel(): string {
    return this.viewModeOptions.find(o => o.value === this.viewMode)?.label ?? '';
  }

  /** Days shown in week/5days column headers and grid (5 for Mon–Fri, 7 for full week). */
  get displayedDays(): CalendarDay[] {
    return this.viewMode === '5days' ? this.currentWeekDays.slice(0, 5) : this.currentWeekDays;
  }

  /** Events observables for displayed day columns. */
  get displayedDayEvents$(): Observable<CalendarEventWithLayout[]>[] {
    return this.viewMode === '5days' ? this.weekDayEvents$.slice(0, 5) : this.weekDayEvents$;
  }

  constructor(
    private navController: NavController,
    private eventsTabService: EventsTabService,
    private calendarService: CalendarService,
    private eventsService: EventsService,
    private networkService: NetworkService,
  ) {
    this.activeTab$ = this.eventsTabService.getActiveTab();
    this.hours = this.calendarService.getDayHours();
  }

  ionViewWillEnter() {
    this.urlBeforeEvents = this.eventsTabService.getUrlBeforeEvents();
  }

  async ngOnInit() {
    if ((await this.networkService.getConnectionStatus()).connected) {
      this.eventsService.loadAndStoreEvents().pipe(take(1)).subscribe();
    }
    this.weekSub = this.calendarService.getCurrentWeekStartDate$().subscribe(startDate => {
      this.currentWeekDays = this.calendarService.getCurrentWeek(startDate);
      this.weekLabel = this.buildWeekLabel(startDate);
      this.weekDayEvents$ = this.currentWeekDays.map(day =>
        this.calendarService.getEventsForDay(day.date).pipe(
          map(evs => this.applyOverlapLayout(evs)),
        ),
      );
      const today = this.currentWeekDays.find(d => d.isToday) ?? this.currentWeekDays[0];
      this.selectDay(today);
    });
  }

  ngOnDestroy() {
    this.weekSub?.unsubscribe();
  }

  selectDay(day: CalendarDay): void {
    this.selectedDay = day;
    this.selectedDayEvents$ = this.calendarService.getEventsForDay(day.date).pipe(
      map(evs => this.applyOverlapLayout(evs)),
    );
  }

  isSelected(day: CalendarDay): boolean {
    return this.selectedDay?.date.toDateString() === day.date.toDateString();
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode = mode;
    localStorage.setItem('events-calendar-view', mode);
    this.viewPopover?.dismiss();
  }

  getEventStyle(event: CalendarEvent): { top: string; height: string } {
    return this.calendarService.getEventStyle(event);
  }

  navigateToEvent(eventId: string): void {
    this.navController.navigateForward(['/events', eventId]);
  }

  goToPrevWeek(): void { this.calendarService.goToPreviousWeek(); }
  goToNextWeek(): void { this.calendarService.goToNextWeek(); }
  goToToday(): void { this.calendarService.goToCurrentWeek(); }

  onSegmentChange(event: any): void {
    const value = event.detail.value;
    if (value === 'feed') this.navController.navigateRoot('/events/feed', { animated: false });
    else if (value === 'calendar') this.navController.navigateRoot('/events/calendar', { animated: false });
  }

  /**
   * Sequential greedy placement — processes events in start-time order.
   *
   * For each event E, inspect the already-placed events that overlap with it:
   *
   *   • No prior overlap          → full width (base)
   *   • All prior are full width  → RIGHT 50%  (overlaps a base event)
   *   • Any prior is NOT full     → LEFT  50%  (overlaps an already-split event)
   *   • Same-start peers present
   *     OR ≥4 concurrent          → equal columns (100%/N each)
   *
   * This ensures "right" is only used when the event underneath spans the whole
   * column, and "left" is used when the right side is already occupied.
   */
  private applyOverlapLayout(events: CalendarEvent[]): CalendarEventWithLayout[] {
    if (!events.length) return [];

    // Sort: earlier start first; ties → longer event first (becomes the base)
    const sorted = [...events].sort((a, b) => {
      const d = a.startTime.getTime() - b.startTime.getTime();
      return d !== 0 ? d : b.endTime.getTime() - a.endTime.getTime();
    });

    type Entry = CalendarEventWithLayout & { isFullWidth: boolean };
    const placed = new Map<string, Entry>();

    for (const ev of sorted) {
      if (placed.has(ev.id)) continue; // already placed as part of a same-start group

      // Already-placed events that overlap with ev
      const priorOverlap = sorted.filter(o =>
        placed.has(o.id) &&
        o.startTime < ev.endTime && o.endTime > ev.startTime,
      );

      // Not-yet-placed events starting at exactly the same time as ev
      const sameTimePeers = sorted.filter(o =>
        !placed.has(o.id) && o !== ev &&
        o.startTime.getTime() === ev.startTime.getTime() &&
        o.endTime > ev.startTime,
      );

      const totalConcurrent = priorOverlap.length + sameTimePeers.length + 1;

      // ── Equal columns: same-start group or ≥4 concurrent ──────────────────
      if (sameTimePeers.length > 0 || totalConcurrent >= 4) {
        // Place ev + all same-time peers together, sorted longer-first within group
        const group = [ev, ...sameTimePeers].sort(
          (a, b) => b.endTime.getTime() - a.endTime.getTime(),
        );
        group.forEach((e, i) => {
          const pos = priorOverlap.length + i;
          const pct = 100 / totalConcurrent;
          placed.set(e.id, {
            ...e,
            left:        `calc(${pos * pct}% + 2px)`,
            width:       `calc(${pct}% - 4px)`,
            zIndex:      pos + 1,
            isFullWidth: false,
          });
        });
        continue;
      }

      // ── No prior overlap → full-width base ────────────────────────────────
      if (priorOverlap.length === 0) {
        placed.set(ev.id, {
          ...ev, left: '2px', width: 'calc(100% - 4px)', zIndex: 1, isFullWidth: true,
        });
        continue;
      }

      // ── Has prior: RIGHT only if ALL prior events are full width ──────────
      const allPriorFull = priorOverlap.every(o => placed.get(o.id)!.isFullWidth);
      const zIndex = priorOverlap.length + 1;

      if (allPriorFull) {
        placed.set(ev.id, {
          ...ev, left: 'calc(50%)', width: 'calc(50% - 4px)', zIndex, isFullWidth: false,
        });
      } else {
        placed.set(ev.id, {
          ...ev, left: '2px', width: 'calc(50% - 4px)', zIndex, isFullWidth: false,
        });
      }
    }

    return events.map(ev => {
      const p = placed.get(ev.id)!;
      return { ...ev, left: p.left, width: p.width, zIndex: p.zIndex };
    });
  }

  private buildWeekLabel(startDate: Date): string {
    const end = new Date(startDate);
    end.setDate(end.getDate() + (this.viewMode === '5days' ? 4 : 6));
    const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) => d.toLocaleDateString('fr-FR', opts);
    return `${fmt(startDate, { day: 'numeric', month: 'short' })} – ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
}
