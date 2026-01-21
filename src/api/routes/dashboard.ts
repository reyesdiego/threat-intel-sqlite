import express, {NextFunction, Request, Response} from 'express';
import {DashboardSummary, getDashboardData, DEFAULT_RANGE, TIME_RANGE_MAPPING} from "../../data/dashboard";
import {WrongParameters} from "../errors/http-errors";
import redis from "../../data/database/redis";

const router = express.Router();

// Cache TTL in seconds (300 -> 5 minutes)
const CACHE_TTL = 300;

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary
 *     description: Provide high-level statistics for the dashboard overview. This sqlite is cached for 5 minutes by time_range
 *     tags: [Dashboard]
 *     parameters:
 *       - in: query
 *         name: time_range
 *         schema:
 *           type: string
 *           enum: [24h, 7d, 30d]
 *           default: 7d
 *         description: Time range for statistics
 *     responses:
 *       200:
 *         description: Dashboard summary retrieved successfully
 *       400:
 *         description: Invalid time_range parameter
 *       500:
 *         description: Internal server error
 */
router.get('/summary', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const timeRange = (req.query.time_range as string) || DEFAULT_RANGE;

        if (!(timeRange in TIME_RANGE_MAPPING)) {
            throw new WrongParameters(`Invalid time_range. Must be one of: ${Object.keys(TIME_RANGE_MAPPING).join(', ')}`, {time_range: timeRange});
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

        // Fresh sqlite
        return res.json(summary);
    } catch (error) {
        console.error('Error fetching dashboard summary:', error);
        next(error)
    }
});

export default router;