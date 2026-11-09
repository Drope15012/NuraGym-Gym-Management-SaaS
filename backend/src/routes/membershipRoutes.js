import { Router } from 'express';
import { createMembership, listMemberships, membershipSchema } from '../controllers/membershipController.js';
import { protect, verifyRole } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.use(protect);
router.get('/', listMemberships);
router.post('/', verifyRole(['owner', 'admin', 'gym_admin', 'super_admin', 'gym_manager']), validateRequest(membershipSchema), createMembership);

export default router;
