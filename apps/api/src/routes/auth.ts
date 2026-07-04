import { Router } from 'express';
import { AuthController } from '../controllers/auth';
import { asyncHandler } from '../middleware/requestLogger';

const router = Router();
const controller = new AuthController();

router.post('/login', asyncHandler((req, res) => controller.login(req, res)));
router.post('/register', asyncHandler((req, res) => controller.register(req, res)));
router.post('/logout', asyncHandler((req, res) => controller.logout(req, res)));
router.post('/refresh', asyncHandler((req, res) => controller.refresh(req, res)));
router.get('/me', asyncHandler((req, res) => controller.me(req, res)));

export { router as authRouter };