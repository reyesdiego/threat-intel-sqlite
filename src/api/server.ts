import express, { Request, Response, NextFunction } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import {initRoutes} from './routes';
import {HttpError} from './errors/http-errors';
import {noCache} from './middleware/no-cache';


const app = express();
const PORT = process.env.PORT || 3000;

app.disable('x-powered-by');

app.use(express.json());

// no-cache to all API routes
app.use('/api', noCache);

app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Threat Intelligence API',
            version: '1.0.0',
            description: 'A comprehensive REST API for threat intelligence analysis, providing endpoints to investigate malicious indicators, threat actors, campaigns, and their relationships.',
            contact: {
                name: 'API Support'
            }
        },
        servers: [
            {
                url: `http://localhost:${PORT}`,
                description: 'Development server'
            }
        ],
        tags: [
            {
                name: 'Indicators',
                description: 'Endpoints for threat indicators (IPs, domains, URLs, hashes)'
            },
            {
                name: 'Campaigns',
                description: 'Endpoints for attack campaigns'
            },
            {
                name: 'Dashboard',
                description: 'Dashboard statistics and summaries'
            }
        ]
    },
    apis: ['./src/api/routes/*.ts', './dist/api/routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Threat Intelligence API Documentation'
}));

app.get('/', (req: Request, res: Response) => {
    res.json({
        message: 'Threat Intelligence API',
        version: '1.0.0',
        documentation: '/api-docs',
        endpoints: {
            indicators: {
                'GET /api/indicators/:id': 'Get detailed indicator information',
                'GET /api/indicators/search': 'Search and filter indicators'
            },
            campaigns: {
                'GET /api/campaigns/:id/indicators': 'Get campaign indicators with timeline'
            },
            dashboard: {
                'GET /api/dashboard/summary': 'Get dashboard summary statistics'
            }
        }
    });
});

// init business logic routers
initRoutes(app);

app.use((req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof HttpError) {
        return res.status(err.status).json({
            error: err.message,
            code: err.code,
            details: err.details
        });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`Threat Intelligence API running on port ${PORT}`);
    console.log(`API Documentation: http://localhost:${PORT}/api-docs`);
    console.log(`Visit http://localhost:${PORT} for endpoint list`);
});
