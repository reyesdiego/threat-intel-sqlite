import express from 'express';
import { getDashboardSummary } from '../../controllers/dashboard.controller';

const router = express.Router();

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get dashboard summary
 *     description: Provide high-level statistics for the dashboard overview. This data is cached for 5 minutes by time_range
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
router.get('/summary', getDashboardSummary);

export default router;