import { Router } from 'express';
import { getDashboard, getDashboardStats, getPlatformDashboard } from '../controllers/dashboardController.js';
import { protect, verifyRole } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/platform', protect, verifyRole(['admin', 'super_admin']), getPlatformDashboard);
router.get('/', protect, verifyRole(['admin', 'super_admin', 'owner', 'gym_admin', 'gym_manager']), getDashboard);
router.get('/stats', protect, verifyRole(['admin', 'super_admin', 'owner', 'gym_admin', 'gym_manager']), getDashboardStats);

export default router;
