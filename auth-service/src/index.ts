// auth-service entry point
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import db from './persistence/index.js';
import { authMiddleware } from './middleware/auth.js';
import health from './routes/health.js';
import metricsHandler from './routes/metrics.js';
import { validateToken } from './routes/validate.js';
import { signUp, signIn, forgotPassword, resetPassword, logout, getCurrentUser } from './routes/auth.js';
import { hashPassword } from './auth.js';

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors({
    origin: ['http://localhost', 'http://localhost:5173', 'http://localhost:5174', 'http://client:5173'],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

app.get('/health', health);
app.get('/metrics', metricsHandler);

app.post('/auth/sign-up', signUp);
app.post('/auth/sign-in', signIn);
app.post('/auth/forgot-password', forgotPassword);
app.post('/auth/reset-password', resetPassword);
app.post('/auth/logout', authMiddleware, logout);
app.get('/auth/me', authMiddleware, getCurrentUser);

// Internal endpoint for inter-service token validation
app.post('/validate', validateToken);

async function seedTestUser() {
    if (process.env.NODE_ENV === 'production') return;

    const email = process.env.TEST_USER_EMAIL || 'user@example.com';
    const password = process.env.TEST_USER_PASSWORD || 'password';
    const username = process.env.TEST_USER_USERNAME || 'default user';

    const existingUser = await db.getUserByEmail(email);
    const hashedPwd = await hashPassword(password);

    if (existingUser) {
        await db.updatePassword(existingUser.id, hashedPwd);
        console.log(`[Test user] Updated password for: ${email}`);
        return;
    }

    await db.createUser(email, hashedPwd, username);
    console.log(`[Test user] Created: ${email}`);
}

db.init()
    .then(async () => {
        await seedTestUser();
        app.listen(port, '0.0.0.0', () => console.log(`[Auth-Service] Listening on port ${port}`));
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
