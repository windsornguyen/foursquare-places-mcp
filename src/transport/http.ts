import { createServer, IncomingMessage, ServerResponse } from 'http';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { randomUUID } from 'crypto';
import { FoursquareServer } from '../server.js';
import { Config } from '../config.js';

/** Session storage for streamable HTTP connections */
const streamableSessions = new Map<string, { transport: StreamableHTTPServerTransport; server: any }>();

/**
 * Starts the HTTP transport server with both SSE and Streamable HTTP support
 * @param {Config} config - Server configuration
 */
export function startHttpTransport(config: Config): void {
    const httpServer = createServer();

    httpServer.on('request', async (req, res) => {
        const url = new URL(req.url!, `http://${req.headers.host}`);

        switch (url.pathname) {
            case '/sse':
                await handleSSE(req, res, config);
                break;
            case '/mcp':
                await handleStreamable(req, res, config);
                break;
            case '/health':
                handleHealthCheck(res);
                break;
            default:
                handleNotFound(res);
        }
    });

    const host = config.isProduction ? '0.0.0.0' : 'localhost';
    
    httpServer.listen(config.port, host, () => {
        logServerStart(config);
    });
}

/**
 * Handles Server-Sent Events (SSE) transport
 * @param {IncomingMessage} req - HTTP request
 * @param {ServerResponse} res - HTTP response
 * @param {Config} config - Server configuration
 * @returns {Promise<void>}
 * @private
 */
async function handleSSE(
    req: IncomingMessage,
    res: ServerResponse,
    config: Config
): Promise<void> {
    const serverInstance = FoursquareServer.createStandaloneServer(config.apiKeys);
    const transport = new SSEServerTransport('/sse', res);
    try {
        await serverInstance.connect(transport);
    } catch (error) {
        console.error('SSE connection error:', error);
    }
}

/**
 * Handles Streamable HTTP protocol requests
 * @param {IncomingMessage} req - HTTP request
 * @param {ServerResponse} res - HTTP response
 * @param {Config} config - Server configuration
 * @returns {Promise<void>}
 * @private
 */
async function handleStreamable(
    req: IncomingMessage,
    res: ServerResponse,
    config: Config
): Promise<void> {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;

    if (sessionId) {
        const session = streamableSessions.get(sessionId);
        if (!session) {
            res.statusCode = 404;
            res.end('Session not found');
            return;
        }
        return await session.transport.handleRequest(req, res);
    }

    if (req.method === 'POST') {
        await createNewSession(req, res, config);
        return;
    }

    res.statusCode = 400;
    res.end('Invalid request');
}

/**
 * Creates a new MCP session for Streamable HTTP transport
 * @param {IncomingMessage} req - HTTP request
 * @param {ServerResponse} res - HTTP response
 * @param {Config} config - Server configuration
 * @returns {Promise<void>}
 * @private
 */
async function createNewSession(
    req: IncomingMessage,
    res: ServerResponse,
    config: Config
): Promise<void> {
    const serverInstance = FoursquareServer.createStandaloneServer(config.apiKeys);
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
        res.statusCode = 500;
        res.end('Internal server error');
    }
}

/**
 * Handles health check endpoint
 * @param {ServerResponse} res - HTTP response
 * @private
 */
function handleHealthCheck(res: ServerResponse): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
        status: 'healthy', 
        service: 'foursquare-places-mcp',
        timestamp: new Date().toISOString() 
    }));
}

/**
 * Handles 404 Not Found responses
 * @param {ServerResponse} res - HTTP response
 * @private
 */
function handleNotFound(res: ServerResponse): void {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
}

/**
 * Logs server startup information
 * @param {Config} config - Server configuration
 * @private
 */
function logServerStart(config: Config): void {
    const displayUrl = config.isProduction 
        ? `Port ${config.port}` 
        : `http://localhost:${config.port}`;
    
    console.log(`Foursquare Places MCP Server listening on ${displayUrl}`);

    if (!config.isProduction) {
        console.log('Put this in your client config:');
        console.log(JSON.stringify({
            "mcpServers": {
                "foursquare-places": {
                    "url": `http://localhost:${config.port}/sse`
                }
            }
        }, null, 2));
        console.log('If your client supports streamable HTTP, you can use the /mcp endpoint instead.');
    }
}