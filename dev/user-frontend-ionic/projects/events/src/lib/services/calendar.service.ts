import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { events$ } from '../events.repository';
import { Event } from '../models/event.model';

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  color?: string;
  imageUrl?: string;
}

export interface CalendarDay {
  date: Date;
  dayName: string;
  dayNumber: number;
  isToday: boolean;
}

export interface CalendarHour {
  hour: number;
  timeString: string;
}

@Injectable({
  providedIn: 'root'
})
export class CalendarService {
  private currentWeekStartDate$ = new BehaviorSubject<Date>(this.getMonday(new Date()));

  constructor() {}

  /**
   * Get the current observable week start date
   */
  getCurrentWeekStartDate$(): Observable<Date> {
    return this.currentWeekStartDate$.asObservable();
  }

  /**
   * Navigate to next week
   */
  goToNextWeek(): void {
    const currentDate = this.currentWeekStartDate$.value;
    const nextMonday = new Date(currentDate);
    nextMonday.setDate(nextMonday.getDate() + 7);
    this.currentWeekStartDate$.next(nextMonday);
  }

  /**
   * Navigate to previous week
   */
  goToPreviousWeek(): void {
    const currentDate = this.currentWeekStartDate$.value;
    const previousMonday = new Date(currentDate);
    previousMonday.setDate(previousMonday.getDate() - 7);
    this.currentWeekStartDate$.next(previousMonday);
  }

  /**
   * Reset to current week
   */
  goToCurrentWeek(): void {
    this.currentWeekStartDate$.next(this.getMonday(new Date()));
  }

  /**
   * Get Monday of a given date
   */
  private getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(d.setDate(diff));
  }

  /**
   * Get the current week's days
   */
  getCurrentWeek(startDate: Date = this.currentWeekStartDate$.value): CalendarDay[] {
    const days: CalendarDay[] = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const today = new Date();

    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);

      const isToday = this.isSameDay(date, today);

      days.push({
        date,
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        isToday
      });
    }

    return days;
  }

  /**
   * Get all hours of the day
   */
  getDayHours(): CalendarHour[] {
    const hours: CalendarHour[] = [];
    for (let i = 0; i < 24; i++) {
      const timeString = `${i.toString().padStart(2, '0')}:00`;
      hours.push({
        hour: i,
        timeString
      });
    }
    return hours;
  }

  /**
   * Get events for a specific day from the repository (avoiding duplicate API calls)
   */
  getEventsForDay(date: Date): Observable<CalendarEvent[]> {
    return events$.pipe(
      map((backendEvents: Event[]) => {
        // Filter events for the specific date
        return backendEvents
          .filter(event => this.isSameDay(new Date(event.startDate), date))
          .map(event => this.transformEventToCalendarEvent(event));
      })
    );
  }

  /**
   * Transform backend Event to CalendarEvent format
   */
  private transformEventToCalendarEvent(event: Event): CalendarEvent {
    return {
      id: event.id,
      title: event.title,
      description: event.description,
      startTime: new Date(event.startDate),
      endTime: new Date(event.endDate),
      color: this.getEventColor(event.type),
      imageUrl: event.imageUrl,
    };
  }

  getEventColor(eventType: string): string {
    if (!eventType) return '#f97316';
    const normalized = eventType.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    const colorMap: { [key: string]: string } = {
      'atelier':              '#22c55e',
      'spectacle':            '#ef4444',
      'soiree':               '#8b5cf6',
      'autre':                '#f97316',
      'recrutement':          '#6b7280',
      'sport':                '#3b82f6',
      'conference':           '#eab308',
      'concert':              '#ec4899',
      'exposition':           '#14b8a6',
      'concours':             '#f59e0b',
      'repas':                '#a3e635',
      'distribution/ventes':  '#94a3b8',
    };
    return colorMap[normalized] ?? '#f97316';
  }

  /**
   * Check if two dates are the same day
   */
  isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getDate() === date2.getDate() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getFullYear() === date2.getFullYear()
    );
  }

  /**
   * Calculate event position and height based on time
   */
  getEventStyle(event: CalendarEvent): { top: string; height: string } {
    const startMinutes = event.startTime.getHours() * 60 + event.startTime.getMinutes();
    const endMinutes = event.endTime.getHours() * 60 + event.endTime.getMinutes();
    const durationMinutes = endMinutes - startMinutes;

    // 60 pixels per hour = 1 pixel per minute
    const top = `${startMinutes}px`;
    const height = `${durationMinutes}px`;

    return { top, height };
  }
}
