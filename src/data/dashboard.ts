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
 * Uses a single JSON query to fetch all dashboard data in one database round-trip.
 */
export const getDashboardData = (timeRange: string) => {
    const hoursBack = TIME_RANGE_MAPPING[timeRange];
    const cutoffISO = getCutoffISOString(hoursBack);

    return db.prepare(`
        SELECT json_object(
            'time_range', :timeRange,
            'new_indicators', (
                SELECT json_object(
                            'domain', domain, 
                            'ip', ip,
                            'url', url, 
                            'hash', hash
                    )
                FROM (
                    SELECT SUM(CASE WHEN i.type='domain' THEN 1 ELSE 0 END) AS domain,
                        SUM(CASE WHEN i.type='url' THEN 1 ELSE 0 END) AS url,
                        SUM(CASE WHEN i.type='hash' THEN 1 ELSE 0 END) AS hash,
                        SUM(CASE WHEN i.type='ip' THEN 1 ELSE 0 END) AS ip
                    FROM indicators i
                    WHERE first_seen >= :cutoffISO
                )
            ),
            'active_campaigns', (
                SELECT COUNT(*)
                FROM campaigns
                WHERE status = 'active' AND last_seen >= :cutoffISO
            ),
            'top_threat_actors', (
                SELECT json_group_array(
                    json_object(
                        'id', ta.id,
                        'name', ta.name,
                        'indicator_count', ta.indicator_count
                    )
                )
                FROM (
                    SELECT ta.id, ta.name, COUNT(DISTINCT ci.indicator_id) as indicator_count
                    FROM threat_actors ta
                    JOIN actor_campaigns ac ON ta.id = ac.threat_actor_id
                    JOIN campaign_indicators ci ON ac.campaign_id = ci.campaign_id
                    GROUP BY ta.id, ta.name
                    ORDER BY indicator_count DESC
                    LIMIT 5
                ) ta
            ),
            'indicator_distribution', (
                SELECT json_group_array(
                               json_object(
                                       'domain', domain,
                                       'ip', ip,
                                       'url', url,
                                       'hash', hash
                               )
                )
                FROM (
                    SELECT SUM(CASE WHEN i.type='domain' THEN 1 ELSE 0 END) AS domain,
                        SUM(CASE WHEN i.type='url' THEN 1 ELSE 0 END) AS url,
                        SUM(CASE WHEN i.type='hash' THEN 1 ELSE 0 END) AS hash,
                        SUM(CASE WHEN i.type='ip' THEN 1 ELSE 0 END) AS ip
                    FROM indicators i
                )
            )
        ) AS data
    `).get({cutoffISO, timeRange}) as { data: string };
};
