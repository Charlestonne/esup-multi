import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { MultiTenantService } from '@multi/shared';
import { Event } from './models/event.model';
import { EventsFilter } from './models/events-filter.model';
import { setEvents } from './events.repository';

export interface EventsFacets {
  associations: string[];
  types: string[];
}

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  constructor(
    private multiTenantService: MultiTenantService,
    private http: HttpClient,
  ) {}

  public loadAndStoreEvents(filter?: EventsFilter): Observable<Event[]> {
    const url = `${this.multiTenantService.getApiEndpoint()}/events`;
    const params = this.buildParams(filter);
    return this.http
      .get<Event[]>(url, { params })
      .pipe(tap((events) => setEvents(events)));
  }

  public fetchAvailableFacets(): Observable<EventsFacets> {
    const url = `${this.multiTenantService.getApiEndpoint()}/events`;
    return this.http.get<Event[]>(url).pipe(
      map((events) => ({
        associations: this.uniqueSorted(events.map((e) => e.association)),
        types: this.uniqueSorted(events.map((e) => e.type)),
      })),
    );
  }

  private uniqueSorted(values: (string | undefined)[]): string[] {
    const set = new Set<string>();
    values.forEach((v) => {
      if (v) {
        set.add(v);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }

  private buildParams(filter?: EventsFilter): HttpParams {
    let params = new HttpParams();
    if (!filter) {
      return params;
    }

    if (filter.associations.length > 0) {
      params = params.set('associations', filter.associations.join(','));
    }
    if (filter.types.length > 0) {
      params = params.set('types', filter.types.join(','));
    }
    if (filter.period && filter.period !== 'all') {
      params = params.set('period', filter.period);
    }
    if (filter.from) {
      params = params.set('from', filter.from);
    }
    if (filter.to) {
      params = params.set('to', filter.to);
    }
    if (filter.sortOrder) {
      params = params.set('sortOrder', filter.sortOrder);
    }
    return params;
  }
}
