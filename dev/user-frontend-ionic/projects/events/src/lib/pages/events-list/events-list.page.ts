import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
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
  public urlBeforeEvents = '/';

  constructor(
    private eventsService: EventsService,
    private networkService: NetworkService,
    private navController: NavController,
    private eventsTabService: EventsTabService,
  ) {
    this.activeTab$ = this.eventsTabService.getActiveTab();
  }

  ionViewWillEnter() {
    this.urlBeforeEvents = this.eventsTabService.getUrlBeforeEvents();
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
      this.navController.navigateRoot('/events/calendar', { animated: false });
    } else if (value === 'feed') {
      this.navController.navigateRoot('/events/feed', { animated: false });
    }
  }
}
