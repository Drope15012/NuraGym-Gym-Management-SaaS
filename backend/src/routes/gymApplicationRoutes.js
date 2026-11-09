import { Router } from 'express';
import { createGymApplication, listGymApplications, applyGymSchema } from '../controllers/gymApplicationController.js';
import { protect, verifyRole } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.post('/apply', validateRequest(applyGymSchema), createGymApplication);
router.get('/', protect, verifyRole(['admin', 'super_admin']), listGymApplications);

export default router;