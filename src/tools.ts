import { Tool } from '@modelcontextprotocol/sdk/types.js';

export const SEARCH_NEAR_TOOL: Tool = {
  name: 'search_near',
  description: 'Search for places near a particular named region using Foursquare Places API. Returns up to 5 places with details like name, address, categories, and distance.',
  inputSchema: {
    type: 'object',
    properties: {
      where: {
        type: 'string',
        minLength: 1,
        description: 'A geographic region to search near (e.g., "Los Angeles", "Fort Greene", "Brooklyn", "Times Square")'
      },
      what: {
        type: 'string',
        minLength: 1,
        description: 'Concept you are looking for (e.g., "coffee shop", "Hard Rock Cafe", "pizza", "gym", "hotel")'
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        default: 5,
        description: 'Number of results to return (default: 5)'
      }
    },
    required: ['where', 'what']
  }
};

export const SEARCH_NEAR_POINT_TOOL: Tool = {
  name: 'search_near_point',
  description: 'Search for places near a specific latitude/longitude coordinate using Foursquare Places API. More precise than searching by named region.',
  inputSchema: {
    type: 'object',
    properties: {
      what: {
        type: 'string',
        minLength: 1,
        description: 'Concept you are looking for (e.g., "coffee shop", "Hard Rock Cafe", "pizza", "gym", "hotel")'
      },
      ll: {
        type: 'string',
        pattern: '^-?\\d+\\.?\\d*,-?\\d+\\.?\\d*$',
        description: 'Comma-separated latitude and longitude pair (e.g., "40.74,-74.0", "37.7749,-122.4194")'
      },
      radius: {
        type: 'integer',
        minimum: 1,
        maximum: 100000,
        default: 1000,
        description: 'Search radius in meters (default: 1000m = 1km)'
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 50,
        default: 5,
        description: 'Number of results to return (default: 5)'
      }
    },
    required: ['what', 'll']
  }
};

export const PLACE_SNAP_TOOL: Tool = {
  name: 'place_snap',
  description: 'Get the most likely place the user is at based on their reported location using Foursquare\'s Place Snap technology. Ideal for "where am I?" queries.',
  inputSchema: {
    type: 'object',
    properties: {
      ll: {
        type: 'string',
        pattern: '^-?\\d+\\.?\\d*,-?\\d+\\.?\\d*$',
        description: 'Comma-separated latitude and longitude pair of user\'s location (e.g., "40.74,-74.0")'
      },
      limit: {
        type: 'integer',
        minimum: 1,
        maximum: 10,
        default: 1,
        description: 'Number of candidate places to return (default: 1)'
      }
    },
    required: ['ll']
  }
};

export const PLACE_DETAILS_TOOL: Tool = {
  name: 'place_details',
  description: 'Get comprehensive details about a specific place using its Foursquare ID (fsq_id). Includes description, contact info, hours, rating, price, photos, reviews, and features.',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        minLength: 1,
        description: 'Foursquare place ID (fsq_id) obtained from search results'
      },
      fields: {
        type: 'string',
        description: 'Comma-separated list of fields to include. Available: description,tel,website,social_media,hours,hours_popular,rating,price,menu,photos,tips,tastes,attributes. Default includes all fields.',
        default: 'description,tel,website,social_media,hours,hours_popular,rating,price,menu,photos,tips,tastes,attributes'
      }
    },
    required: ['id']
  }
};

export const GET_LOCATION_TOOL: Tool = {
  name: 'get_location',
  description: 'Get user\'s approximate location based on their IP address. Useful when the user hasn\'t provided their precise location. Returns latitude,longitude coordinates or indicates location cannot be determined.',
  inputSchema: {
    type: 'object',
    properties: {},
    required: []
  }
};

export const ALL_TOOLS: Tool[] = [
  SEARCH_NEAR_TOOL,
  SEARCH_NEAR_POINT_TOOL,
  PLACE_SNAP_TOOL,
  PLACE_DETAILS_TOOL,
  GET_LOCATION_TOOL
];