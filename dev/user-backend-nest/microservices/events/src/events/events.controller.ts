import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Controller, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MessagePattern } from '@nestjs/microservices';
import { Cache } from 'cache-manager';
import { firstValueFrom } from 'rxjs';
import { LikesRepository } from '../likes/likes.repository';
import {
  EventDto,
  GetUserLikesDto,
  LikeEventDto,
  LikeEventResponseDto,
} from './events.dto';
import { EventsService } from './events.service';

@Controller()
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
    private readonly likesRepository: LikesRepository,
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

  @MessagePattern({ cmd: 'event/like' })
  async likeEvent(data: LikeEventDto): Promise<LikeEventResponseDto> {
    const alreadyLiked = await this.likesRepository.exists(
      data.eventId,
      data.username,
    );
    if (!alreadyLiked) {
      await this.likesRepository.create(data.eventId, data.username);
      await this.cacheManager.del('events');
    }
    const likesCount = await this.likesRepository.countByEventId(data.eventId);
    return { eventId: data.eventId, liked: true, likesCount };
  }

  @MessagePattern({ cmd: 'event/unlike' })
  async unlikeEvent(data: LikeEventDto): Promise<LikeEventResponseDto> {
    await this.likesRepository.delete(data.eventId, data.username);
    await this.cacheManager.del('events');
    const likesCount = await this.likesRepository.countByEventId(data.eventId);
    return { eventId: data.eventId, liked: false, likesCount };
  }

  @MessagePattern({ cmd: 'event/user-likes' })
  async getUserLikes(data: GetUserLikesDto): Promise<string[]> {
    return this.likesRepository.findByUsername(data.username);
  }
}
