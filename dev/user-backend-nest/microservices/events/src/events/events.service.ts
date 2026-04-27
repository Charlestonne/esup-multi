import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RpcException } from '@nestjs/microservices';
import { catchError, map, Observable } from 'rxjs';
import { EventsProviderApi } from '../config/configuration.interfaces';
import { EventDto } from './events.dto';

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
      .get<EventDto[]>(this.eventsProviderApiConfig.apiUrl, {
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
      );
  }
}
