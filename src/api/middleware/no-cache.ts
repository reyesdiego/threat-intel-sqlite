import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to disable HTTP caching
 * Ensures that responses are not cached by browsers or proxies
 */
export const noCache = (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
};
