import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { Observable, Subscription } from 'rxjs';
import { take } from 'rxjs/operators';
import { NetworkService } from '@multi/shared';
import { EventsTabService } from '../../events-tab.service';
import { EventsService } from '../../events.service';
import { CalendarDay, CalendarEvent, CalendarHour, CalendarService } from '../../services/calendar.service';

@Component({
  selector: 'app-events-calendar',
  templateUrl: './events-calendar.page.html',
  styleUrls: ['./events-calendar.page.scss'],
})
export class EventsCalendarPage implements OnInit, OnDestroy {
  public activeTab$: Observable<'feed' | 'calendar'>;
  public currentWeekDays: CalendarDay[] = [];
  public hours: CalendarHour[] = [];
  public weekLabel = '';
  public selectedDay: CalendarDay | null = null;
  public selectedDayEvents$: Observable<CalendarEvent[]> | null = null;
  public weekDayEvents$: Observable<CalendarEvent[]>[] = [];
  public viewMode: 'day' | 'week' = (localStorage.getItem('events-calendar-view') as 'day' | 'week') ?? 'day';
  public urlBeforeEvents = '/';
  public readonly dayAbbr = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  private weekSub: Subscription | null = null;

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
        this.calendarService.getEventsForDay(day.date),
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
    this.selectedDayEvents$ = this.calendarService.getEventsForDay(day.date);
  }

  isSelected(day: CalendarDay): boolean {
    return this.selectedDay?.date.toDateString() === day.date.toDateString();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'day' ? 'week' : 'day';
    localStorage.setItem('events-calendar-view', this.viewMode);
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

  private buildWeekLabel(startDate: Date): string {
    const end = new Date(startDate);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
      d.toLocaleDateString('fr-FR', opts);
    return `${fmt(startDate, { day: 'numeric', month: 'short' })} – ${fmt(end, { day: 'numeric', month: 'short', year: 'numeric' })}`;
  }
}
