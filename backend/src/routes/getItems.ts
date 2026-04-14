import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import db from '../persistence';

const getItems = async (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const items = await db.getItems(req.userId);
    res.send(items);
};

export default getItems;
