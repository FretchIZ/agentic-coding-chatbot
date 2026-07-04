import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics';
import { asyncHandler } from '../middleware/requestLogger';

const router = Router();
const controller = new AnalyticsController();

router.post('/events', asyncHandler((req, res) => controller.trackEvents(req, res)));
router.get('/progress/:userId', asyncHandler((req, res) => controller.getProgress(req, res)));
router.put('/progress/:userId/:lessonId', asyncHandler((req, res) => controller.updateProgress(req, res)));
router.get('/engagement/:userId', asyncHandler((req, res) => controller.getEngagement(req, res)));
router.get('/performance/:userId', asyncHandler((req, res) => controller.getPerformance(req, res)));

export { router as analyticsRouter };