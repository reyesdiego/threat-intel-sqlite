import db from './database/db';
import * as QueryString from "node:querystring";

export const getCampaignDetails = (id: string) => {

    return db.prepare(`
                SELECT id, name, description, first_seen, last_seen, status
                FROM campaigns
                WHERE id = ?
            `).get(id) as any;
}

export const getIndicators = (id: string, start_date: string | undefined, end_date: string | undefined, group_by: string | undefined, campaign: { first_seen: string | number | Date; last_seen: string | number | Date; }) => {
    let indicatorQuery = `
        SELECT i.id, i.type, i.value, ci.observed_at
        FROM indicators i
                 JOIN campaign_indicators ci ON i.id = ci.indicator_id
        WHERE ci.campaign_id = ?
    `;
    const params: any[] = [id];

    if (start_date) {
        indicatorQuery += ' AND ci.observed_at >= ?';
        params.push(start_date);
    }

    if (end_date) {
        indicatorQuery += ' AND ci.observed_at <= ?';
        params.push(end_date);
    }

    indicatorQuery += ' ORDER BY ci.observed_at ASC';

    const allIndicators = db.prepare(indicatorQuery).all(params) as any[];

    const timeline: { [key: string]: any } = {};

    allIndicators.forEach(indicator => {
        const date = new Date(indicator.observed_at);
        let periodKey: string;

        if (group_by === 'day') {
            periodKey = date.toISOString().split('T')[0];
        } else {
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            periodKey = weekStart.toISOString().split('T')[0];
        }

        if (!timeline[periodKey]) {
            timeline[periodKey] = {
                period: periodKey,
                indicators: [],
                counts: {ip: 0, domain: 0, url: 0, hash: 0}
            };
        }

        timeline[periodKey].indicators.push({
            id: indicator.id,
            type: indicator.type,
            value: indicator.value
        });

        timeline[periodKey].counts[indicator.type]++;
    });

    const timelineArray = Object.values(timeline).sort((a, b) =>
        new Date(a.period).getTime() - new Date(b.period).getTime()
    );

    const uniqueIps = new Set<string>();
    const uniqueDomains = new Set<string>();
    const totalIndicators = allIndicators.length;

    allIndicators.forEach(indicator => {
        if (indicator.type === 'ip') uniqueIps.add(indicator.value);
        if (indicator.type === 'domain') uniqueDomains.add(indicator.value);
    });

    const firstSeen = new Date(campaign.first_seen);
    const lastSeen = new Date(campaign.last_seen);
    const durationDays = Math.ceil((lastSeen.getTime() - firstSeen.getTime()) / (1000 * 60 * 60 * 24));
    return {timelineArray, uniqueIps, uniqueDomains, totalIndicators, durationDays};
}