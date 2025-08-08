import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { FoursquareClient } from '../client.js';
import {
    SearchNearParamsSchema,
    SearchNearPointParamsSchema,
    PlaceSnapParamsSchema,
    PlaceDetailsParamsSchema,
} from '../types.js';

/**
 * Tool definition for searching places near a named region
 * @constant {Tool}
 * @description Searches for places using Foursquare's search API with location names
 */
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

/**
 * Tool definition for searching places near specific coordinates
 * @constant {Tool}
 * @description Provides precise location-based search using latitude/longitude coordinates
 */
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

/**
 * Tool definition for place snap functionality
 * @constant {Tool}
 * @description Identifies the most likely place at a specific coordinate using Foursquare's Place Snap
 */
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

/**
 * Tool definition for getting detailed place information
 * @constant {Tool}
 * @description Retrieves comprehensive details for a specific place using its Foursquare ID
 */
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

/**
 * Tool definition for getting user's approximate location
 * @constant {Tool}
 * @description Provides IP-based location approximation for location-aware searches
 */
export const GET_LOCATION_TOOL: Tool = {
    name: 'get_location',
    description: 'Get user\'s approximate location based on their IP address. Useful when the user hasn\'t provided their precise location. Returns latitude,longitude coordinates or indicates location cannot be determined.',
    inputSchema: {
        type: 'object',
        properties: {},
        required: []
    }
};

/**
 * Array of all available tools
 * @constant {Tool[]}
 * @description Complete registry of Foursquare Places API tools
 */
export const ALL_TOOLS: Tool[] = [
    SEARCH_NEAR_TOOL,
    SEARCH_NEAR_POINT_TOOL,
    PLACE_SNAP_TOOL,
    PLACE_DETAILS_TOOL,
    GET_LOCATION_TOOL
];

/**
 * Handles tool execution for search_near functionality
 * @param {any} args - Tool arguments validated by schema
 * @param {FoursquareClient} client - Foursquare API client instance
 * @returns {Promise<Object>} Formatted tool response with search results
 * @throws {Error} When search parameters are invalid or API request fails
 */
export async function handleSearchNear(
    args: any,
    client: FoursquareClient
): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
        const params = SearchNearParamsSchema.parse(args);
        const result = await client.searchNear(params);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error) {
        if (error instanceof Error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error.message}`,
                    },
                ],
                isError: true,
            } as any;
        }
        throw error;
    }
}

/**
 * Handles tool execution for search_near_point functionality
 * @param {any} args - Tool arguments validated by schema
 * @param {FoursquareClient} client - Foursquare API client instance
 * @returns {Promise<Object>} Formatted tool response with search results
 * @throws {Error} When search parameters are invalid or API request fails
 */
export async function handleSearchNearPoint(
    args: any,
    client: FoursquareClient
): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
        const params = SearchNearPointParamsSchema.parse(args);
        const result = await client.searchNearPoint(params);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error) {
        if (error instanceof Error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error.message}`,
                    },
                ],
                isError: true,
            } as any;
        }
        throw error;
    }
}

/**
 * Handles tool execution for place_snap functionality
 * @param {any} args - Tool arguments validated by schema
 * @param {FoursquareClient} client - Foursquare API client instance
 * @returns {Promise<Object>} Formatted tool response with place identification results
 * @throws {Error} When snap parameters are invalid or API request fails
 */
export async function handlePlaceSnap(
    args: any,
    client: FoursquareClient
): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
        const params = PlaceSnapParamsSchema.parse(args);
        const result = await client.placeSnap(params);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error) {
        if (error instanceof Error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error.message}`,
                    },
                ],
                isError: true,
            } as any;
        }
        throw error;
    }
}

/**
 * Handles tool execution for place_details functionality
 * @param {any} args - Tool arguments validated by schema
 * @param {FoursquareClient} client - Foursquare API client instance
 * @returns {Promise<Object>} Formatted tool response with detailed place information
 * @throws {Error} When place ID is invalid or API request fails
 */
export async function handlePlaceDetails(
    args: any,
    client: FoursquareClient
): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
        const params = PlaceDetailsParamsSchema.parse(args);
        const result = await client.placeDetails(params);
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(result, null, 2),
                },
            ],
        };
    } catch (error) {
        if (error instanceof Error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error.message}`,
                    },
                ],
                isError: true,
            } as any;
        }
        throw error;
    }
}

/**
 * Handles tool execution for get_location functionality
 * @param {any} args - Tool arguments (empty for this tool)
 * @param {FoursquareClient} client - Foursquare API client instance
 * @returns {Promise<Object>} Formatted tool response with approximate location
 * @throws {Error} When location service is unavailable
 */
export async function handleGetLocation(
    args: any,
    client: FoursquareClient
): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
        const result = await client.getApproximateLocation();
        return {
            content: [
                {
                    type: 'text',
                    text: result,
                },
            ],
        };
    } catch (error) {
        if (error instanceof Error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${error.message}`,
                    },
                ],
                isError: true,
            } as any;
        }
        throw error;
    }
}