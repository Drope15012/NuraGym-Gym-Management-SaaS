import { Router } from 'express';
import { createPayment, getPaymentSummary, listPayments, listRecentPayments, paymentSchema } from '../controllers/paymentController.js';
import { protect, verifyRole } from '../middleware/authMiddleware.js';
import { validateRequest } from '../middleware/validateRequest.js';

const router = Router();

router.use(protect);
router.get('/summary', verifyRole(['admin', 'super_admin', 'owner', 'gym_admin', 'gym_manager']), getPaymentSummary);
router.get('/recent', verifyRole(['admin', 'super_admin', 'owner', 'gym_admin', 'gym_manager']), listRecentPayments);
router.get('/', verifyRole(['owner', 'admin', 'gym_admin', 'gym_manager', 'super_admin']), listPayments);
router.post('/', verifyRole(['owner', 'admin', 'gym_admin', 'super_admin', 'gym_manager']), validateRequest(paymentSchema), createPayment);

export default router;
