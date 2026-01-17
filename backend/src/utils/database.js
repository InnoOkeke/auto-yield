/**
 * Database client - Convex
 * Migrated from PostgreSQL/Prisma to Convex
 */

import { ConvexHttpClient } from 'convex/browser';
import { api } from '../../convex/_generated/api.js';

// Initialize Convex client
const convexUrl = process.env.CONVEX_URL || 'http://127.0.0.1:3210';
const convex = new ConvexHttpClient(convexUrl);

// Re-export api for direct access
export { api };

export async function initializeDatabase() {
    try {
        // Test connection by querying stats
        await convex.query(api.stats.getStats);
        console.log('✅ Convex database connection established');
        console.log('📍 Connected to:', convexUrl);
    } catch (error) {
        console.error('❌ Failed to connect to Convex:', error);
        throw error;
    }
}

export async function disconnectDatabase() {
    // Convex HTTP client doesn't need explicit disconnect
    console.log('Convex client closed');
}

// Export the convex client as default (replacing prisma)
export default convex;
