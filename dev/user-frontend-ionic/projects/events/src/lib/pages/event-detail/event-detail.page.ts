import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { take } from 'rxjs/operators';
import { EventWithUserLike } from '../../models/event.model';
import { events$, userLikedEventIds$ } from '../../events.repository';
import { EventsService } from '../../events.service';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.page.html',
  styleUrls: ['./event-detail.page.scss'],
})
export class EventDetailPage implements OnInit {
  public event: EventWithUserLike | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventsService: EventsService,
  ) {}

  ngOnInit() {
    const eventId = this.route.snapshot.paramMap.get('id');
    combineLatest([events$, userLikedEventIds$])
      .pipe(take(1))
      .subscribe(([events, likedIds]) => {
        const found = events.find((e) => e.id === eventId);
        if (found) {
          this.event = { ...found, isLikedByUser: likedIds.includes(found.id) };
        }
      });
  }

  toggleLike() {
    if (!this.event) {
      return;
    }
    const action = this.event.isLikedByUser
      ? this.eventsService.unlikeEvent(this.event.id)
      : this.eventsService.likeEvent(this.event.id);

    action.pipe(take(1)).subscribe((res) => {
      this.event = {
        ...this.event,
        isLikedByUser: res.liked,
        likesCount: res.likesCount,
      };
    });
  }

  navigateToMap() {
    this.router.navigate(['events', 'map']);
  }
}
