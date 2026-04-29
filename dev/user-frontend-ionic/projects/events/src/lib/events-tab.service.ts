import { Injectable } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class EventsTabService {
  private readonly activeTab = new BehaviorSubject<'feed' | 'calendar'>(
    this.tabFromUrl(this.router.url),
  );
  private urlBeforeEvents = '/';
  private previousUrl = this.router.url;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        const current: string = event.urlAfterRedirects;
        if (current.startsWith('/events') && !this.previousUrl.startsWith('/events')) {
          this.urlBeforeEvents = this.previousUrl;
        }
        this.activeTab.next(this.tabFromUrl(current));
        this.previousUrl = current;
      });
  }

  getActiveTab(): Observable<'feed' | 'calendar'> {
    return this.activeTab.asObservable();
  }

  getUrlBeforeEvents(): string {
    return this.urlBeforeEvents;
  }

  private tabFromUrl(url: string): 'feed' | 'calendar' {
    return url.includes('calendar') ? 'calendar' : 'feed';
  }
}
