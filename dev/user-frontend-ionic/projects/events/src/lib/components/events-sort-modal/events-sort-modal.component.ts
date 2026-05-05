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

  readonly sortOptions: Array<{ value: EventsSortOrder; labelKey: string }> = [
    { value: 'asc', labelKey: 'EVENTS.SORT.ASC' },
    { value: 'desc', labelKey: 'EVENTS.SORT.DESC' },
  ];

  isSortSelected(value: EventsSortOrder): boolean {
    return this.currentSort === value;
  }

  onSelect(value: EventsSortOrder): void {
    this.apply.emit(value);
  }

  onDismiss(): void {
    this.dismiss.emit();
  }
}
