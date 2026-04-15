import { Router } from 'express';
import permitsRouter from './permits.js';
import collectionsRouter from './collections.js';
import dashboardRouter from './dashboard.js';
import barangayShareRouter from './barangayShare.js';
import barangayPaymentRouter from './barangayPayment.js';
import barangayShareDetailsRouter from './barangayShareDetails.js';
import municipalitiesRouter from './municipalities.js';
import municipalShareRouter from './municipalShare.js';
import municipalPaymentRouter from './municipalPayment.js';
import authRouter from './auth.js';
import systemRouter from './system.js';

const router = Router();

// Mount routes
router.use('/system', systemRouter);
router.use('/auth', authRouter);
router.use('/permits', permitsRouter);
router.use('/collections', collectionsRouter);
router.use('/dashboard', dashboardRouter);
router.use('/barangay-share', barangayShareRouter);
router.use('/barangay-payment', barangayPaymentRouter);
router.use('/barangay-share-details', barangayShareDetailsRouter);
router.use('/municipalities', municipalitiesRouter);
router.use('/municipal-share', municipalShareRouter);
router.use('/municipal-payment', municipalPaymentRouter);

export default router;

