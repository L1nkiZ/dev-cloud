import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';

const getGreeting = async (req: AuthRequest, res: Response) => {
    const name = req.username || 'world';
    res.send({
        greeting: `Hello ${name}!`,
    });
};

export default getGreeting;
