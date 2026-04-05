import type { Request, Response } from 'express';
import db from '../persistence';

const getItems = async (req: Request, res: Response) => {
    const items = await db.getItems();
    res.send(items);
};

export = getItems;
