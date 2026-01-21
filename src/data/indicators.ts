import db from './database/db';


export const getIndicatorDetails = (id: string) => {
    const indicator = db.prepare(`
              SELECT id, type, value, confidence, first_seen, last_seen, tags
              FROM indicators
              WHERE id = ?
            `).get(id) as any;

    const threatActors = db.prepare(`
              SELECT DISTINCT ta.id, ta.name, ac.confidence
              FROM threat_actors ta
              JOIN actor_campaigns ac ON ta.id = ac.threat_actor_id
              JOIN campaign_indicators ci ON ac.campaign_id = ci.campaign_id
              WHERE ci.indicator_id = ?
              ORDER BY ac.confidence DESC
            `).all(id) as any[];

    const campaigns = db.prepare(`
              SELECT c.id, c.name, c.status
              FROM campaigns c
              JOIN campaign_indicators ci ON c.id = ci.campaign_id
              WHERE ci.indicator_id = ?
              ORDER BY ci.observed_at DESC
            `).all(id) as any[];

    const relatedIndicators = db.prepare(`
              SELECT i.id, i.type, i.value, ir.relationship_type as relationship
              FROM indicators i
              JOIN indicator_relationships ir ON i.id = ir.target_indicator_id
              WHERE ir.source_indicator_id = ?
              ORDER BY ir.first_observed DESC
              LIMIT 5
            `).all(id) as any[];

    return { indicator, threatActors, campaigns, relatedIndicators};
}
