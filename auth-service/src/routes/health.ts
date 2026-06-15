import type { Request, Response } from 'express';

const health = (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'auth-service' });
};

export default health;
