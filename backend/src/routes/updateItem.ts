import type { Request, Response } from 'express';
import db from '../persistence/index';

const updateItem = async (req: Request, res: Response) => {
    const id = req.params.id as string | number;

    await db.updateItem(id, {
        name: req.body.name,
        completed: req.body.completed,
    });
    const item = await db.getItem(id);
    res.send(item);
};

export = updateItem;
