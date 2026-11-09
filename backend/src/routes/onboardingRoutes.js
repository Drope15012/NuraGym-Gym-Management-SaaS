import { Router } from 'express';
import { onboardGym, onboardGymBatch, onboardingSchema, batchOnboardingSchema } from '../controllers/onboardingController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { protect, verifyRole } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/batch', protect, verifyRole(['admin', 'super_admin']), validateRequest(batchOnboardingSchema), onboardGymBatch);
router.post('/', validateRequest(onboardingSchema), onboardGym);

export default router;