import { Router } from 'express';
import { ChatController } from '../controllers/chat';
import { asyncHandler } from '../middleware/requestLogger';

const router = Router();
const controller = new ChatController();

router.get('/sessions', asyncHandler((req, res) => controller.getSessions(req, res)));
router.post('/sessions', asyncHandler((req, res) => controller.createSession(req, res)));
router.get('/sessions/:id', asyncHandler((req, res) => controller.getSession(req, res)));
router.post('/sessions/:id/messages', asyncHandler((req, res) => controller.sendMessage(req, res)));
router.delete('/sessions/:id', asyncHandler((req, res) => controller.deleteSession(req, res)));

export { router as chatRouter };