import type { Request, Response } from 'express';
import { register } from '../metrics.js';

const metricsHandler = async (_req: Request, res: Response) => {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
};

export default metricsHandler;
