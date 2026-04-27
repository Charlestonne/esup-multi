import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventDetailPage } from './pages/event-detail/event-detail.page';
import { EventsListPage } from './pages/events-list/events-list.page';
import { EventsMapPage } from './pages/events-map/events-map.page';

const routes: Routes = [
  {
    path: 'events',
    component: EventsListPage,
  },
  {
    path: 'events/map',
    component: EventsMapPage,
  },
  {
    path: 'events/:id',
    component: EventDetailPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventsRoutingModule {}
