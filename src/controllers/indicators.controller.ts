import { Request, Response, NextFunction } from 'express';
import db from '../data/database/db';
import { getIndicatorDetails } from '../data/indicators';
import { NotFound, WrongParameters } from '../api/errors/http-errors';

/**
 * Search indicators
 * GET /api/indicators/search
 */
export const searchIndicators = (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            type,
            value,
            threat_actor,
            campaign,
            first_seen_after,
            last_seen_before,
            page = '1',
            limit = '20'
        } = req.query;

        const pageNum = parseInt(page as string);
        const limitNum = Math.min(parseInt(limit as string), 100);
        const offset = (pageNum - 1) * limitNum;

        if (pageNum < 1 || limitNum < 1) {
            throw new WrongParameters('Invalid pagination parameters, page and limit must be greater than 0', { page, limit });
        }

        let query = 'SELECT DISTINCT i.id, i.type, i.value, i.confidence, i.first_seen, i.last_seen FROM indicators i';
        let countQuery = 'SELECT COUNT(DISTINCT i.id) as total FROM indicators i';
        const conditions: string[] = [];
        const params: any[] = [];

        if (type) {
            conditions.push('i.type = ?');
            params.push(type);
        }

        if (value) {
            conditions.push('i.value LIKE ?');
            params.push(`%${value}%`);
        }

        if (threat_actor) {
            query += `
        JOIN campaign_indicators ci ON i.id = ci.indicator_id
        JOIN actor_campaigns ac ON ci.campaign_id = ac.campaign_id`;
            countQuery += `
        JOIN campaign_indicators ci ON i.id = ci.indicator_id
        JOIN actor_campaigns ac ON ci.campaign_id = ac.campaign_id`;
            conditions.push('ac.threat_actor_id = ?');
            params.push(threat_actor);
        }

        if (campaign) {
            if (!threat_actor) {
                query += ' JOIN campaign_indicators ci ON i.id = ci.indicator_id';
                countQuery += ' JOIN campaign_indicators ci ON i.id = ci.indicator_id';
            }
            conditions.push('ci.campaign_id = ?');
            params.push(campaign);
        }

        if (first_seen_after) {
            conditions.push('i.first_seen >= ?');
            params.push(first_seen_after);
        }

        if (last_seen_before) {
            conditions.push('i.last_seen <= ?');
            params.push(last_seen_before);
        }

        if (conditions.length > 0) {
            const whereClause = ' WHERE ' + conditions.join(' AND ');
            query += whereClause;
            countQuery += whereClause;
        }

        const totalResult = db.prepare(countQuery).get(params) as any;
        const total = totalResult.total;

        query += ' ORDER BY i.last_seen DESC LIMIT ? OFFSET ?';
        const indicators = db.prepare(query).all([...params, limitNum, offset]) as any[];

        // Fix N+1 problem: Batch query for all counts in one go
        if (indicators.length === 0) {
            return res.json({
                data: [],
                total,
                page: pageNum,
                limit: limitNum,
                total_pages: Math.ceil(total / limitNum)
            });
        }

        const indicatorIds = indicators.map(i => i.id);
        const placeholders = indicatorIds.map(() => '?').join(',');

        // Batch query for campaign counts
        const campaignCounts = db.prepare(`
            SELECT indicator_id, COUNT(DISTINCT campaign_id) as count
            FROM campaign_indicators
            WHERE indicator_id IN (${placeholders})
            GROUP BY indicator_id
        `).all(indicatorIds) as { indicator_id: string; count: number }[];

        // Batch query for threat actor counts
        const threatActorCounts = db.prepare(`
            SELECT ci.indicator_id, COUNT(DISTINCT ac.threat_actor_id) as count
            FROM campaign_indicators ci
            JOIN actor_campaigns ac ON ci.campaign_id = ac.campaign_id
            WHERE ci.indicator_id IN (${placeholders})
            GROUP BY ci.indicator_id
        `).all(indicatorIds) as { indicator_id: string; count: number }[];

        // Create maps for O(1) lookup
        const campaignCountMap = new Map(campaignCounts.map(c => [c.indicator_id, c.count]));
        const threatActorCountMap = new Map(threatActorCounts.map(t => [t.indicator_id, t.count]));

        // Enrich indicators with counts
        const enrichedIndicators = indicators.map(indicator => ({
            ...indicator,
            campaign_count: campaignCountMap.get(indicator.id) || 0,
            threat_actor_count: threatActorCountMap.get(indicator.id) || 0
        }));

        const totalPages = Math.ceil(total / limitNum);

        return res.json({
            data: enrichedIndicators,
            total,
            page: pageNum,
            limit: limitNum,
            total_pages: totalPages
        });

    } catch (error) {
        console.error('Error searching indicators:', error);
        next(error);
    }
};

/**
 * Get indicator details
 * GET /api/indicators/:id
 */
export const getIndicatorById = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        const indicator = getIndicatorDetails(id);

        if (!indicator) {
            throw new NotFound('Indicator not found', { id });
        }

        return res.json(JSON.parse(indicator.data));

    } catch (error) {
        console.error('Error fetching indicator:', error);
        next(error);
    }
};
