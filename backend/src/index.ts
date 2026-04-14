import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import db from './persistence/index.js';
import { authMiddleware } from './middleware/auth.js';
import getGreeting from './routes/getGreeting.js';
import getItems from './routes/getItems.js';
import addItem from './routes/addItem.js';
import updateItem from './routes/updateItem.js';
import deleteItem from './routes/deleteItem.js';
import { signUp, signIn, forgotPassword, resetPassword, logout, getCurrentUser } from './routes/auth.js';

const app = express();

const port = Number(process.env.PORT || 3000);

app.use(cors({
    origin: ['http://localhost', 'http://localhost:5173', 'http://localhost:5174', 'http://client:5173'], // URLs du frontend (local + Docker)
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(express.static('src/static'));

// Auth routes (public)
app.post('/api/auth/sign-up', signUp);
app.post('/api/auth/sign-in', signIn);
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password', resetPassword);
app.post('/api/auth/logout', authMiddleware, logout);
app.get('/api/auth/me', authMiddleware, getCurrentUser);

// Protected TODO routes
app.get('/api/greeting', authMiddleware, getGreeting);
app.get('/api/items', authMiddleware, getItems);
app.post('/api/items', authMiddleware, addItem);
app.put('/api/items/:id', authMiddleware, updateItem);
app.delete('/api/items/:id', authMiddleware, deleteItem);

db.init()
    .then(() => {
        app.listen(port, '0.0.0.0', () => console.log(`Listening on port ${port}`));
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
process.on('SIGUSR2', gracefulShutdown); // Sent by nodemon
