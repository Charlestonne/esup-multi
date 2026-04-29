export type EventsPeriodFilter = 'all' | 'upcoming' | 'past';
export type EventsSortOrder = 'asc' | 'desc';

export interface EventsFilter {
  associations: string[];
  types: string[];
  period: EventsPeriodFilter;
  from?: string;
  to?: string;
  sortOrder: EventsSortOrder;
}

export const defaultEventsFilter: EventsFilter = {
  associations: [],
  types: [],
  period: 'upcoming',
  sortOrder: 'asc',
};
