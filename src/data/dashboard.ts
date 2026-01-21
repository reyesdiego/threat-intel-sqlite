import db from './database/db';

export interface DashboardSummary {
    time_range: string;
    new_indicators: Record<string, number>;
    active_campaigns: number;
    top_threat_actors: any[];
    indicator_distribution: Record<string, number>;
}
export const TIME_RANGE_MAPPING: Record<string, number> = {
    '24h': 24,
    '7d': 24 * 7,
    '30d': 24 * 30
};

export const DEFAULT_RANGE = '7d';

/**
 * Transforms raw database rows into a structured indicator count object.
 */
const formatIndicatorCounts = (rows: any[]) => {
    const counts: Record<string, number> = {
        ip: 0,
        domain: 0,
        url: 0,
        hash: 0
    };
    rows.forEach(row => {
        if (row.type in counts) {
            counts[row.type] = row.count;
        }
    });
    return counts;
};

/**
 * Calculates the ISO string for the cutoff date based on hours back.
 */
const getCutoffISOString = (hoursBack: number): string => {
    const cutoffDate = new Date();
    cutoffDate.setHours(cutoffDate.getHours() - hoursBack);
    return cutoffDate.toISOString();
};
/**
 * Retrieves summarized threat intelligence statistics from the database.
 */
export const getDashboardData = (timeRange: string): DashboardSummary => {
    const hoursBack = TIME_RANGE_MAPPING[timeRange];
    const cutoffISO = getCutoffISOString(hoursBack);

    const newIndicators = db.prepare(`
        SELECT type, COUNT(*) as count
        FROM indicators
        WHERE first_seen >= ?
        GROUP BY type
    `).all(cutoffISO) as { type: string; count: number }[];

    const activeCampaigns = db.prepare(`
        SELECT COUNT(*) as count
        FROM campaigns
        WHERE status = 'active' AND last_seen >= ?
    `).get(cutoffISO) as { count: number };

    const topThreatActors = db.prepare(`
        SELECT ta.id, ta.name, COUNT(DISTINCT ci.indicator_id) as indicator_count
        FROM threat_actors ta
            JOIN actor_campaigns ac ON ta.id = ac.threat_actor_id
            JOIN campaign_indicators ci ON ac.campaign_id = ci.campaign_id
        GROUP BY ta.id, ta.name
        ORDER BY indicator_count DESC
        LIMIT 5
    `).all() as any[];

    const totalDistribution = db.prepare(`
        SELECT type, COUNT(*) as count
        FROM indicators
        GROUP BY type
    `).all() as { type: string; count: number }[];

    return {
        time_range: timeRange,
        new_indicators: formatIndicatorCounts(newIndicators),
        active_campaigns: activeCampaigns.count,
        top_threat_actors: topThreatActors,
        indicator_distribution: formatIndicatorCounts(totalDistribution)
    };
};
