import { Component, Input } from '@angular/core';
import { Event } from '../../models/event.model';
import { RouterModule } from '@angular/router';
import { CalendarService } from '../../services/calendar.service';

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
})
export class EventCardComponent {
  @Input() event: Event;

  constructor(private calendarService: CalendarService) {}

  getCategoryStyle(type?: string): { [key: string]: string } {
    if (!type) {
      return { color: '#9ca3af', background: '#f3f4f6', borderColor: '#e5e7eb' };
    }
    const color = this.calendarService.getEventColor(type);
    return { color, background: color + '1a', borderColor: color + '4d' };
  }
}
