import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EventWithUserLike } from '../../models/event.model';

@Component({
  selector: 'app-event-card',
  templateUrl: './event-card.component.html',
  styleUrls: ['./event-card.component.scss'],
})
export class EventCardComponent {
  @Input() event: EventWithUserLike;
  @Output() likeToggled = new EventEmitter<string>();
  @Output() cardClicked = new EventEmitter<string>();

  onLikeClick(event: MouseEvent) {
    event.stopPropagation();
    this.likeToggled.emit(this.event.id);
  }

  onCardClick() {
    this.cardClicked.emit(this.event.id);
  }
}
