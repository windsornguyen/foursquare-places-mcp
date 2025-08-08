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

/**
 * Foursquare Places API client with support for multiple API keys and automatic load balancing
 * @class FoursquareClient
 * @description Provides a robust interface to Foursquare Places API with built-in error handling,
 * rate limit management, and support for multiple API keys for better reliability
 * @author Claude Code
 * @version 1.0.0
 * @since 1.0.0
 */
export class FoursquareClient {
  private client: AxiosInstance;
  private apiKeys: string[];

  /**
   * Creates a new FoursquareClient instance
   * @param {string | string[]} apiKeys - Single API key or array of API keys for load balancing
   * @throws {Error} When no valid API keys are provided
   * @description Initializes client with axios instance and configures automatic key rotation
   */
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

  /**
   * Selects a random API key from the configured keys
   * @returns {string} Randomly selected API key
   * @private
   * @description Implements simple load balancing across multiple API keys
   */
  private getRandomApiKey(): string {
    if (this.apiKeys.length === 1) {
      return this.apiKeys[0];
    }
    const randomIndex = Math.floor(Math.random() * this.apiKeys.length);
    return this.apiKeys[randomIndex];
  }

  /**
   * Converts parameter object to string-based query parameters
   * @param {Record<string, unknown>} params - Parameters to convert
   * @returns {Record<string, string>} String-based parameters suitable for HTTP requests
   * @private
   * @description Handles arrays and type conversion for API compatibility
   */
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

  /**
   * Search for places near a named location
   * @param {SearchNearParams} params - Search parameters including location and query
   * @returns {Promise<FoursquareSearchResponse>} Search results with places and context
   * @throws {Error} When API request fails or parameters are invalid
   * @description Uses Foursquare's text-based location search
   */
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

  /**
   * Search for places near specific coordinates
   * @param {SearchNearPointParams} params - Search parameters with lat/lng and query
   * @returns {Promise<FoursquareSearchResponse>} Search results with places and context
   * @throws {Error} When API request fails or parameters are invalid
   * @description More precise than text-based search, uses exact coordinates
   */
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

  /**
   * Identify the most likely place at specific coordinates
   * @param {PlaceSnapParams} params - Snap parameters with user location
   * @returns {Promise<FoursquareSearchResponse>} Most likely places at the coordinates
   * @throws {Error} When API request fails or coordinates are invalid
   * @description Uses Foursquare's Place Snap technology for location identification
   */
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

  /**
   * Get detailed information about a specific place
   * @param {PlaceDetailsParams} params - Details parameters with place ID and fields
   * @returns {Promise<FoursquarePlace>} Comprehensive place information
   * @throws {Error} When API request fails or place ID is invalid
   * @description Retrieves full place data including hours, photos, reviews, and more
   */
  async placeDetails(params: PlaceDetailsParams): Promise<FoursquarePlace> {
    const searchParams = this.buildParams({
      fields: params.fields || 'description,tel,website,social_media,hours,hours_popular,rating,price,menu,photos,tips,tastes,attributes'
    });

    const response = await this.client.get(`/places/${params.id}`, {
      params: searchParams
    });

    return response.data;
  }

  /**
   * Get user's approximate location based on IP address
   * @returns {Promise<string>} Location string or error message
   * @description Fallback method for location-aware features when GPS unavailable
   * @example "40.7128,-74.0060 (using IP geolocation, this is an approximation)"
   */
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