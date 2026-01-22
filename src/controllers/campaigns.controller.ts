import { Request, Response, NextFunction } from 'express';
import { getCampaignDetails } from '../data/campaigns';
import { NotFound, WrongParameters } from '../api/errors/http-errors';

/**
 * Get campaign indicators timeline
 * GET /api/campaigns/:id/indicators
 */
export const getCampaignIndicators = (req: Request, res: Response, next: NextFunction) => {
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
            throw new NotFound('Campaign not found', { id });
        }

        res.json(JSON.parse(campaign.data));
    } catch (error) {
        console.error('Error fetching campaign indicators:', error);
        next(error);
    }
};
