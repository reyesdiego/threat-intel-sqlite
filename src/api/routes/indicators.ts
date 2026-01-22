import express from 'express';
import { searchIndicators, getIndicatorById } from '../../controllers/indicators.controller';

const router = express.Router();
/**
 * @swagger
 * /api/indicators/search:
 *   get:
 *     summary: Search indicators
 *     description: Search and filter indicators with pagination
 *     tags: [Indicators]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ip, domain, url, hash]
 *         description: Filter by indicator type
 *       - in: query
 *         name: value
 *         schema:
 *           type: string
 *         description: Partial match search on indicator value
 *       - in: query
 *         name: threat_actor
 *         schema:
 *           type: string
 *         description: Filter by threat actor ID
 *       - in: query
 *         name: campaign
 *         schema:
 *           type: string
 *         description: Filter by campaign ID
 *       - in: query
 *         name: first_seen_after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO date filter for first_seen
 *       - in: query
 *         name: last_seen_before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: ISO date filter for last_seen
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *       400:
 *         description: Invalid pagination parameters
 *       500:
 *         description: Internal server error
 */
router.get('/search', searchIndicators);

/**
 * @swagger
 * /api/indicators/{id}:
 *   get:
 *     summary: Get indicator details
 *     description: Retrieve detailed information about a specific indicator including threat actors, campaigns, and related indicators
 *     tags: [Indicators]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Indicator ID (UUID)
 *     responses:
 *       200:
 *         description: Indicator details retrieved successfully
 *       404:
 *         description: Indicator not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id', getIndicatorById);

export default router;
