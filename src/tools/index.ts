import { FoursquareClient } from '../client.js';
import {
    ALL_TOOLS,
    handleSearchNear,
    handleSearchNearPoint,
    handlePlaceSnap,
    handlePlaceDetails,
    handleGetLocation
} from './places.js';

// Export tool definitions for server registration
export { ALL_TOOLS };

/**
 * Main tool dispatcher for all Foursquare Places tools
 * @param {string} toolName - Name of the tool to execute
 * @param {unknown} args - Tool arguments to be validated by individual handlers
 * @param {FoursquareClient} client - Foursquare API client instance
 * @returns {Promise<Object>} Tool execution result with formatted content
 * @throws {Error} If tool name is unknown or execution fails
 * @description Routes tool calls to appropriate handlers with centralized error handling
 */
export async function handleToolCall(
    toolName: string,
    args: unknown,
    client: FoursquareClient
): Promise<{ content: Array<{ type: string; text: string }> }> {
    switch (toolName) {
        case 'search_near':
            return handleSearchNear(args, client);

        case 'search_near_point':
            return handleSearchNearPoint(args, client);

        case 'place_snap':
            return handlePlaceSnap(args, client);

        case 'place_details':
            return handlePlaceDetails(args, client);

        case 'get_location':
            return handleGetLocation(args, client);

        default:
            throw new Error(`Unknown tool: ${toolName}. Available tools: ${ALL_TOOLS.map(t => t.name).join(', ')}`);
    }
}