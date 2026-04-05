import type { Request, Response } from 'express';

const GREETING = 'Hello world!';

const getGreeting = async (req: Request, res: Response) => {
    res.send({
        greeting: GREETING,
    });
};

export = getGreeting;