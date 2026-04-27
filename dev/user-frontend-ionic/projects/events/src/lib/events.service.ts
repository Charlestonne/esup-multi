import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MultiTenantService, getAuthToken } from '@multi/shared';
import { take, switchMap } from 'rxjs/operators';
import {
  Event,
  LikeEventResponse,
} from './models/event.model';
import {
  setEvents,
  setUserLikes,
  addUserLike,
  removeUserLike,
} from './events.repository';

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

  public loadAndStoreUserLikes(): Observable<string[]> {
    const url = `${this.multiTenantService.getApiEndpoint()}/event/user-likes`;
    return getAuthToken().pipe(
      take(1),
      switchMap((authToken) =>
        this.http
          .post<string[]>(url, { authToken })
          .pipe(tap((ids) => setUserLikes(ids))),
      ),
    );
  }

  public likeEvent(eventId: string): Observable<LikeEventResponse> {
    const url = `${this.multiTenantService.getApiEndpoint()}/event/like`;
    return getAuthToken().pipe(
      take(1),
      switchMap((authToken) =>
        this.http
          .post<LikeEventResponse>(url, { authToken, eventId })
          .pipe(tap((res) => addUserLike(res.eventId, res.likesCount))),
      ),
    );
  }

  public unlikeEvent(eventId: string): Observable<LikeEventResponse> {
    const url = `${this.multiTenantService.getApiEndpoint()}/event/unlike`;
    return getAuthToken().pipe(
      take(1),
      switchMap((authToken) =>
        this.http
          .post<LikeEventResponse>(url, { authToken, eventId })
          .pipe(tap((res) => removeUserLike(res.eventId, res.likesCount))),
      ),
    );
  }
}
