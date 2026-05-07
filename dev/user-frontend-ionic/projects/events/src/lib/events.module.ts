import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProjectModuleService, SharedComponentsModule } from '@multi/shared';
import { EventsRoutingModule } from './events-routing.module';
import { EventsListPage } from './pages/events-list/events-list.page';
import { EventsCalendarPage } from './pages/events-calendar/events-calendar.page';
import { EventCardComponent } from './components/event-card/event-card.component';
import { RouterModule } from '@angular/router';
import { EventDetailPage } from './pages/event-detail/event-detail.page';
import { EventsFilterModalComponent } from './components/events-filter-modal/events-filter-modal.component';
import { EventsSortModalComponent } from './components/events-sort-modal/events-sort-modal.component';
import { MultiSelectPickerComponent } from './components/multi-select-picker/multi-select-picker.component';
import { MultiSelectPickerModalComponent } from './components/multi-select-picker/multi-select-picker-modal.component';

const initModule = (projectModuleService: ProjectModuleService) =>
  () =>
    projectModuleService.initProjectModule({
      name: 'events',
      translation: true,
    });

@NgModule({
  declarations: [
    EventsListPage,
    EventsCalendarPage,
    EventCardComponent,
    EventDetailPage,
    EventsFilterModalComponent,
    EventsSortModalComponent,
    MultiSelectPickerComponent,
    MultiSelectPickerModalComponent,
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: initModule,
      deps: [ProjectModuleService],
      multi: true,
    },
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    IonicModule,
    EventsRoutingModule,
    TranslateModule,
    ReactiveFormsModule,
    SharedComponentsModule,
    RouterModule,
  ],
  exports: [
    EventCardComponent,
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class EventsModule {
  static routerLink = '/events';
}
