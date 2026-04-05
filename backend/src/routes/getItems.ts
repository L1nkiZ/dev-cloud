import type { Request, Response } from 'express';
import type { TodoPersistence } from '../types';

const db = require('../persistence') as TodoPersistence;

const getItems = async (req: Request, res: Response) => {
    const items = await db.getItems();
    res.send(items);
};

export = getItems;