import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { defaultEventsFilter, EventsFilter, EventsPeriodFilter } from '../../models/events-filter.model';

@Component({
  selector: 'app-events-filter-modal',
  templateUrl: './events-filter-modal.component.html',
  styleUrls: ['./events-filter-modal.component.scss'],
})
export class EventsFilterModalComponent implements OnChanges, OnDestroy {
  @Input() availableAssociations: string[] = [];
  @Input() availableTypes: string[] = [];
  @Input() isLoading = false;
  @Input() currentFilter: EventsFilter = defaultEventsFilter;

  @Output() apply = new EventEmitter<EventsFilter>();
  @Output() reset = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  form: FormGroup;
  periodOptions: { value: EventsPeriodFilter; labelKey: string }[] = [
    { value: 'upcoming', labelKey: 'EVENTS.FILTERS.PERIOD.UPCOMING' },
    { value: 'past', labelKey: 'EVENTS.FILTERS.PERIOD.PAST' },
    { value: 'all', labelKey: 'EVENTS.FILTERS.PERIOD.ALL' },
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      period: this.fb.control<EventsPeriodFilter>('upcoming'),
      associations: this.fb.control<string[]>([]),
      types: this.fb.control<string[]>([]),
      from: this.fb.control<string | null>(null),
      to: this.fb.control<string | null>(null),
    });
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.syncFormWithCurrentFilter();
  }

  ngOnDestroy(): void {
    this.apply.emit(this.getCurrentValue());
  }

  get selectedTypes(): string[] {
    return (this.form.get('types')?.value as string[]) ?? [];
  }

  get selectedAssociations(): string[] {
    return (this.form.get('associations')?.value as string[]) ?? [];
  }

  getCurrentValue(): EventsFilter {
    return {
      ...this.currentFilter,
      period: (this.form.get('period')?.value as EventsPeriodFilter) ?? this.currentFilter.period,
      associations: this.selectedAssociations,
      types: this.selectedTypes,
      from: this.form.get('from')?.value || undefined,
      to: this.form.get('to')?.value || undefined,
    };
  }

  onApply(): void {
    this.apply.emit(this.getCurrentValue());
  }

  onReset(): void {
    this.form.get('period')?.setValue(defaultEventsFilter.period);
    this.form.get('associations')?.setValue([]);
    this.form.get('types')?.setValue([]);
    this.form.get('from')?.setValue(null);
    this.form.get('to')?.setValue(null);
    this.reset.emit();
  }

  onDismiss(): void {
    this.dismiss.emit();
  }

  setPeriod(period: EventsPeriodFilter): void {
    this.form.get('period')?.setValue(period);
  }

  isPeriodSelected(period: EventsPeriodFilter): boolean {
    return this.form.get('period')?.value === period;
  }

  onTypesChange(types: string[]): void {
    this.form.get('types')?.setValue(this.intersectWithAvailable(types, this.availableTypes));
  }

  onAssociationsChange(associations: string[]): void {
    this.form
      .get('associations')
      ?.setValue(this.intersectWithAvailable(associations, this.availableAssociations));
  }

  private syncFormWithCurrentFilter(): void {
    this.form.get('period')?.setValue(this.currentFilter.period ?? 'upcoming', { emitEvent: false });
    this.form
      .get('associations')
      ?.setValue(this.intersectWithAvailable(this.currentFilter.associations ?? [], this.availableAssociations), {
        emitEvent: false,
      });
    this.form
      .get('types')
      ?.setValue(this.intersectWithAvailable(this.currentFilter.types ?? [], this.availableTypes), {
        emitEvent: false,
      });
    this.form.get('from')?.setValue(this.currentFilter.from ?? null, { emitEvent: false });
    this.form.get('to')?.setValue(this.currentFilter.to ?? null, { emitEvent: false });
  }

  private intersectWithAvailable(selected: string[], available: string[]): string[] {
    if (available.length === 0) {
      return selected;
    }
    const set = new Set(available);
    return selected.filter((s) => set.has(s));
  }
}
