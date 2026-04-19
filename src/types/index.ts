export type AspectRatio = "portrait" | "landscape" | "square";

export interface GalleryImage {
  src: string;
  alt: string;
  aspectRatio: AspectRatio;
}

export interface TimelineEvent {
  year: string;
  title: string;
  description: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface VenueLocation {
  name: string;
  address: string;
  city: string;
  time: string;
  description: string;
}

export interface TravelInfo {
  icon: string;
  label: string;
  value: string;
  detail: string;
}
