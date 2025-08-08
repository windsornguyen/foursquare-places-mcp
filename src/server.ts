import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { FoursquareClient } from './client.js';
import { ALL_TOOLS, handleToolCall } from './tools/index.js';

/**
 * Main server class for Foursquare Places MCP integration
 * @class FoursquareServer
 * @description Provides a clean, single-responsibility server implementation for Foursquare Places API
 * @author Claude Code
 * @version 1.0.0
 */
export class FoursquareServer {
    private client: FoursquareClient;
    private server: Server;

    /**
     * Creates a new FoursquareServer instance
     * @param {string[]} apiKeys - Array of Foursquare API keys for authentication and load balancing
     * @throws {Error} When API keys array is empty or contains invalid keys
     */
    constructor(apiKeys: string[]) {
        this.client = new FoursquareClient(apiKeys);
        this.server = new Server(
            {
                name: 'foursquare-places-mcp-server',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        this.setupHandlers();
        this.setupErrorHandling();
    }

    /**
     * Sets up MCP request handlers for tools
     * @private
     * @description Configures list_tools and call_tool handlers with proper error boundaries
     */
    private setupHandlers(): void {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: ALL_TOOLS,
        }));

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                return await handleToolCall(name, args, this.client);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${errorMessage}`,
                        },
                    ],
                };
            }
        });
    }

    /**
     * Configures error handling and graceful shutdown
     * @private
     * @description Sets up global error handlers and SIGINT handling for clean shutdown
     */
    private setupErrorHandling(): void {
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    /**
     * Returns the underlying MCP server instance
     * @returns {Server} MCP server instance for transport layer
     * @description Exposes server for both STDIO and HTTP transports
     */
    getServer(): Server {
        return this.server;
    }

    /**
     * Factory method for creating standalone server instances  
     * Used by HTTP transport for session-based connections
     * @param {string[]} apiKeys - Array of Foursquare API keys for authentication
     * @returns {Server} Configured MCP server instance
     * @static
     * @description Creates server instances without class overhead for HTTP transport
     */
    static createStandaloneServer(apiKeys: string[]): Server {
        const server = new Server(
            {
                name: "foursquare-places-mcp-server",
                version: "1.0.0",
            },
            {
                capabilities: {
                    tools: {},
                },
            },
        );

        const client = new FoursquareClient(apiKeys);

        // Set up handlers
        server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: ALL_TOOLS,
        }));

        server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                return await handleToolCall(name, args, client);
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${errorMessage}`,
                        },
                    ],
                };
            }
        });

        return server;
    }
}