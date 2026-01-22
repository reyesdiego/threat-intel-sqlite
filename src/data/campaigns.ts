import db from './database/db';

export const getCampaignDetails = (id: string, start_date: string | undefined, end_date: string| undefined, group_by: string) => {

    return db.prepare(`
                    SELECT json_object(
                            'campaign', json_object(
                                'id', c.id,
                                'name', name,
                                'description', c.description,
                                'first_seen', first_seen,
                                'last_seen', last_seen,
                                'status', c.status
                                ),
                            'timeline', (
                                        SELECT json_group_array(
                                                  json_object(
                                                       'period', t.period,
                                                       'indicators', (
                                                           SELECT json_group_array(json_object('id', i.id, 'type', i.type))
                                                           FROM indicators i
                                                                    JOIN campaign_indicators ci ON ci.indicator_id = i.id
                                                           WHERE ci.campaign_id = c.id
                                                             AND CASE
                                                                     WHEN :group_by = 'week' THEN date(ci.observed_at, 'weekday 1', '-7 days')
                                                           ELSE date(ci.observed_at)
                                                           END = t.period
                                                        ),
                                                        'counts', json_object(
                                                          'domain', t.domain,
                                                          'url', t.url,
                                                          'hash', t.hash,
                                                          'ip', t.ip
                                                        )
                                                  )
                                       )
                                        FROM (
                                                SELECT CASE
                                                        WHEN :group_by = 'week' THEN date(ci.observed_at, 'weekday 1', '-7 days')
                                                        ELSE date(ci.observed_at)
                                                        END AS period,
                                                    SUM(CASE WHEN i.type='domain' THEN 1 ELSE 0 END) AS domain,
                                                    SUM(CASE WHEN i.type='url' THEN 1 ELSE 0 END) AS url,
                                                    SUM(CASE WHEN i.type='hash' THEN 1 ELSE 0 END) AS hash,
                                                    SUM(CASE WHEN i.type='ip' THEN 1 ELSE 0 END) AS ip
                                                FROM campaign_indicators ci
                                                    JOIN indicators i ON ci.indicator_id = i.id
                                                WHERE ci.campaign_id = c.id
                                                    AND date(ci.observed_at) BETWEEN COALESCE(:start_date, ci.observed_at) AND COALESCE(:end_date, ci.observed_at)
                                                GROUP BY period
                                                ORDER BY date(ci.observed_at)
                                        ) t
                            ),
                          'summary', (
                                        SELECT json_object(
                                          'total_indicators', COUNT(*),
                                          'unique_domains', SUM(CASE WHEN i.type='domain' THEN 1 ELSE 0 END),
                                          'unique_ips', SUM(CASE WHEN i.type='ip' THEN 1 ELSE 0 END),
                                          'duration', julianday(c.last_seen) - julianday(c.first_seen)
                                        )
                                        FROM indicators i
                                        JOIN campaign_indicators ci ON ci.indicator_id = i.id
                                        WHERE ci.campaign_id = c.id
                                           AND date(ci.observed_at) BETWEEN COALESCE(:start_date, ci.observed_at) AND COALESCE(:end_date, ci.observed_at)
                                    )
                        ) AS data
                         FROM campaigns c
                         WHERE c.id = :id;
    `).get({id, start_date, end_date, group_by}) as any;
}