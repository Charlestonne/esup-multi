import { ChangeDetectorRef, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Location } from '@angular/common';
import * as Leaflet from 'leaflet';
import { firstValueFrom } from 'rxjs';
import { Event } from '../../models/event.model';
import { EventsService } from '../../events.service';
import { selectEventById } from '../../events.repository';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.page.html',
  styleUrls: ['./event-detail.page.scss'],
})
export class EventDetailPage implements OnDestroy {
  event: Event | undefined;
  isLoading = false;
  private map: Leaflet.Map | undefined;

  constructor(
    private route: ActivatedRoute,
    private eventsService: EventsService,
    private location: Location,
    private cdr: ChangeDetectorRef,
  ) {}

  async ionViewWillEnter() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.event = await firstValueFrom(selectEventById(id));
    if (!this.event) {
      this.isLoading = true;
      await firstValueFrom(this.eventsService.loadAndStoreEvents());
      this.event = await firstValueFrom(selectEventById(id));
      this.isLoading = false;
    }
    if (this.event?.locationLat && this.event?.locationLng) {
      this.cdr.detectChanges(); // force le rendu du *ngIf avant que Leaflet cherche le div
      await this.initMap(this.event.locationLat, this.event.locationLng);
    }
  }

  ionViewWillLeave() {
    this.map?.remove();
    this.map = undefined;
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  goBack() {
    this.location.back();
  }

  getContactLinks(): string[] {
    return this.event?.contactInfo?.split('|').map(s => s.trim()) ?? [];
  }

  isEmail(contact: string): boolean {
    return contact.includes('@');
  }

  private async initMap(lat: number, lng: number) {
    this.map = Leaflet.map('event-map', { center: [lat, lng], zoom: 15 });
    Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);
    const icon = Leaflet.icon({
      iconSize: [25, 41],
      iconAnchor: [13, 41],
      iconUrl: './assets/icons/leaflet/marker-icon.png',
      iconRetinaUrl: './assets/icons/leaflet/marker-icon-2x.png',
      shadowUrl: './assets/icons/leaflet/marker-shadow.png',
    });
    Leaflet.marker([lat, lng], { icon })
      .bindPopup(`<b>${this.event!.location}</b>`)
      .addTo(this.map)
      .openPopup();
  }
}
