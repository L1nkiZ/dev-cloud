import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import db from '../persistence/index';
import { todoOperationsTotal } from '../metrics.js';

const getItems = async (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    const items = await db.getItems(req.userId);
    todoOperationsTotal.inc({ operation: 'list' });
    res.send(items);
};

export default getItems;
