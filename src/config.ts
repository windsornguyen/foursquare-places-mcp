import { config as loadEnv } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the universal directory (3 levels up: dist -> foursquare-places-mcp -> src -> universal)
loadEnv({ path: resolve(__dirname, '../../../.env') });

/**
 * Configuration interface for the Foursquare Places MCP Server
 * @interface Config
 * @description Complete configuration schema for server initialization and runtime behavior
 * @author Claude Code
 * @version 1.0.0
 */
export interface Config {
    /** Array of Foursquare API keys for load balancing and fallback */
    apiKeys: string[];
    /** Port number for HTTP server */
    port: number;
    /** Current environment mode */
    nodeEnv: 'development' | 'production';
    /** Convenience flag for production environment */
    isProduction: boolean;
}

/**
 * Loads Foursquare API keys from environment variables
 * Tries numbered keys first (FOURSQUARE_API_KEY_1, etc.), then fallback to single key
 * @returns {string[]} Array of valid API keys
 * @throws {Error} If no API keys are found
 * @private
 */
function loadApiKeys(): string[] {
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
    
    return keys;
}

/**
 * Loads and validates configuration from environment variables
 * @returns {Config} Validated configuration object
 * @throws {Error} If required environment variables are missing
 * @description Primary configuration loader with validation and defaults
 * @example const config = loadConfig(); // Loads from .env and environment variables
 */
export function loadConfig(): Config {
    const apiKeys = loadApiKeys();
    const nodeEnv = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    const port = parseInt(process.env.PORT || '3004', 10);

    console.log(`Loaded ${apiKeys.length} Foursquare API key(s)`);

    return {
        apiKeys,
        port,
        nodeEnv,
        isProduction: nodeEnv === 'production',
    };
}