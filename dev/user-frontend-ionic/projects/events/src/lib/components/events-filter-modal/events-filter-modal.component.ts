import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';
import { FormArray, FormBuilder, FormControl, FormGroup } from '@angular/forms';
import { defaultEventsFilter, EventsFilter } from '../../models/events-filter.model';

@Component({
  selector: 'app-events-filter-modal',
  templateUrl: './events-filter-modal.component.html',
  styleUrls: ['./events-filter-modal.component.scss'],
})
export class EventsFilterModalComponent implements OnChanges {
  @Input() availableAssociations: string[] = [];
  @Input() availableTypes: string[] = [];
  @Input() currentFilter: EventsFilter = defaultEventsFilter;

  @Output() apply = new EventEmitter<EventsFilter>();
  @Output() reset = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      associationsForm: this.fb.array([]),
      typesForm: this.fb.array([]),
      from: this.fb.control<string | null>(null),
      to: this.fb.control<string | null>(null),
    });
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.rebuildForm();
  }

  get associationsForm(): FormArray {
    return this.form.get('associationsForm') as FormArray;
  }

  get typesForm(): FormArray {
    return this.form.get('typesForm') as FormArray;
  }

  onApply(): void {
    const associations = this.availableAssociations.filter(
      (_, i) => this.associationsForm.at(i)?.value === true,
    );
    const types = this.availableTypes.filter(
      (_, i) => this.typesForm.at(i)?.value === true,
    );

    this.apply.emit({
      ...this.currentFilter,
      associations,
      types,
      from: this.form.get('from')?.value || undefined,
      to: this.form.get('to')?.value || undefined,
    });
  }

  onReset(): void {
    this.reset.emit();
  }

  onDismiss(): void {
    this.dismiss.emit();
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

    this.form.get('from')?.setValue(this.currentFilter.from ?? null, { emitEvent: false });
    this.form.get('to')?.setValue(this.currentFilter.to ?? null, { emitEvent: false });
  }
}
