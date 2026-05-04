import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
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

  shimmerSlots = [0, 1, 2];

  form: FormGroup;
  periodOptions: { value: EventsPeriodFilter; labelKey: string }[] = [
    { value: 'upcoming', labelKey: 'EVENTS.FILTERS.PERIOD.UPCOMING' },
    { value: 'past', labelKey: 'EVENTS.FILTERS.PERIOD.PAST' },
    { value: 'all', labelKey: 'EVENTS.FILTERS.PERIOD.ALL' },
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      period: this.fb.control<EventsPeriodFilter>('upcoming'),
      associationsForm: this.fb.array([]),
      typesForm: this.fb.array([]),
      from: this.fb.control<string | null>(null),
      to: this.fb.control<string | null>(null),
    });
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.rebuildForm();
  }

  ngOnDestroy(): void {
    this.apply.emit(this.getCurrentValue());
  }

  get associationsForm(): FormArray {
    return this.form.get('associationsForm') as FormArray;
  }

  get typesForm(): FormArray {
    return this.form.get('typesForm') as FormArray;
  }

  getCurrentValue(): EventsFilter {
    const associations = this.availableAssociations.filter(
      (_, i) => this.associationsForm.at(i)?.value === true,
    );
    const types = this.availableTypes.filter(
      (_, i) => this.typesForm.at(i)?.value === true,
    );

    return {
      ...this.currentFilter,
      period: (this.form.get('period')?.value as EventsPeriodFilter) ?? this.currentFilter.period,
      associations,
      types,
      from: this.form.get('from')?.value || undefined,
      to: this.form.get('to')?.value || undefined,
    };
  }

  onApply(): void {
    this.apply.emit(this.getCurrentValue());
  }

  onReset(): void {
    this.form.get('period')?.setValue(defaultEventsFilter.period);
    this.form.get('from')?.setValue(null);
    this.form.get('to')?.setValue(null);
    for (let i = 0; i < this.associationsForm.length; i++) {
      this.associationsForm.at(i).setValue(false);
    }
    for (let i = 0; i < this.typesForm.length; i++) {
      this.typesForm.at(i).setValue(false);
    }
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

  toggleAssociation(index: number): void {
    this.toggleFormArrayControl(this.associationsForm, index);
  }

  isAssociationSelected(index: number): boolean {
    return this.isFormArrayControlSelected(this.associationsForm, index);
  }

  toggleType(index: number): void {
    this.toggleFormArrayControl(this.typesForm, index);
  }

  isTypeSelected(index: number): boolean {
    return this.isFormArrayControlSelected(this.typesForm, index);
  }

  private rebuildForm(): void {
    this.associationsForm.clear();
    this.availableAssociations.forEach((name) => {
      const checked = this.currentFilter.associations?.includes(name) ?? false;
      this.associationsForm.push(new FormControl(checked));
    });

    this.typesForm.clear();
    this.availableTypes.forEach((name) => {
      const checked = this.currentFilter.types?.includes(name) ?? false;
      this.typesForm.push(new FormControl(checked));
    });

    this.form.get('period')?.setValue(this.currentFilter.period ?? 'upcoming', { emitEvent: false });
    this.form.get('from')?.setValue(this.currentFilter.from ?? null, { emitEvent: false });
    this.form.get('to')?.setValue(this.currentFilter.to ?? null, { emitEvent: false });
  }

  private toggleFormArrayControl(formArray: FormArray, index: number): void {
    const control = formArray.at(index);
    if (!control) {
      return;
    }
    control.setValue(control.value !== true);
  }

  private isFormArrayControlSelected(formArray: FormArray, index: number): boolean {
    return formArray.at(index)?.value === true;
  }
}
