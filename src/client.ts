import axios, { AxiosInstance } from 'axios';
import type {
  SearchNearParams,
  SearchNearPointParams,
  PlaceSnapParams,
  PlaceDetailsParams,
  FoursquareSearchResponse,
  FoursquarePlace,
  FoursquareErrorResponse
} from './types.js';

export class FoursquareClient {
  private client: AxiosInstance;
  private apiKeys: string[];

  constructor(apiKeys: string | string[]) {
    // Support both single key and multiple keys for random selection
    this.apiKeys = Array.isArray(apiKeys) ? apiKeys : [apiKeys];
    
    if (this.apiKeys.length === 0 || this.apiKeys.some(key => !key)) {
      throw new Error('At least one valid Foursquare API key is required');
    }

    this.client = axios.create({
      baseURL: 'https://places-api.foursquare.com',
      timeout: 30000,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Foursquare-Places-MCP-Server/1.0.0',
        'X-Places-Api-Version': '2025-02-05'
      }
    });

    // Add request interceptor for random API key selection
    this.client.interceptors.request.use((config) => {
      const randomKey = this.getRandomApiKey();
      config.headers.Authorization = `Bearer ${randomKey}`;
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Log rate limit or auth errors
        if (error.response?.status === 429) {
          console.warn(`Rate limit hit, will retry with different random key on next request`);
        } else if (error.response?.status === 401) {
          console.warn(`Authentication error, will retry with different random key on next request`);
        }
        throw error;
      }
    );
  }

  private getRandomApiKey(): string {
    if (this.apiKeys.length === 1) {
      return this.apiKeys[0];
    }
    const randomIndex = Math.floor(Math.random() * this.apiKeys.length);
    return this.apiKeys[randomIndex];
  }

  private buildParams(params: Record<string, unknown>): Record<string, string> {
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          result[key] = value.join(',');
        } else {
          result[key] = String(value);
        }
      }
    }
    
    return result;
  }

  async searchNear(params: SearchNearParams): Promise<FoursquareSearchResponse> {
    const searchParams = this.buildParams({
      query: params.what,
      near: params.where,
      limit: params.limit || 5
    });

    const response = await this.client.get('/places/search', {
      params: searchParams
    });

    return response.data;
  }

  async searchNearPoint(params: SearchNearPointParams): Promise<FoursquareSearchResponse> {
    const searchParams = this.buildParams({
      query: params.what,
      ll: params.ll,
      radius: params.radius,
      limit: params.limit || 5
    });

    const response = await this.client.get('/places/search', {
      params: searchParams
    });

    return response.data;
  }

  async placeSnap(params: PlaceSnapParams): Promise<FoursquareSearchResponse> {
    const searchParams = this.buildParams({
      ll: params.ll,
      limit: params.limit || 1
    });

    const response = await this.client.get('/geotagging/candidates', {
      params: searchParams
    });

    return response.data;
  }

  async placeDetails(params: PlaceDetailsParams): Promise<FoursquarePlace> {
    const searchParams = this.buildParams({
      fields: params.fields || 'description,tel,website,social_media,hours,hours_popular,rating,price,menu,photos,tips,tastes,attributes'
    });

    const response = await this.client.get(`/places/${params.id}`, {
      params: searchParams
    });

    return response.data;
  }

  // Utility method to get approximate location based on IP (simplified version)
  async getApproximateLocation(): Promise<string> {
    try {
      // This is a simplified version - in production you might want to use a proper IP geolocation service
      const response = await axios.get('https://ipapi.co/json/', { timeout: 5000 });
      const { latitude, longitude } = response.data;
      
      if (latitude && longitude) {
        return `${latitude},${longitude} (using IP geolocation, this is an approximation)`;
      }
    } catch (error) {
      console.error('Failed to get location from IP:', error);
    }
    
    return "I don't know where you are";
  }
}