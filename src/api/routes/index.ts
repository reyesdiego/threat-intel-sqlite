import {Express} from "express";
import indicatorsRouter from './indicators';
import campaignsRouter from './campaigns';
import dashboardRouter from './dashboard';

export const initRoutes = (app: Express) => {
    app.use('/api/indicators', indicatorsRouter);
    app.use('/api/campaigns', campaignsRouter);
    app.use('/api/dashboard', dashboardRouter);
}
