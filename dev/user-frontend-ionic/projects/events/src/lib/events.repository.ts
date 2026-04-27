import { createStore, select, setProps, withProps } from '@ngneat/elf';
import { selectAllEntities, setEntities, withEntities, updateEntities } from '@ngneat/elf-entities';
import { Event } from './models/event.model';

interface EventsProps {
  userLikedEventIds: string[];
}

const STORE_NAME = 'events';

const store = createStore(
  { name: STORE_NAME },
  withEntities<Event>(),
  withProps<EventsProps>({ userLikedEventIds: [] }),
);

export const events$ = store.pipe(selectAllEntities());

export const userLikedEventIds$ = store.pipe(
  select((state) => state.userLikedEventIds),
);

export const setEvents = (events: Event[]) => {
  store.update(setEntities(events));
};

export const setUserLikes = (eventIds: string[]) => {
  store.update(setProps({ userLikedEventIds: eventIds }));
};

export const addUserLike = (eventId: string, newLikesCount: number) => {
  store.update(
    setProps((state) => ({
      userLikedEventIds: [...state.userLikedEventIds, eventId],
    })),
    updateEntities(eventId, { likesCount: newLikesCount }),
  );
};

export const removeUserLike = (eventId: string, newLikesCount: number) => {
  store.update(
    setProps((state) => ({
      userLikedEventIds: state.userLikedEventIds.filter((id) => id !== eventId),
    })),
    updateEntities(eventId, { likesCount: newLikesCount }),
  );
};

export const clearEvents = () => store.reset();
