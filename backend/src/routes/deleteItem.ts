import type { Request, Response } from 'express';
import db from '../persistence';

const deleteItem = async (req: Request, res: Response) => {
    await db.removeItem(req.params.id as string | number);
    res.sendStatus(200);
};

export default deleteItem;
