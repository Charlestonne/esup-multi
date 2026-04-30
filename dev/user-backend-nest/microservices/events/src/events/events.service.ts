import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { catchError, map, Observable } from 'rxjs';
import { EventsProviderApi } from '../config/configuration.interfaces';
import { EventDto } from './events.dto';

interface DirectusEvent {
  id: number;
  name: string;
  description?: string;
  organizer?: string;
  source?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  categories?: string[];
  geo?: { type: string; coordinates: [number, number] };
  Image?: string;
}

function mapDirectusEvent(e: DirectusEvent): EventDto {
  return {
    id: String(e.id),
    title: e.name,
    description: e.description || '',
    creator: e.organizer || e.source || '',
    location: e.location || '',
    contactInfo: null,
    association: e.source || null,
    type: Array.isArray(e.categories) && e.categories.length > 0 ? e.categories[0] : null,
    startDate: e.startDate,
    endDate: e.endDate || null,
    locationLat: e.geo?.coordinates?.[1] ?? null,
    locationLng: e.geo?.coordinates?.[0] ?? null,
    imageUrl: e.Image ? `http://localhost:8055/assets/${e.Image}` : null,
  };
}

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private eventsProviderApiConfig: EventsProviderApi;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.eventsProviderApiConfig =
      this.configService.get<EventsProviderApi>('eventsProviderApi');
  }

  getEvents(): Observable<EventDto[]> {
    this.logger.log('*** get events');
    return this.httpService
      .get<{ data: DirectusEvent[] }>(this.eventsProviderApiConfig.apiUrl, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${this.eventsProviderApiConfig.bearerToken}`,
        },
      })
      .pipe(
        catchError((err) => {
          const errorMessage = `Unable to get events`;
          this.logger.error(errorMessage, err);
          throw new RpcException(errorMessage);
        }),
        map((res) => res.data.data.map(mapDirectusEvent)),
      );
  }
}
