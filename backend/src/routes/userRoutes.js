import { Router } from 'express';
import { createMember, listUsers, login, loginSchema, me, memberCreateSchema, register, registerSchema } from '../controllers/userController.js';
import { protect, verifyRole } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.post('/register', protect, verifyRole(['super_admin', 'admin', 'gym_admin', 'owner']), validateRequest(registerSchema), register);
router.post('/login', validateRequest(loginSchema), login);
router.get('/me', protect, me);
router.get('/', protect, verifyRole(['super_admin', 'admin', 'gym_admin', 'owner', 'gym_manager']), listUsers);
router.post('/', protect, verifyRole(['super_admin', 'admin', 'gym_admin', 'owner']), validateRequest(memberCreateSchema), createMember);

export default router;
