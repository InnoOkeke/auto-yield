import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import frameRoutes from './routes/frame.js';
import apiRoutes from './routes/api.js';
import aiRoutes from './routes/ai.js';
import notificationRoutes from './routes/notifications.js';
import farcasterRoutes from './routes/farcaster.js';
import { startCronJobs } from './cron/index.js';
import { initializeDatabase } from './utils/database.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/frame', frameRoutes);
app.use('/api', apiRoutes);
app.use('/api/chat', aiRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/farcaster', farcasterRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined,
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
async function start() {
    try {
        // Initialize database connection
        await initializeDatabase();
        console.log('✅ Database connected');

        // Start cron jobs
        if (process.env.NODE_ENV !== 'test') {
            startCronJobs();
            console.log('✅ Cron jobs started');
        }

        app.listen(PORT, () => {
            console.log(`🚀 AutoYield Backend running on port ${PORT}`);
            console.log(`📍 Frame URL: ${process.env.FRAME_BASE_URL}/frame`);
            console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

start();
