import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { EventsListPage } from './pages/events-list/events-list.page';

const routes: Routes = [
  {
    path: 'events',
    component: EventsListPage,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EventsRoutingModule {}
