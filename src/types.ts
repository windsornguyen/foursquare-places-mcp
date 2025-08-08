import { z } from 'zod';

/**
 * @fileoverview Type definitions and validation schemas for Foursquare Places API
 * @description Provides comprehensive type safety and runtime validation for all API interactions
 * @author Claude Code
 * @version 1.0.0
 */

// Base coordinate schema
export const CoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

// Coordinate string schema (for ll parameter: "lat,lng")
export const CoordinateStringSchema = z.string().regex(
  /^-?\d+\.?\d*,-?\d+\.?\d*$/,
  'Coordinates must be in format "latitude,longitude" (e.g., "40.74,-74.0")'
);

// Search parameters
export const SearchNearParamsSchema = z.object({
  where: z.string().min(1, 'Location is required'),
  what: z.string().min(1, 'Search query is required'),
  limit: z.number().min(1).max(50).default(5).optional(),
});

export const SearchNearPointParamsSchema = z.object({
  what: z.string().min(1, 'Search query is required'),
  ll: CoordinateStringSchema,
  radius: z.number().min(1).max(100000).default(1000),
  limit: z.number().min(1).max(50).default(5).optional(),
});

export const PlaceSnapParamsSchema = z.object({
  ll: CoordinateStringSchema,
  limit: z.number().min(1).max(10).default(1).optional(),
});

export const PlaceDetailsParamsSchema = z.object({
  id: z.string().min(1, 'Place ID is required'),
  fields: z.string().optional(),
});

// Response types (based on Foursquare API documentation)
export interface FoursquarePlace {
  fsq_id: string;
  name: string;
  location: {
    address?: string;
    locality?: string;
    region?: string;
    postcode?: string;
    country?: string;
    formatted_address?: string;
    latitude?: number;
    longitude?: number;
  };
  categories: Array<{
    id: number;
    name: string;
    icon: {
      prefix: string;
      suffix: string;
    };
  }>;
  distance?: number;
  description?: string;
  tel?: string;
  website?: string;
  social_media?: {
    facebook_id?: string;
    instagram?: string;
    twitter?: string;
  };
  hours?: {
    display?: string;
    is_local_holiday?: boolean;
    open_now?: boolean;
    regular?: Array<{
      close: string;
      day: number;
      open: string;
    }>;
  };
  rating?: number;
  price?: number;
  menu?: string;
  photos?: Array<{
    id: string;
    prefix: string;
    suffix: string;
    width: number;
    height: number;
  }>;
  tips?: Array<{
    id: string;
    text: string;
    created_at: string;
    user: {
      first_name: string;
      last_name: string;
    };
  }>;
}

export interface FoursquareSearchResponse {
  results: FoursquarePlace[];
  context?: {
    geo_bounds?: {
      ne: { lat: number; lng: number };
      sw: { lat: number; lng: number };
    };
  };
}

export interface FoursquareErrorResponse {
  error?: {
    code: string;
    message: string;
  };
}

// Type definitions for the schemas
export type SearchNearParams = z.infer<typeof SearchNearParamsSchema>;
export type SearchNearPointParams = z.infer<typeof SearchNearPointParamsSchema>;
export type PlaceSnapParams = z.infer<typeof PlaceSnapParamsSchema>;
export type PlaceDetailsParams = z.infer<typeof PlaceDetailsParamsSchema>;