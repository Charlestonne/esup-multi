import { Component, EventEmitter, Input, Output } from '@angular/core';
import { EventsSortOrder } from '../../models/events-filter.model';

@Component({
  selector: 'app-events-sort-modal',
  templateUrl: './events-sort-modal.component.html',
  styleUrls: ['./events-sort-modal.component.scss'],
})
export class EventsSortModalComponent {
  @Input() currentSort: EventsSortOrder = 'asc';

  @Output() apply = new EventEmitter<EventsSortOrder>();
  @Output() dismiss = new EventEmitter<void>();

  onSelect(value: EventsSortOrder): void {
    this.apply.emit(value);
  }

  onDismiss(): void {
    this.dismiss.emit();
  }
}
