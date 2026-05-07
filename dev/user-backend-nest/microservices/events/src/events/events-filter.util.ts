import { EventDto } from './events.dto';
import { EventsFilterDto } from './events-filter.dto';

const toTimestamp = (iso: string | undefined): number | null => {
  if (!iso) {
    return null;
  }
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : t;
};

export const applyFilterAndSort = (
  events: EventDto[],
  filter: EventsFilterDto = {},
): EventDto[] => {
  const associations = filter.associations?.filter(Boolean) ?? [];
  const types = filter.types?.filter(Boolean) ?? [];
  const period = filter.period ?? 'all';
  const from = toTimestamp(filter.from);
  const to = toTimestamp(filter.to);
  const now = Date.now();

  const filtered = events.filter((event) => {
    if (associations.length > 0 && (!event.association || !associations.includes(event.association))) {
      return false;
    }
    if (types.length > 0 && (!event.type || !types.includes(event.type))) {
      return false;
    }

    const startTs = toTimestamp(event.startDate);
    if (startTs === null) {
      return false;
    }

    if (period === 'upcoming' && startTs < now) {
      return false;
    }
    if (period === 'past' && startTs >= now) {
      return false;
    }
    if (from !== null && startTs < from) {
      return false;
    }
    if (to !== null && startTs > to) {
      return false;
    }
    return true;
  });

  const sortOrder = filter.sortOrder ?? 'asc';
  const direction = sortOrder === 'desc' ? -1 : 1;
  return filtered.sort((a, b) => {
    const ta = toTimestamp(a.startDate) ?? 0;
    const tb = toTimestamp(b.startDate) ?? 0;
    return (ta - tb) * direction;
  });
};
