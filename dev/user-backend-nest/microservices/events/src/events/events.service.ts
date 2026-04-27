import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { catchError, map, Observable, from, switchMap } from 'rxjs';
import { EventsProviderApi } from '../config/configuration.interfaces';
import { LikesRepository } from '../likes/likes.repository';
import { EventDto, EventExternalApiDto } from './events.dto';

@Injectable()
export class EventsService {
  private readonly logger = new Logger(EventsService.name);
  private eventsProviderApiConfig: EventsProviderApi;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly likesRepository: LikesRepository,
  ) {
    this.eventsProviderApiConfig =
      this.configService.get<EventsProviderApi>('eventsProviderApi');
  }

  getEvents(): Observable<EventDto[]> {
    this.logger.log('*** get events');
    return this.httpService
      .get<EventExternalApiDto[]>(this.eventsProviderApiConfig.apiUrl, {
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
        map((res) => res.data),
        switchMap((externalEvents) =>
          from(this.enrichWithLikeCounts(externalEvents)),
        ),
      );
  }

  private async enrichWithLikeCounts(
    externalEvents: EventExternalApiDto[],
  ): Promise<EventDto[]> {
    const eventIds = externalEvents.map((e) => e.id);
    const likeCounts = await this.likesRepository.countByEventIds(eventIds);
    return externalEvents.map((e) => ({
      id: e.id,
      title: e.title,
      description: e.description,
      creator: e.creator,
      location: e.location,
      locationLat: e.locationLat,
      locationLng: e.locationLng,
      contactInfo: e.contactInfo,
      association: e.association,
      type: e.type,
      startDate: e.startDate,
      endDate: e.endDate,
      imageUrl: e.imageUrl,
      likesCount: likeCounts[e.id] || 0,
    }));
  }
}
