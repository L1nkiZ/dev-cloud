import type { Response } from 'express';
import type { AuthRequest } from '../middleware/auth.js';
import db from '../persistence/index.js';
import { todoOperationsTotal } from '../metrics.js';

const deleteItem = async (req: AuthRequest, res: Response) => {
    if (!req.userId) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    await db.removeItem(req.params.id as string | number, req.userId);
    todoOperationsTotal.inc({ operation: 'delete' });
    res.sendStatus(200);
};

export default deleteItem;
