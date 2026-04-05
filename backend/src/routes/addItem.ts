import type { Request, Response } from 'express';
import { v4 as uuid } from 'uuid';
import type { TodoPersistence } from '../types';

const db = require('../persistence') as TodoPersistence;

const addItem = async (req: Request, res: Response) => {
    const item = {
        id: uuid(),
        name: req.body.name,
        completed: false,
    };

    await db.storeItem(item);
    res.send(item);
};

export = addItem;