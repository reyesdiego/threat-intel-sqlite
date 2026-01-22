import { Request, Response, NextFunction } from 'express';
import { DashboardSummary, getDashboardData, DEFAULT_RANGE, TIME_RANGE_MAPPING } from '../data/dashboard';
import { WrongParameters } from '../api/errors/http-errors';
import redis from '../data/database/redis';

// Cache TTL in seconds (300 -> 5 minutes)
const CACHE_TTL = 300;

/**
 * Get dashboard summary
 * GET /api/dashboard/summary
 */
export const getDashboardSummary = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const timeRange = (req.query.time_range as string) || DEFAULT_RANGE;

        if (!(timeRange in TIME_RANGE_MAPPING)) {
            throw new WrongParameters(
                `Invalid time_range. Must be one of: ${Object.keys(TIME_RANGE_MAPPING).join(', ')}`,
                { time_range: timeRange }
            );
        }

        // Cache key based on time range
        const cacheKey = `dashboard:summary:${timeRange}`;

        try {
            const cachedData = await redis.get(cacheKey);
            if (cachedData) {
                return res.header('cached', 'redis').json(JSON.parse(cachedData));
            }
        } catch (redisError) {
            // If Redis fails, log but continue to database query
            console.warn('[Redis] Cache read error, falling back to database:', redisError);
        }

        const summary: DashboardSummary = getDashboardData(timeRange);

        // Store in cache (non-blocking)
        try {
            await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(summary));
        } catch (redisError) {
            // If cache write fails, log but don't fail the request
            console.warn('[Redis] Cache write error:', redisError);
        }

        return res.json(summary);
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        next(error);
    }
};
