import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import campaignsRouter from '../campaigns';
import * as campaignsData from '../../../data/campaigns';
import { HttpError } from '../../errors/http-errors';

// Mock the campaigns sqlite module
jest.mock('../../../data/campaigns');

describe('GET /api/campaigns/:id/indicators', () => {
    let app: Express;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/campaigns', campaignsRouter);
        
        // Error handling middleware (same as in server.ts)
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
        
        // Clear all mocks before each test
        jest.clearAllMocks();
    });

    describe('Successful requests', () => {
        it('should return campaign indicators with default group_by=day', async () => {
            const campaignId = 'test-campaign-id';
            const mockCampaign = {
                id: campaignId,
                name: 'Test Campaign',
                description: 'Test Description',
                first_seen: '2024-01-01T00:00:00Z',
                last_seen: '2024-01-10T00:00:00Z',
                status: 'active'
            };

            const mockIndicators = {
                timelineArray: [
                    {
                        period: '2024-01-01',
                        indicators: [
                            { id: 'ind1', type: 'ip', value: '192.168.1.1' }
                        ],
                        counts: { ip: 1, domain: 0, url: 0, hash: 0 }
                    }
                ],
                uniqueIps: new Set(['192.168.1.1']),
                uniqueDomains: new Set(['example.com']),
                totalIndicators: 1,
                durationDays: 9
            };

            (campaignsData.getCampaignDetails as jest.Mock).mockReturnValue(mockCampaign);
            (campaignsData.getIndicators as jest.Mock).mockReturnValue(mockIndicators);

            const response = await request(app)
                .get(`/api/campaigns/${campaignId}/indicators`)
                .expect(200);

            expect(response.body).toEqual({
                campaign: {
                    id: campaignId,
                    name: 'Test Campaign',
                    description: 'Test Description',
                    first_seen: '2024-01-01T00:00:00Z',
                    last_seen: '2024-01-10T00:00:00Z',
                    status: 'active'
                },
                timeline: mockIndicators.timelineArray,
                summary: {
                    total_indicators: 1,
                    unique_ips: 1,
                    unique_domains: 1,
                    duration_days: 9
                }
            });

            expect(campaignsData.getCampaignDetails).toHaveBeenCalledWith(campaignId);
            expect(campaignsData.getIndicators).toHaveBeenCalledWith(
                campaignId,
                undefined,
                undefined,
                'day',
                mockCampaign
            );
        });

        it('should return campaign indicators with group_by=week', async () => {
            const campaignId = 'test-campaign-id';
            const mockCampaign = {
                id: campaignId,
                name: 'Test Campaign',
                description: 'Test Description',
                first_seen: '2024-01-01T00:00:00Z',
                last_seen: '2024-01-10T00:00:00Z',
                status: 'active'
            };

            const mockIndicators = {
                timelineArray: [
                    {
                        period: '2023-12-31',
                        indicators: [
                            { id: 'ind1', type: 'ip', value: '192.168.1.1' }
                        ],
                        counts: { ip: 1, domain: 0, url: 0, hash: 0 }
                    }
                ],
                uniqueIps: new Set(['192.168.1.1']),
                uniqueDomains: new Set(),
                totalIndicators: 1,
                durationDays: 9
            };

            (campaignsData.getCampaignDetails as jest.Mock).mockReturnValue(mockCampaign);
            (campaignsData.getIndicators as jest.Mock).mockReturnValue(mockIndicators);

            const response = await request(app)
                .get(`/api/campaigns/${campaignId}/indicators`)
                .query({ group_by: 'week' })
                .expect(200);

            expect(response.body.campaign.id).toBe(campaignId);
            expect(campaignsData.getIndicators).toHaveBeenCalledWith(
                campaignId,
                undefined,
                undefined,
                'week',
                mockCampaign
            );
        });

        it('should handle start_date and end_date query parameters', async () => {
            const campaignId = 'test-campaign-id';
            const startDate = '2024-01-05T00:00:00Z';
            const endDate = '2024-01-08T00:00:00Z';
            const mockCampaign = {
                id: campaignId,
                name: 'Test Campaign',
                description: 'Test Description',
                first_seen: '2024-01-01T00:00:00Z',
                last_seen: '2024-01-10T00:00:00Z',
                status: 'active'
            };

            const mockIndicators = {
                timelineArray: [],
                uniqueIps: new Set(),
                uniqueDomains: new Set(),
                totalIndicators: 0,
                durationDays: 9
            };

            (campaignsData.getCampaignDetails as jest.Mock).mockReturnValue(mockCampaign);
            (campaignsData.getIndicators as jest.Mock).mockReturnValue(mockIndicators);

            await request(app)
                .get(`/api/campaigns/${campaignId}/indicators`)
                .query({ start_date: startDate, end_date: endDate })
                .expect(200);

            expect(campaignsData.getIndicators).toHaveBeenCalledWith(
                campaignId,
                startDate,
                endDate,
                'day',
                mockCampaign
            );
        });
    });

    describe('Error handling', () => {
        it('should return 400 for invalid group_by parameter', async () => {
            const campaignId = 'test-campaign-id';

            const response = await request(app)
                .get(`/api/campaigns/${campaignId}/indicators`)
                .query({ group_by: 'invalid' })
                .expect(400);

            expect(response.body).toMatchObject({
                error: 'Invalid group_by parameter. Must be "day" or "week"',
                code: 'WRONG_PARAMETERS',
                details: { group_by: 'invalid' }
            });

            expect(campaignsData.getCampaignDetails).not.toHaveBeenCalled();
            expect(campaignsData.getIndicators).not.toHaveBeenCalled();
        });

        it('should return 404 when campaign is not found', async () => {
            const campaignId = 'non-existent-id';

            (campaignsData.getCampaignDetails as jest.Mock).mockReturnValue(null);

            const response = await request(app)
                .get(`/api/campaigns/${campaignId}/indicators`)
                .expect(404);

            expect(response.body).toMatchObject({
                error: 'Campaign not found',
                code: 'NOT_FOUND',
                details: { id: campaignId }
            });

            expect(campaignsData.getCampaignDetails).toHaveBeenCalledWith(campaignId);
            expect(campaignsData.getIndicators).not.toHaveBeenCalled();
        });

        it('should return 500 when getCampaignDetails throws an error', async () => {
            const campaignId = 'test-campaign-id';
            const mockError = new Error('Database error');

            (campaignsData.getCampaignDetails as jest.Mock).mockImplementation(() => {
                throw mockError;
            });

            const response = await request(app)
                .get(`/api/campaigns/${campaignId}/indicators`)
                .expect(500);

            expect(response.body).toEqual({ error: 'Internal server error' });
        });

        it('should return 500 when getIndicators throws an error', async () => {
            const campaignId = 'test-campaign-id';
            const mockCampaign = {
                id: campaignId,
                name: 'Test Campaign',
                description: 'Test Description',
                first_seen: '2024-01-01T00:00:00Z',
                last_seen: '2024-01-10T00:00:00Z',
                status: 'active'
            };

            (campaignsData.getCampaignDetails as jest.Mock).mockReturnValue(mockCampaign);
            (campaignsData.getIndicators as jest.Mock).mockImplementation(() => {
                throw new Error('Database query error');
            });

            const response = await request(app)
                .get(`/api/campaigns/${campaignId}/indicators`)
                .expect(500);

            expect(response.body).toEqual({ error: 'Internal server error' });
        });
    });

    describe('Request parameter handling', () => {
        it('should handle array query parameters correctly', async () => {
            const campaignId = 'test-campaign-id';
            const mockCampaign = {
                id: campaignId,
                name: 'Test Campaign',
                description: 'Test Description',
                first_seen: '2024-01-01T00:00:00Z',
                last_seen: '2024-01-10T00:00:00Z',
                status: 'active'
            };

            const mockIndicators = {
                timelineArray: [],
                uniqueIps: new Set(),
                uniqueDomains: new Set(),
                totalIndicators: 0,
                durationDays: 9
            };

            (campaignsData.getCampaignDetails as jest.Mock).mockReturnValue(mockCampaign);
            (campaignsData.getIndicators as jest.Mock).mockReturnValue(mockIndicators);

            // When query param is an array, it should use the first value or default
            await request(app)
                .get(`/api/campaigns/${campaignId}/indicators`)
                .query({ group_by: ['day', 'week'] }) // Array query param
                .expect(200);

            // Should default to 'day' when array is provided
            expect(campaignsData.getIndicators).toHaveBeenCalledWith(
                campaignId,
                undefined,
                undefined,
                'day',
                mockCampaign
            );
        });

        it('should use default group_by when not provided', async () => {
            const campaignId = 'test-campaign-id';
            const mockCampaign = {
                id: campaignId,
                name: 'Test Campaign',
                description: 'Test Description',
                first_seen: '2024-01-01T00:00:00Z',
                last_seen: '2024-01-10T00:00:00Z',
                status: 'active'
            };

            const mockIndicators = {
                timelineArray: [],
                uniqueIps: new Set(),
                uniqueDomains: new Set(),
                totalIndicators: 0,
                durationDays: 9
            };

            (campaignsData.getCampaignDetails as jest.Mock).mockReturnValue(mockCampaign);
            (campaignsData.getIndicators as jest.Mock).mockReturnValue(mockIndicators);

            await request(app)
                .get(`/api/campaigns/${campaignId}/indicators`)
                .expect(200);

            expect(campaignsData.getIndicators).toHaveBeenCalledWith(
                campaignId,
                undefined,
                undefined,
                'day', // Default value
                mockCampaign
            );
        });
    });
});
