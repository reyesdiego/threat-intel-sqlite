# Architecture Documentation

## Overview

The Threat Intelligence API follows a **layered architecture** pattern with clear separation of concerns. The application is built with Node.js, Express.js, TypeScript, SQLite, and Redis, emphasizing maintainability, testability, and performance.

## Architecture Layers

```
┌─────────────────────────────────────────┐
│         Express Server (API)            │
│  - Request/Response handling            │
│  - Middleware (logging, no-cache)       │
│  - Error handling                       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│            Routes Layer                 │
│  - Route definitions                    │
│  - Swagger documentation                │
│  - Thin routing logic                   │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         Controllers Layer               │
│  - Business logic                       │
│  - Request validation                   │
│  - Response formatting                  │
│  - Error throwing                       │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│          Data Access Layer              │
│  - Database queries                     │
│  - Data transformation                  │
│  - SQLite JSON queries                  │
└─────────────────────────────────────────┘
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
┌──────────────┐        ┌──────────────┐
│   SQLite     │        │    Redis     │
│  Database    │        │    Cache     │
└──────────────┘        └──────────────┘
```

## Directory Structure

```
src/
├── api/                   # API infrastructure
│   ├── errors/            # HTTP error classes
│   ├── middleware/        # Express middleware
│   ├── routes/            # Route definitions
│   └── server.ts          # Express app setup
├── controllers/           # Business logic handlers
│   ├── campaigns.controller.ts
│   ├── dashboard.controller.ts
│   └── indicators.controller.ts
├── data/                  # Data access layer
│   ├── campaigns.ts
│   ├── dashboard.ts
│   ├── indicators.ts
│   └── database/
│       ├── db.ts          # SQLite client
│       └── redis.ts       # Redis client
└── __tests__/            # Test setup
```

## Separation of Concerns

### 1. Routes Layer (`src/api/routes/`)

**Purpose**: Define API endpoints and map them to controllers.

**Responsibilities**:
- Route path definitions
- HTTP method mapping (GET, POST, etc.)
- Swagger/OpenAPI documentation
- Minimal logic - just routing

**Example**:
```typescript
// src/api/routes/campaigns.ts
import express from 'express';
import { getCampaignIndicators } from '../../controllers/campaigns.controller';

const router = express.Router();

router.get('/:id/indicators', getCampaignIndicators);

export default router;
```

**Characteristics**:
- Thin layer - only routing concerns
- No business logic
- Swagger annotations for API documentation
- Imports controllers, not data layer

### 2. Controllers Layer (`src/controllers/`)

**Purpose**: Handle business logic, request validation, and orchestration.

**Responsibilities**:
- Extract and validate request parameters
- Call data access layer functions
- Handle business rules
- Throw appropriate HTTP errors
- Format responses
- Handle caching (when applicable)

**Example**:
```typescript
// src/controllers/campaigns.controller.ts
export const getCampaignIndicators = (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const group_by = typeof req.query.group_by === 'string' ? req.query.group_by : 'day';

        // Validation
        if (!['day', 'week'].includes(group_by)) {
            throw new WrongParameters('Invalid group_by parameter', { group_by });
        }

        // Data access
        const campaign = getCampaignDetails(id, start_date, end_date, group_by);

        // Business logic
        if (!campaign) {
            throw new NotFound('Campaign not found', { id });
        }

        // Response
        res.json(JSON.parse(campaign.data));
    } catch (error) {
        next(error); // Pass to error handler
    }
};
```

**Characteristics**:
- Contains business logic
- Validates input
- Throws HTTP errors (not generic errors)
- Calls data layer functions
- Handles response formatting

### 3. Data Access Layer (`src/data/`)

**Purpose**: Interact with databases and external data sources.

**Responsibilities**:
- Execute database queries
- Transform raw data
- Use SQLite JSON functions for complex queries
- Handle database-specific logic
- Return structured data

**Example**:
```typescript
// src/data/campaigns.ts
export const getCampaignDetails = (id: string, start_date: string | undefined, end_date: string | undefined, group_by: string) => {
    return db.prepare(`
        SELECT json_object(
            'campaign', json_object(...),
            'timeline', (SELECT json_group_array(...)),
            'summary', (SELECT json_object(...))
        ) AS data
        FROM campaigns c
        WHERE c.id = :id
    `).get({id, start_date, end_date, group_by}) as any;
};
```

**Characteristics**:
- Database-specific code
- Uses SQLite JSON functions
- Returns raw data structures
- No HTTP concerns
- No business validation

## Error Handling

### HTTP Error Classes

The application uses a custom error hierarchy for consistent error handling:

```typescript
// Base class
HttpError
├── WrongParameters (400)
├── NotFound (404)
└── InternalServerError (500)


// TODO
├── Unauthorized (401)
├── Forbidden (403)
├── Conflict (409)

```

### Error Flow

1. **Controller throws HTTP error**:
   ```typescript
   if (!campaign) {
       throw new NotFound('Campaign not found', { id });
   }
   ```

2. **Error caught and passed to next()**:
   ```typescript
   catch (error) {
       next(error); // Express error handler
   }
   ```

3. **Global error handler processes**:
   ```typescript
   app.use((err: any, req: Request, res: Response, next: NextFunction) => {
       if (err instanceof HttpError) {
           return res.status(err.status).json({
               error: err.message,
               code: err.code,
               details: err.details
           });
       }
       // Fallback for unexpected errors
       res.status(500).json({ error: 'Internal server error' });
   });
   ```

### Error Response Format

All errors return a consistent JSON structure:

```json
{
  "error": "Campaign not found",
  "code": "NOT_FOUND",
  "details": {
    "id": "campaign-uuid"
  }
}
```

### Benefits

- **Consistent error responses** across all endpoints
- **Type-safe error handling** with TypeScript
- **Proper HTTP status codes** automatically set
- **Structured error details** for debugging
- **Centralized error handling** in one middleware

## Route Structure

### Route Organization

Routes are organized by entity/resource:

```
/api/
├── indicators/
│   ├── GET /:id              → getIndicatorById
│   └── GET /search            → searchIndicators
├── campaigns/
│   └── GET /:id/indicators    → getCampaignIndicators
└── dashboard/
    └── GET /summary           → getDashboardSummary
```

### Route Registration

Routes are registered in `src/api/routes/index.ts`:

```typescript
export const initRoutes = (app: Express) => {
    app.use('/api/indicators', indicatorsRouter);
    app.use('/api/campaigns', campaignsRouter);
    app.use('/api/dashboard', dashboardRouter);
};
```

### Middleware Application

- **Global middleware**: Applied to all routes
  - `express.json()` - JSON body parsing
  - `noCache` - HTTP cache control (applied to `/api/*`)
  - Logging middleware

- **Route-specific middleware**: Applied per route
  - Error handling middleware (in test setup)

## SQLite JSON Queries

### Overview

The application leverages SQLite's native JSON functions to create efficient, single-query data retrieval. This approach reduces database round-trips and improves performance.

### JSON Functions Used

1. **`json_object()`** - Creates JSON objects from key-value pairs
2. **`json_group_array()`** - Aggregates rows into JSON arrays
3. **`json_group_object()`** - Aggregates rows into JSON objects (when available)

### Query Pattern

**Single Query with Nested JSON**:

```sql
SELECT json_object(
    'indicator', json_object(
        'id', i.id,
        'type', i.type,
        'value', i.value
    ),
    'threatActors', (
        SELECT json_group_array(
            json_object(
                'id', ta.id,
                'name', ta.name,
                'confidence', ac.confidence
            )
        )
        FROM threat_actors ta
        JOIN actor_campaigns ac ON ta.id = ac.threat_actor_id
        WHERE ci.indicator_id = i.id
        ORDER BY ac.confidence DESC
    ),
    'campaigns', (
        SELECT json_group_array(...)
        FROM campaigns c
        WHERE ci.indicator_id = i.id
    )
) AS data
FROM indicators i
WHERE i.id = ?
```

### Benefits

1. **Performance**: Single database round-trip instead of multiple queries
2. **Atomicity**: All related data fetched in one transaction
3. **Efficiency**: Less network overhead, faster response times
4. **Simplicity**: Complex nested structures in one query

### Example: Campaign Indicators Query

```sql
SELECT json_object(
    'campaign', json_object(
        'id', c.id,
        'name', c.name,
        'status', c.status
    ),
    'timeline', (
        SELECT json_group_array(
            json_object(
                'period', t.period,
                'indicators', (
                    SELECT json_group_array(
                        json_object('id', i.id, 'type', i.type)
                    )
                    FROM indicators i
                    JOIN campaign_indicators ci ON ci.indicator_id = i.id
                    WHERE ci.campaign_id = c.id
                ),
                'counts', json_object(
                    'ip', t.ip,
                    'domain', t.domain,
                    'url', t.url,
                    'hash', t.hash
                )
            )
        )
        FROM (
            SELECT 
                date(ci.observed_at) AS period,
                SUM(CASE WHEN i.type='ip' THEN 1 ELSE 0 END) AS ip,
                SUM(CASE WHEN i.type='domain' THEN 1 ELSE 0 END) AS domain
            FROM campaign_indicators ci
            JOIN indicators i ON ci.indicator_id = i.id
            WHERE ci.campaign_id = c.id
            GROUP BY period
        ) t
    ),
    'summary', (
        SELECT json_object(
            'total_indicators', COUNT(*),
            'unique_ips', SUM(CASE WHEN i.type='ip' THEN 1 ELSE 0 END),
            'duration', julianday(c.last_seen) - julianday(c.first_seen)
        )
        FROM indicators i
        JOIN campaign_indicators ci ON ci.indicator_id = i.id
        WHERE ci.campaign_id = c.id
    )
) AS data
FROM campaigns c
WHERE c.id = :id
```

### Processing JSON Results

After fetching JSON from SQLite, controllers parse the result:

```typescript
const result = db.prepare(query).get(params) as { data: string };
const data = JSON.parse(result.data);
return data; // Already structured as needed
```

## Caching Strategy

### Redis Integration

The application uses Redis for server-side caching:

- **Location**: `src/data/database/redis.ts`
- **Usage**: Dashboard summary endpoint
- **TTL**: 5 minutes (300 seconds)
- **Key pattern**: `dashboard:summary:{time_range}`

### Caching Flow

1. **Check cache** - Look for cached data in Redis
2. **Cache hit** - Return cached data with `cached: redis` header
3. **Cache miss** - Query database, store in cache, return data
4. **Graceful degradation** - If Redis fails, fall back to database

### Example

```typescript
// Check cache
const cachedData = await redis.get(cacheKey);
if (cachedData) {
    return res.header('cached', 'redis').json(JSON.parse(cachedData));
}

// Cache miss - fetch from database
const summary = getDashboardData(timeRange);

// Store in cache (non-blocking)
await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(summary));

return res.json(summary);
```

## Request Flow Example

### Example: GET /api/campaigns/:id/indicators

```
1. Request arrives
   ↓
2. Express middleware
   - JSON parsing
   - No-cache header
   - Logging
   ↓
3. Route handler (campaigns.ts)
   - Matches route pattern
   - Calls controller function
   ↓
4. Controller (campaigns.controller.ts)
   - Extracts: id, start_date, end_date, group_by
   - Validates: group_by must be 'day' or 'week'
   - Calls: getCampaignDetails(id, start_date, end_date, group_by)
   ↓
5. Data layer (campaigns.ts)
   - Executes SQLite JSON query
   - Returns: { data: "JSON string" }
   ↓
6. Controller processes
   - Parses JSON: JSON.parse(campaign.data)
   - Checks: if (!campaign) throw NotFound
   - Returns: res.json(parsedData)
   ↓
7. Response sent to client
```

## Testing Architecture

### Test Structure

- **Location**: `src/api/routes/__tests__/`
- **Framework**: Jest with Supertest
- **Strategy**: Integration tests with mocked data layer

### Testing Approach

1. **Mock data layer** - Mock `src/data/*` modules
2. **Test controllers through routes** - Full request/response cycle
3. **Verify HTTP status codes** - Ensure proper error handling
4. **Test error scenarios** - 400, 404, 500 responses

### Example Test

```typescript
jest.mock('../../../data/campaigns');

it('should return 404 when campaign not found', async () => {
    (campaignsData.getCampaignDetails as jest.Mock).mockReturnValue(null);
    
    const response = await request(app)
        .get('/api/campaigns/non-existent-id/indicators')
        .expect(404);
    
    expect(response.body).toMatchObject({
        error: 'Campaign not found',
        code: 'NOT_FOUND'
    });
});
```

## Best Practices

### 1. Separation of Concerns
- Routes: Only routing logic
- Controllers: Business logic and validation
- Data layer: Database queries only

### 2. Error Handling
- Always use custom HTTP error classes
- Pass errors to `next()` in controllers
- Let global error handler format responses

### 3. SQLite JSON Queries
- Use single queries when possible
- Leverage `json_object()` and `json_group_array()`
- Parse JSON results in controllers

### 4. Type Safety
- Use TypeScript interfaces for data structures
- Type all function parameters and returns
- Leverage type checking for HTTP errors

### 5. Caching
- Cache expensive queries (dashboard, aggregations)
- Use appropriate TTL values
- Handle cache failures gracefully

## Performance Considerations

1. **Single Query Pattern**: Reduces database round-trips
2. **Redis Caching**: Speeds up frequently accessed data
3. **JSON Parsing**: Done once in controller, not in data layer
4. **Prepared Statements**: SQLite prepared statements for security and performance
5. **Connection Pooling**: SQLite handles connections efficiently

## Security Considerations

1. **Parameterized Queries**: All queries use prepared statements
2. **Input Validation**: Controllers validate all inputs
3. **Error Messages**: Don't expose sensitive information
4. **HTTP Headers**: No-cache middleware prevents caching sensitive data
5. **X-Powered-By**: Disabled to hide server technology

## Future Enhancements

- Add request validation middleware (e.g., express-validator)
- Implement rate limiting
- Add authentication/authorization middleware
- Expand caching to more endpoints
- Add database connection pooling for high concurrency
- Implement query result caching at data layer
