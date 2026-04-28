export interface EventExternalApiDto {
  id: string;
  title: string;
  description: string;
  creator: string;
  location: string;
  contactInfo: string;
  association?: string;
  type?: string;
  startDate: string;
  endDate?: string;
  imageUrl?: string;
  locationLat?: number;
  locationLng?: number;
}

export interface EventDto {
  id: string;
  title: string;
  description: string;
  creator: string;
  location: string;
  contactInfo: string;
  association?: string;
  type?: string;
  startDate: string;
  endDate?: string;
  imageUrl?: string;
  locationLat?: number;
  locationLng?: number;
}
