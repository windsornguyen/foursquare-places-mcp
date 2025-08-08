#!/usr/bin/env node

import { loadConfig } from './config.js';
import { parseArgs } from './cli.js';
import { FoursquareServer } from './server.js';
import { runStdioTransport, startHttpTransport } from './transport/index.js';

/**
 * Main entry point for the Foursquare Places MCP Server
 * @description Orchestrates server startup with intelligent transport selection
 * @author Claude Code
 * @version 1.0.0
 * 
 * Transport selection logic:
 * 1. --stdio flag forces STDIO transport (for MCP clients like Claude Desktop)
 * 2. --port flag or PORT env var triggers HTTP transport (for cloud deployment)
 * 3. Default: STDIO for local development and testing
 * 
 * @example
 * // STDIO mode (default)
 * node dist/index.js
 * 
 * // HTTP mode  
 * node dist/index.js --port 3004
 * 
 * // Force STDIO even with PORT env var
 * node dist/index.js --stdio
 */
async function main() {
    try {
        const config = loadConfig();
        const cliOptions = parseArgs();
        
        // Determine transport mode
        const shouldUseHttp = cliOptions.port || (process.env.PORT && !cliOptions.stdio);
        const port = cliOptions.port || config.port;
        
        if (shouldUseHttp) {
            // HTTP transport for production/cloud deployment
            startHttpTransport({ ...config, port });
        } else {
            // STDIO transport for local development
            const server = new FoursquareServer(config.apiKeys);
            await runStdioTransport(server.getServer());
        }
    } catch (error) {
        console.error("Fatal error running Foursquare Places server:", error);
        process.exit(1);
    }
}

// Run the server
main();