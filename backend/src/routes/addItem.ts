import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import { v4 as uuid } from 'uuid';
import db from '../persistence/index.js';

const addItem = async (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const item = {
        id: uuid(),
        name: req.body.name,
        completed: false,
        userId: req.userId,
    };

    await db.storeItem(item);
    res.send(item);
};

export default addItem;
