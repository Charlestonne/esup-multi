import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { EventDto } from './events.dto';
import { EventsFilterDto } from './events-filter.dto';
import { applyFilterAndSort } from './events-filter.util';
import { EventsService } from './events.service';

@Controller()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @MessagePattern({ cmd: 'events' })
  async getEvents(@Payload() filter: EventsFilterDto = {}): Promise<EventDto[]> {
    const cacheKey = 'events';
    let events = await this.cacheManager.get<EventDto[]>(cacheKey);
    if (events === undefined) {
      events = await firstValueFrom(this.eventsService.getEvents());
      const ttl = this.configService.get<number>('cacheTtlMs') || 300000;
      await this.cacheManager.set(cacheKey, events, ttl);
    }

    return applyFilterAndSort(events, filter);
  }
}
