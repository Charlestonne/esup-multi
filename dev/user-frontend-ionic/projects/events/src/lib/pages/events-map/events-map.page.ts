import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { Event } from '../../models/event.model';
import { events$ } from '../../events.repository';

@Component({
  selector: 'app-events-map',
  templateUrl: './events-map.page.html',
  styleUrls: ['./events-map.page.scss'],
})
export class EventsMapPage implements OnInit {
  public eventsWithCoords: Event[] = [];

  constructor(private router: Router) {}

  ngOnInit() {
    events$.pipe(take(1)).subscribe((events) => {
      this.eventsWithCoords = events.filter(
        (e) => e.locationLat != null && e.locationLng != null,
      );
    });
  }

  navigateToDetail(eventId: string) {
    this.router.navigate(['events', eventId]);
  }
}
