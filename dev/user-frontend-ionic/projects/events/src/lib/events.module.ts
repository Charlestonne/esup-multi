import { CommonModule } from '@angular/common';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProjectModuleService, SharedComponentsModule } from '@multi/shared';
import { EventsRoutingModule } from './events-routing.module';
import { EventsListPage } from './pages/events-list/events-list.page';
import { EventCardComponent } from './components/event-card/event-card.component';

const initModule = (projectModuleService: ProjectModuleService) =>
  () =>
    projectModuleService.initProjectModule({
      name: 'events',
      translation: true,
    });

@NgModule({
  declarations: [
    EventsListPage,
    EventCardComponent,
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
    IonicModule,
    EventsRoutingModule,
    TranslateModule,
    SharedComponentsModule,
  ],
})
export class EventsModule {
  static routerLink = '/events';
}
