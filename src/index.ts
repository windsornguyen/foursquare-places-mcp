#!/usr/bin/env node

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the universal directory (3 levels up: dist -> foursquare-places-mcp -> src -> universal)
config({ path: resolve(__dirname, '../../../.env') });

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { createServer } from 'http';
import { randomUUID } from 'crypto';
import { FoursquareClient } from './client.js';
import { ALL_TOOLS } from './tools.js';
import {
  SearchNearParamsSchema,
  SearchNearPointParamsSchema,
  PlaceSnapParamsSchema,
  PlaceDetailsParamsSchema,
} from './types.js';

// Get API keys from environment variables
const getApiKeys = (): string[] => {
  const keys: string[] = [];
  
  // Try numbered keys first (FOURSQUARE_API_KEY_1, etc.)
  for (let i = 1; i <= 10; i++) {
    const key = process.env[`FOURSQUARE_API_KEY_${i}`];
    if (key) {
      keys.push(key);
    }
  }
  
  // Fallback to single key
  const singleKey = process.env.FOURSQUARE_API_KEY || process.env.FOURSQUARE_SERVICE_TOKEN;
  if (singleKey && keys.length === 0) {
    keys.push(singleKey);
  }
  
  if (keys.length === 0) {
    throw new Error('At least one Foursquare API key is required. Set FOURSQUARE_API_KEY or FOURSQUARE_API_KEY_1, FOURSQUARE_API_KEY_2, etc.');
  }
  
  console.log(`Loaded ${keys.length} Foursquare API key(s)`);
  return keys;
};

const apiKeys = getApiKeys();
const client = new FoursquareClient(apiKeys);

class FoursquareMCPServer {
  private server: Server;
  private client: FoursquareClient;

  constructor() {
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

    this.client = client;
    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: ALL_TOOLS,
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'search_near': {
            const params = SearchNearParamsSchema.parse(args);
            const result = await this.client.searchNear(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'search_near_point': {
            const params = SearchNearPointParamsSchema.parse(args);
            const result = await this.client.searchNearPoint(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'place_snap': {
            const params = PlaceSnapParamsSchema.parse(args);
            const result = await this.client.placeSnap(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'place_details': {
            const params = PlaceDetailsParamsSchema.parse(args);
            const result = await this.client.placeDetails(params);
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(result, null, 2),
                },
              ],
            };
          }

          case 'get_location': {
            const result = await this.client.getApproximateLocation();
            return {
              content: [
                {
                  type: 'text',
                  text: result,
                },
              ],
            };
          }

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
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

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Foursquare Places MCP Server running on stdio');
  }
}

// Parse command line arguments
function parseArgs() {
  const args = process.argv.slice(2);
  const options: { port?: number; headless?: boolean } = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--port' && i + 1 < args.length) {
      options.port = parseInt(args[i + 1]!, 10);
      i++;
    } else if (args[i] === '--headless') {
      options.headless = true;
    }
  }
  
  return options;
}

// Session storage for streamable HTTP
const streamableSessions = new Map<string, {transport: any, server: any}>();

// Create a new server instance
function createFoursquareServerInstance() {
  const serverInstance = new Server(
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

  serverInstance.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: ALL_TOOLS,
    };
  });

  serverInstance.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case 'search_near': {
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
        }

        case 'search_near_point': {
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
        }

        case 'place_snap': {
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
        }

        case 'place_details': {
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
        }

        case 'get_location': {
          const result = await client.getApproximateLocation();
          return {
            content: [
              {
                type: 'text',
                text: result,
              },
            ],
          };
        }

        default:
          throw new Error(`Unknown tool: ${name}`);
      }
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

  return serverInstance;
}

// HTTP server setup
function startHttpServer(port: number) {
  const httpServer = createServer();
  
  httpServer.on('request', async (req, res) => {
    const url = new URL(req.url!, `http://${req.headers.host}`);
    
    if (url.pathname === '/sse') {
      await handleSSE(req, res);
    } else if (url.pathname === '/mcp') {
      await handleStreamable(req, res);
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    }
  });
  
  httpServer.listen(port, () => {
    console.log(`Foursquare Places MCP Server listening on http://localhost:${port}`);
    console.log('Put this in your client config:');
    console.log(JSON.stringify({
      "mcpServers": {
        "foursquare-places": {
          "url": `http://localhost:${port}/sse`
        }
      }
    }, null, 2));
    console.log('If your client supports streamable HTTP, you can use the /mcp endpoint instead.');
  });
  
  return httpServer;
}

// SSE transport handler
async function handleSSE(_req: any, res: any) {
  const serverInstance = createFoursquareServerInstance();
  const transport = new SSEServerTransport('/sse', res);
  try {
    await serverInstance.connect(transport);
  } catch (error) {
    console.error('SSE connection error:', error);
  }
}

// Streamable HTTP transport handler
async function handleStreamable(req: any, res: any) {
  const sessionId = req.headers['mcp-session-id'] as string | undefined;
  
  if (sessionId) {
    // Use existing session
    const session = streamableSessions.get(sessionId);
    if (!session) {
      res.statusCode = 404;
      res.end('Session not found');
      return;
    }
    return await session.transport.handleRequest(req, res);
  }
  
  // Create new session for initialization
  if (req.method === 'POST') {
    const serverInstance = createFoursquareServerInstance();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (sessionId) => {
        streamableSessions.set(sessionId, { transport, server: serverInstance });
        console.log('New Foursquare Places session created:', sessionId);
      }
    });
    
    transport.onclose = () => {
      if (transport.sessionId) {
        streamableSessions.delete(transport.sessionId);
        console.log('Foursquare Places session closed:', transport.sessionId);
      }
    };
    
    try {
      await serverInstance.connect(transport);
      await transport.handleRequest(req, res);
    } catch (error) {
      console.error('Streamable HTTP connection error:', error);
    }
    return;
  }
  
  res.statusCode = 400;
  res.end('Invalid request');
}

// Main server function
async function runServer() {
  const options = parseArgs();
  
  if (options.port) {
    // HTTP mode
    startHttpServer(options.port);
  } else {
    // STDIO mode (default)
    const server = new FoursquareMCPServer();
    await server.run();
  }
}

runServer().catch((error) => {
  console.error("Fatal error running Foursquare Places server:", error);
  process.exit(1);
});