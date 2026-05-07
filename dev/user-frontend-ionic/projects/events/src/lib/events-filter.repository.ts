import { createStore, select, setProps, withProps } from '@ngneat/elf';
import { persistState } from '@ngneat/elf-persist-state';
import { localForageStore } from '@multi/shared';
import { defaultEventsFilter, EventsFilter } from './models/events-filter.model';

const STORE_NAME = 'events-filter';

const store = createStore(
  { name: STORE_NAME },
  withProps<EventsFilter>(defaultEventsFilter),
);

export const persistEventsFilter = persistState(store, {
  key: STORE_NAME,
  storage: localForageStore,
});

export const eventsFilter$ = store.pipe(select((state) => state));

export const setEventsFilter = (patch: Partial<EventsFilter>) =>
  store.update(setProps(patch));

export const resetEventsFilter = () =>
  store.update(setProps(defaultEventsFilter));

export const getEventsFilterSnapshot = (): EventsFilter => store.getValue();
