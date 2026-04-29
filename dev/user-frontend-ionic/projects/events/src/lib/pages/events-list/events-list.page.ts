import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NetworkService } from '@multi/shared';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Event } from '../../models/event.model';
import { events$ } from '../../events.repository';
import { EventsService } from '../../events.service';
import { EventsTabService } from '../../events-tab.service';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.page.html',
  styleUrls: ['./events-list.page.scss'],
})
export class EventsListPage implements OnInit {
  public events$: Observable<Event[]> = events$;
  public isLoading = false;
  public activeTab$: Observable<'feed' | 'calendar'>;

  constructor(
    private eventsService: EventsService,
    private networkService: NetworkService,
    private router: Router,
    private eventsTabService: EventsTabService,
  ) {
    this.activeTab$ = this.eventsTabService.getActiveTab();
  }

  async ngOnInit() {
    if (!(await this.networkService.getConnectionStatus()).connected) {
      return;
    }
    this.isLoading = true;
    this.eventsService
      .loadAndStoreEvents()
      .pipe(take(1))
      .subscribe(() => {
        this.isLoading = false;
      });
  }

  onSegmentChange(event: any) {
    const value = event.detail.value;
    if (value === 'calendar') {
      this.router.navigate(['/events/calendar'], { replaceUrl: true });
    } else if (value === 'feed') {
      this.router.navigate(['/events/feed'], { replaceUrl: true });
    }
  }
}
