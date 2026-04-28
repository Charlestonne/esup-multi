import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { EventsTabService } from '../../events-tab.service';

@Component({
  selector: 'app-events-calendar',
  templateUrl: './events-calendar.page.html',
  styleUrls: ['./events-calendar.page.scss'],
})
export class EventsCalendarPage {
  public activeTab$: Observable<'feed' | 'calendar'>;

  constructor(
    private router: Router,
    private eventsTabService: EventsTabService,
  ) {
    this.activeTab$ = this.eventsTabService.getActiveTab();
  }

  onSegmentChange(event: any) {
    const value = event.detail.value;
    if (value === 'feed') {
      this.router.navigate(['/events/feed']);
    } else if (value === 'calendar') {
      this.router.navigate(['/events/calendar']);
    }
  }
}
