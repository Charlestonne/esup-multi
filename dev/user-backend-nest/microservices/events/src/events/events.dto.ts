export interface EventExternalApiDto {
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
}

export interface EventDto {
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

export interface LikeEventDto {
  eventId: string;
  username: string;
}

export interface LikeEventResponseDto {
  eventId: string;
  liked: boolean;
  likesCount: number;
}

export interface GetUserLikesDto {
  username: string;
}
