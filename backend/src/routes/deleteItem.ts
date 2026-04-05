import type { Request, Response } from 'express';
import type { TodoPersistence } from '../types';

const db = require('../persistence') as TodoPersistence;

const deleteItem = async (req: Request, res: Response) => {
    await db.removeItem(req.params.id as string | number);
    res.sendStatus(200);
};

export = deleteItem;