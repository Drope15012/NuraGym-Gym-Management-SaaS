import { Router } from 'express';
import { bookClass, classSchema, createClass, listClasses } from '../controllers/classController.js';
import { protect, verifyRole } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.use(protect);
router.get('/', listClasses);
router.post('/', verifyRole(['owner', 'admin', 'gym_admin', 'super_admin', 'gym_manager', 'trainer']), validateRequest(classSchema), createClass);
router.post('/:id/book', bookClass);

export default router;
