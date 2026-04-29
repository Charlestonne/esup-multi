import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

// On utilise IonicModule pour les transitions si dispo
import { EventsCalendarPage } from './pages/events-calendar/events-calendar.page';
import { EventsListPage } from './pages/events-list/events-list.page';
import { EventDetailPage } from './pages/event-detail/event-detail.page';

const routes: Routes = [
  {
    path: 'events',
    redirectTo: 'events/feed',
    pathMatch: 'full',
  },
  {
    path: 'events/feed',
    component: EventsListPage,
  },
  {
    path: 'events/calendar',
    component: EventsCalendarPage,
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
