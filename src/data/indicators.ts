import db from './database/db';

export const getIndicatorDetails = (id: string) => {
    return db.prepare(`
        SELECT json_object(
            'id', i.id,
            'type', i.type,
            'value', i.value,
            'confidence', i.confidence,
            'first_seen', i.first_seen,
            'last_seen', i.last_seen,
            'tags', i.tags,
            'threatActors', json((
                SELECT json_group_array(
                    json_object(
                        'id', ta.id,
                        'name', ta.name,
                        'confidence', ac.confidence
                    )
                )
                FROM threat_actors ta
                JOIN actor_campaigns ac ON ta.id = ac.threat_actor_id
                JOIN campaign_indicators ci ON ac.campaign_id = ci.campaign_id
                WHERE ci.indicator_id = i.id
                GROUP BY ta.id, ta.name, ac.confidence
                ORDER BY ac.confidence DESC
            )),
            'campaigns', json((
                SELECT json_group_array(
                    json_object(
                        'id', c.id,
                        'name', c.name,
                        'status', c.status
                    )
                )
                FROM campaigns c
                JOIN campaign_indicators ci ON c.id = ci.campaign_id
                WHERE ci.indicator_id = i.id
                ORDER BY ci.observed_at DESC
            )),
            'relatedIndicators', json((
                SELECT json_group_array(
                    json_object(
                        'id', i2.id,
                        'type', i2.type,
                        'value', i2.value,
                        'relationship', ir.relationship_type
                    )
                )
                FROM indicators i2
                JOIN indicator_relationships ir ON i2.id = ir.target_indicator_id
                WHERE ir.source_indicator_id = i.id
                ORDER BY ir.first_observed DESC
                LIMIT 5
            ))
        ) AS data
        FROM indicators i
        WHERE i.id = ?
    `).get(id) as { data: string } | undefined;
}
