import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { MultiSelectPickerModalComponent } from './multi-select-picker-modal.component';

@Component({
  selector: 'app-multi-select-picker',
  templateUrl: './multi-select-picker.component.html',
  styleUrls: ['./multi-select-picker.component.scss'],
})
export class MultiSelectPickerComponent {
  @Input() label = '';
  @Input() modalTitle = '';
  @Input() searchPlaceholder = '';
  @Input() emptyText = '';
  @Input() options: string[] = [];
  @Input() selected: string[] = [];
  @Input() isLoading = false;

  @Output() selectedChange = new EventEmitter<string[]>();

  readonly previewLimit = 3;

  constructor(
    private modalController: ModalController,
    private translate: TranslateService,
  ) {}

  get hasOptions(): boolean {
    return !this.isLoading && this.options.length > 0;
  }

  get isEmpty(): boolean {
    return !this.isLoading && this.options.length === 0;
  }

  get summary(): string {
    if (this.selected.length === 0) {
      return this.translate.instant('EVENTS.FILTERS.PICKER_NONE_SELECTED');
    }
    return this.translate.instant('EVENTS.FILTERS.PICKER_SELECTED_COUNT', {
      count: this.selected.length,
    });
  }

  get previewText(): string {
    if (this.selected.length === 0) {
      return '';
    }
    const head = this.selected.slice(0, this.previewLimit).join(', ');
    const extra = this.selected.length - this.previewLimit;
    return extra > 0 ? `${head} +${extra}` : head;
  }

  async openPicker(): Promise<void> {
    if (!this.hasOptions) {
      return;
    }

    const modal = await this.modalController.create({
      component: MultiSelectPickerModalComponent,
      componentProps: {
        title: this.modalTitle,
        searchPlaceholder: this.searchPlaceholder,
        options: this.options,
        selected: [...this.selected],
      },
      cssClass: 'multi-select-picker-modal',
    });

    await modal.present();
    const { data, role } = await modal.onDidDismiss<string[] | null>();
    if (role === 'apply' && Array.isArray(data)) {
      this.selectedChange.emit(data);
    }
  }
}
