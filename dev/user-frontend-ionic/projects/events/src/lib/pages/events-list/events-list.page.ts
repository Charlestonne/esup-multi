import { Component, OnInit } from '@angular/core';
import { NetworkService } from '@multi/shared';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';
import { Event } from '../../models/event.model';
import { events$ } from '../../events.repository';
import { EventsService } from '../../events.service';

@Component({
  selector: 'app-events-list',
  templateUrl: './events-list.page.html',
  styleUrls: ['./events-list.page.scss'],
})
export class EventsListPage implements OnInit {
  public events$: Observable<Event[]> = events$;
  public isLoading = false;

  constructor(
    private eventsService: EventsService,
    private networkService: NetworkService,
  ) {}

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
}
