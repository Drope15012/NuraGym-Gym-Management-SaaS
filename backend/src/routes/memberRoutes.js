import { Router } from 'express';
import { createMember, listMembers, memberSchema } from '../controllers/memberController.js';
import { protect, verifyRole } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.get('/', protect, verifyRole(['super_admin', 'admin', 'gym_admin', 'owner', 'gym_manager']), listMembers);
router.post('/', protect, verifyRole(['super_admin', 'admin', 'gym_admin', 'owner', 'gym_manager']), validateRequest(memberSchema), createMember);

export default router;
