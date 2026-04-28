import { Injectable } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class EventsTabService {
  private activeTab$: Observable<'feed' | 'calendar'>;

  constructor(private router: Router) {
    // Listen to route changes and extract the tab from the URL
    this.activeTab$ = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map((event: any) => {
        if (event.urlAfterRedirects.includes('calendar')) {
          return 'calendar';
        }
        return 'feed';
      })
    );
  }

  getActiveTab(): Observable<'feed' | 'calendar'> {
    return this.activeTab$;
  }
}

