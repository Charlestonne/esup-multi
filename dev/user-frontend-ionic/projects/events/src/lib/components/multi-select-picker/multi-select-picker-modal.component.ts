import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { IonSearchbar, ModalController } from '@ionic/angular';

@Component({
  selector: 'app-multi-select-picker-modal',
  templateUrl: './multi-select-picker-modal.component.html',
  styleUrls: ['./multi-select-picker-modal.component.scss'],
})
export class MultiSelectPickerModalComponent implements OnInit {
  @Input() title = '';
  @Input() searchPlaceholder = '';
  @Input() options: string[] = [];
  @Input() selected: string[] = [];

  @ViewChild('searchbar') searchbar?: IonSearchbar;

  searchTerm = '';
  selectedSet = new Set<string>();

  constructor(private modalController: ModalController) {}

  ngOnInit(): void {
    this.selectedSet = new Set(this.selected);
  }

  ionViewDidEnter(): void {
    setTimeout(() => this.searchbar?.setFocus(), 150);
  }

  get filteredOptions(): string[] {
    const q = this.searchTerm.trim().toLowerCase();
    if (!q) {
      return this.options;
    }
    return this.options.filter((o) => o.toLowerCase().includes(q));
  }

  get selectedCount(): number {
    return this.selectedSet.size;
  }

  isSelected(option: string): boolean {
    return this.selectedSet.has(option);
  }

  toggle(option: string): void {
    if (this.selectedSet.has(option)) {
      this.selectedSet.delete(option);
    } else {
      this.selectedSet.add(option);
    }
  }

  onSearchInput(event: CustomEvent): void {
    const value = (event.detail as { value?: string })?.value ?? '';
    this.searchTerm = value;
  }

  clear(): void {
    this.selectedSet.clear();
  }

  apply(): void {
    const data = this.options.filter((o) => this.selectedSet.has(o));
    this.modalController.dismiss(data, 'apply');
  }

  cancel(): void {
    this.modalController.dismiss(null, 'cancel');
  }
}
