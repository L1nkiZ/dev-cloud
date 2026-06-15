import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { createProxyMiddleware } from 'http-proxy-middleware';
import db from './persistence/index.js';
import { authMiddleware } from './middleware/auth.js';
import getGreeting from './routes/getGreeting.js';
import getItems from './routes/getItems.js';
import addItem from './routes/addItem.js';
import updateItem from './routes/updateItem.js';
import deleteItem from './routes/deleteItem.js';
import health from './routes/health.js';
import metricsHandler from './routes/metrics.js';

const app = express();
const port = Number(process.env.PORT || 3000);
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

app.use(cors({
    origin: ['http://localhost', 'http://localhost:5173', 'http://localhost:5174', 'http://client:5173'],
    credentials: true
}));
app.use(cookieParser());

// Proxy /api/auth/* → auth-service /auth/*
// Express strips /api/auth before the proxy sees the path, so we prepend /auth back
app.use('/api/auth', createProxyMiddleware({
    target: AUTH_SERVICE_URL,
    changeOrigin: true,
    pathRewrite: (path) => `/auth${path}`,
}));

app.use(express.json());

// Public routes
app.get('/api/health', health);
app.get('/metrics', metricsHandler);

// Protected TODO routes
app.get('/api/greeting', authMiddleware, getGreeting);
app.get('/api/items', authMiddleware, getItems);
app.post('/api/items', authMiddleware, addItem);
app.put('/api/items/:id', authMiddleware, updateItem);
app.delete('/api/items/:id', authMiddleware, deleteItem);

db.init()
    .then(() => {
        app.listen(port, '0.0.0.0', () => console.log(`[Todo-Service] Listening on port ${port}`));
    })
    .catch((err: unknown) => {
        console.error(err);
        process.exit(1);
    });

const gracefulShutdown = () => {
    db.teardown()
        .catch(() => {})
        .then(() => process.exit());
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown);
