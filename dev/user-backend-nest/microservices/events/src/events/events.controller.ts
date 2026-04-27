import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagePattern } from '@nestjs/microservices';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { EventDto } from './events.dto';
import { EventsService } from './events.service';

@Controller()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  @MessagePattern({ cmd: 'events' })
  async getEvents(): Promise<EventDto[]> {
    const cacheKey = 'events';
    const cached = await this.cacheManager.get<EventDto[]>(cacheKey);
    if (cached !== undefined) {
      return cached;
    }

    const events = await firstValueFrom(this.eventsService.getEvents());
    const ttl = this.configService.get<number>('cacheTtlMs') || 300000;
    await this.cacheManager.set(cacheKey, events, ttl);
    return events;
  }
}
