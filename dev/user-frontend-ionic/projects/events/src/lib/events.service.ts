import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MultiTenantService } from '@multi/shared';
import { Event } from './models/event.model';
import { setEvents } from './events.repository';

@Injectable({
  providedIn: 'root',
})
export class EventsService {
  constructor(
    private multiTenantService: MultiTenantService,
    private http: HttpClient,
  ) {}

  public loadAndStoreEvents(): Observable<Event[]> {
    const url = `${this.multiTenantService.getApiEndpoint()}/events`;
    return this.http.get<Event[]>(url).pipe(tap((events) => setEvents(events)));
  }
}
