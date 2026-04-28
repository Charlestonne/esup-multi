import { Component, Input } from '@angular/core';
import { Event } from '../../models/event.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
})
export class EventCardComponent {
  @Input() event: Event;
}
