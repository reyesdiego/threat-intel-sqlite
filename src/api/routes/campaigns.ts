import express, { Request, Response, NextFunction } from 'express';
import {getCampaignDetails} from "../../data/campaigns";
import {NotFound, WrongParameters} from "../errors/http-errors";

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
router.get('/:id/indicators', (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const start_date = typeof req.query.start_date === 'string' ? req.query.start_date : undefined;
        const end_date = typeof req.query.end_date === 'string' ? req.query.end_date : undefined;
        const group_by = typeof req.query.group_by === 'string' ? req.query.group_by : 'day';


        if (!['day', 'week'].includes(group_by as string)) {
            throw new WrongParameters('Invalid group_by parameter. Must be "day" or "week"', { group_by });
        }

        const campaign = getCampaignDetails(id, start_date, end_date, group_by);

        if (!campaign) {
            throw new NotFound('Campaign not found', {id})
        }

        res.json(JSON.parse(campaign.data));
    } catch (error) {
        console.error('Error fetching campaign indicators:', error);
        next(error);
    }
});

export default router;
