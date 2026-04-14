import type { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../auth.js';

export interface AuthRequest extends Request {
    userId?: string;
    userEmail?: string;
    username?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
    try {
        // Get token from cookies or Authorization header
        const token = req.cookies?.token || req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const payload = verifyToken(token);

        if (!payload) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.userId = payload.userId;
        req.userEmail = payload.email;
        req.username = payload.username;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Unauthorized' });
    }
}
