const express = require('express');
require('dotenv').config();
const authRoutes = require('./routes/auth.js');
const noteRoutes = require('./routes/notes.js');
const app = express();
const cors = require('cors');
const isAuthenticated = require('./middlewares/parseCookie');
const { initializeDatabase } = require('../database');
const cookieParser = require('cookie-parser');
const logger = require('./utils/logger');

// Log uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', {
        error: error.message,
        stack: error.stack
    });
    // Give the logger time to write before exiting
    setTimeout(() => process.exit(1), 1000);
});

// Log unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection:', {
        reason: reason,
        stack: reason?.stack
    });
});

app.use(express.json());

// Configure CORS
const allowedOrigins = [
    'http://localhost:5501',
    'http://127.0.0.1:5501',
    'http://192.168.57.146:5173',
    'http://192.168.57.23:5173',
    'http://127.0.0.1:5500',
    'http://localhost:5500',
    'http://localhost:5173',
    'https://noteapp.web.app-dev.site',
    'https://www.noteapp.web.app.site',
];

// Log CORS issues
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            logger.warn('CORS policy violation attempt:', { origin });
            callback(new Error('CORS policy violation'), false);
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Add OPTIONS handling for preflight requests
app.options('*', cors());

app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
    logger.info('Incoming request:', {
        method: req.method,
        path: req.path,
        query: req.query,
        ip: req.ip
    });
    next();
});

app.use('/auth', authRoutes);
app.use(isAuthenticated);
app.use('/api', noteRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
    logger.error('Express error:', {
        error: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });
    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong!'
    });
});

const port = process.env.PORT || 3455;

app.listen(port, async () => {
    try {
        await initializeDatabase();
        logger.info('Server started successfully', {
            port,
            nodeEnv: process.env.NODE_ENV,
            time: new Date().toISOString()
        });
    } catch (error) {
        logger.error('Failed to start server:', {
            error: error.message,
            stack: error.stack
        });
        process.exit(1);
    }
});





