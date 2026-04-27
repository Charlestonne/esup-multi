export interface Event {
  id: string;
  title: string;
  description: string;
  creator: string;
  location: string;
  locationLat?: number;
  locationLng?: number;
  contactInfo: string;
  association?: string;
  type?: string;
  startDate: string;
  endDate?: string;
  imageUrl?: string;
  likesCount: number;
}

export interface EventWithUserLike extends Event {
  isLikedByUser: boolean;
}

export type EventSortOption = 'date' | 'likes';

export interface EventFilters {
  association?: string;
  type?: string;
  location?: string;
}

export interface LikeEventResponse {
  eventId: string;
  liked: boolean;
  likesCount: number;
}
