import type { Request, Response } from 'express';

const health = (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok' });
};

export default health;
