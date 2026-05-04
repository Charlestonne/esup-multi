import { createStore, select, setProps, withProps } from '@ngneat/elf';
import { persistState } from '@ngneat/elf-persist-state';
import { localForageStore } from '@multi/shared';

const STORE_NAME = 'events-preferences';

interface EventsPreferences {
  followedOrganizers: string[];
}

const defaultEventsPreferences: EventsPreferences = {
  followedOrganizers: [],
};

const store = createStore(
  { name: STORE_NAME },
  withProps<EventsPreferences>(defaultEventsPreferences),
);

export const persistEventsPreferences = persistState(store, {
  key: STORE_NAME,
  storage: localForageStore,
});

export const followedOrganizers$ = store.pipe(select((s) => s.followedOrganizers));

export const hasFollowedOrganizers$ = store.pipe(
  select((s) => s.followedOrganizers.length > 0),
);

export const getFollowedOrganizersSnapshot = (): string[] =>
  store.getValue().followedOrganizers;

export const toggleFollowOrganizer = (name: string): void => {
  const current = store.getValue().followedOrganizers;
  store.update(
    setProps({
      followedOrganizers: current.includes(name)
        ? current.filter((n) => n !== name)
        : [...current, name],
    }),
  );
};

export const isFollowingOrganizer$ = (name: string) =>
  store.pipe(select((s) => s.followedOrganizers.includes(name)));
