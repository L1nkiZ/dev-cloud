import type { Request, Response, NextFunction } from 'express';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';

export interface AuthRequest extends Request {
    userId?: string;
    userEmail?: string;
    username?: string;
}

export async function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const response = await fetch(`${AUTH_SERVICE_URL}/validate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });

        if (!response.ok) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        const payload = await response.json() as { userId: string; email: string; username: string };
        req.userId = payload.userId;
        req.userEmail = payload.email;
        req.username = payload.username;
        next();
    } catch {
        res.status(401).json({ error: 'Unauthorized' });
    }
}
