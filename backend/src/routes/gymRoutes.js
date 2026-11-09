import { Router } from 'express';
import { createGym, deleteGym, getGym, listGyms, updateGym } from '../controllers/gymController.js';
import { protect, verifyRole } from '../middleware/authMiddleware.js';
import { gymLogoUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.post('/', protect, verifyRole(['admin', 'super_admin']), gymLogoUpload.single('logo'), createGym);
router.get('/', protect, verifyRole(['admin', 'super_admin']), listGyms);
router.delete('/:id', protect, verifyRole(['admin', 'super_admin']), deleteGym);
router.put('/:id', protect, verifyRole(['admin', 'super_admin']), gymLogoUpload.single('logo'), updateGym);
router.get('/:id', protect, getGym);

export default router;
