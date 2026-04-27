import { createStore } from '@ngneat/elf';
import { selectAllEntities, setEntities, withEntities } from '@ngneat/elf-entities';
import { Event } from './models/event.model';

const store = createStore(
  { name: 'events' },
  withEntities<Event>(),
);

export const events$ = store.pipe(selectAllEntities());

export const setEvents = (events: Event[]) => {
  store.update(setEntities(events));
};

export const clearEvents = () => store.reset();
