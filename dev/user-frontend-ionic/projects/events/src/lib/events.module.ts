import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { APP_INITIALIZER, CUSTOM_ELEMENTS_SCHEMA, NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProjectModuleService, SharedComponentsModule } from '@multi/shared';
import { EventsRoutingModule } from './events-routing.module';
import { EventsListPage } from './pages/events-list/events-list.page';
import { EventsCalendarPage } from './pages/events-calendar/events-calendar.page';
import { EventCardComponent } from './components/event-card/event-card.component';
import { RouterModule } from '@angular/router';
import { EventDetailPage } from './pages/event-detail/event-detail.page';

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
