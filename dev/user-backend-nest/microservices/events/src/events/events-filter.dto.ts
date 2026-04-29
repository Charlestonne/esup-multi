export type EventsPeriodFilter = 'all' | 'upcoming' | 'past';
export type EventsSortOrder = 'asc' | 'desc';

export interface EventsFilterDto {
  associations?: string[];
  types?: string[];
  period?: EventsPeriodFilter;
  from?: string;
  to?: string;
  sortOrder?: EventsSortOrder;
}
