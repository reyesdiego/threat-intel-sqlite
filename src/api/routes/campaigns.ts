import express from 'express';
import { getCampaignIndicators } from '../../controllers/campaigns.controller';

const router = express.Router();

/**
 * @swagger
 * /api/campaigns/{id}/indicators:
 *   get:
 *     summary: Get campaign indicators timeline
 *     description: Get all indicators associated with a campaign, organized for timeline visualization
 *     tags: [Campaigns]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Campaign ID (UUID)
 *       - in: query
 *         name: group_by
 *         schema:
 *           type: string
 *           enum: [day, week]
 *           default: day
 *         description: Group results by day or week
 *       - in: query
 *         name: start_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Optional start date filter (ISO format)
 *       - in: query
 *         name: end_date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Optional end date filter (ISO format)
 *     responses:
 *       200:
 *         description: Campaign timeline retrieved successfully
 *       400:
 *         description: Invalid group_by parameter
 *       404:
 *         description: Campaign not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/indicators', getCampaignIndicators);

export default router;
