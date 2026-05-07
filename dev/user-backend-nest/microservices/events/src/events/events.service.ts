import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { catchError, map, Observable } from 'rxjs';
import { EventsProviderApi } from '../config/configuration.interfaces';
import { EventDto } from './events.dto';

interface DirectusEvent {
  id: number;
  status: string;
  name: string;
  description?: string;
  organizer?: string | null;
  location?: string;
  startDate: string;
  endDate?: string;
  categories?: string[];
  rawData?: {
    categories?: string[];
    association?: { id: number; name: string; acronym?: string };
    type?: { id: number; name: string; color?: string };
    logo_url?: string;
    website_url?: string;
  };
  geo?: { type: string; coordinates: [number, number] };
  logo_url?: string;
  website_url?: string;
  external_id?: string;
}

function mapDirectusEvent(e: DirectusEvent): EventDto {
  const categories =
    Array.isArray(e.categories) && e.categories.length > 0
      ? e.categories
      : e.rawData?.categories;

  const associationName = e.rawData?.association?.name || e.organizer || '';
  const websiteUrl = e.website_url || (e.rawData?.website_url?.trim() ? e.rawData.website_url : null) || null;

  return {
    id: String(e.id),
    title: e.name,
    description: e.description || '',
    creator: associationName,
    location: e.location || '',
    contactInfo: null,
    association: associationName || null,
    type: Array.isArray(categories) && categories.length > 0 ? categories[0] : null,
    startDate: e.startDate,
    endDate: e.endDate || null,
    locationLat: e.geo?.coordinates?.[1] ?? null,
    locationLng: e.geo?.coordinates?.[0] ?? null,
    imageUrl: e.logo_url || e.rawData?.logo_url || null,
    websiteUrl,
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
    const headers: Record<string, string> = {
      Accept: 'application/json',
    };
    const bearerToken = this.eventsProviderApiConfig.bearerToken?.trim();

    if (bearerToken) {
      headers.Authorization = `Bearer ${bearerToken}`;
    }

    return this.httpService
      .get<{ data: DirectusEvent[] }>(this.eventsProviderApiConfig.apiUrl, {
        headers,
        params: {
          limit: -1,
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
