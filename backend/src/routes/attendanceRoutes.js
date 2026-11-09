import { Router } from 'express';
import { protect, verifyRole } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { checkInMember, checkInSchema, listTodayCheckIns, memberSearchSchema, searchMembers } from '../controllers/attendanceController.js';

const router = Router();
const managerRoles = ['admin', 'super_admin', 'owner', 'gym_admin', 'gym_manager'];

router.use(protect, verifyRole(managerRoles));
router.get('/members', validateRequest(memberSearchSchema), searchMembers);
router.get('/today', listTodayCheckIns);
router.post('/', validateRequest(checkInSchema), checkInMember);

export default router;
