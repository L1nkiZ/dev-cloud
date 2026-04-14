import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import db from '../persistence/index';

const updateItem = async (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const id = req.params.id as string | number;

    await db.updateItem(id, {
        name: req.body.name,
        completed: req.body.completed,
    }, req.userId);
    const item = await db.getItem(id, req.userId);
    res.send(item);
};

export default updateItem;
