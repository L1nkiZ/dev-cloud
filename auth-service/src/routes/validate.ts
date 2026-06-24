import type { Request, Response } from 'express';
import { verifyToken } from '../auth.js';
import { authValidateTotal } from '../metrics.js';

export const validateToken = (req: Request, res: Response) => {
    const token = req.body?.token || req.headers.authorization?.split(' ')[1];

    if (!token) {
        authValidateTotal.inc({ status: 'failure' });
        return res.status(401).json({ error: 'No token provided' });
    }

    const payload = verifyToken(token);

    if (!payload) {
        authValidateTotal.inc({ status: 'failure' });
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    authValidateTotal.inc({ status: 'success' });
    return res.status(200).json({
        userId: payload.userId,
        email: payload.email,
        username: payload.username,
    });
};
