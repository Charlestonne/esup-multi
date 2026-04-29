import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EventsTabService {
  private activeTab = new BehaviorSubject<'feed' | 'calendar'>(
    this.tabFromUrl(this.router.url),
  );

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.activeTab.next(this.tabFromUrl(event.urlAfterRedirects));
      });
  }

  getActiveTab(): Observable<'feed' | 'calendar'> {
    return this.activeTab.asObservable();
  }

  private tabFromUrl(url: string): 'feed' | 'calendar' {
    return url.includes('calendar') ? 'calendar' : 'feed';
  }
}
