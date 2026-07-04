import { Router } from 'express';
import { CourseController } from '../controllers/course';
import { asyncHandler } from '../middleware/requestLogger';

const router = Router();
const controller = new CourseController();

router.get('/', asyncHandler((req, res) => controller.list(req, res)));
router.post('/', asyncHandler((req, res) => controller.create(req, res)));
router.get('/:id', asyncHandler((req, res) => controller.get(req, res)));
router.put('/:id', asyncHandler((req, res) => controller.update(req, res)));
router.delete('/:id', asyncHandler((req, res) => controller.delete(req, res)));
router.get('/:id/lessons', asyncHandler((req, res) => controller.getLessons(req, res)));

export { router as courseRouter };