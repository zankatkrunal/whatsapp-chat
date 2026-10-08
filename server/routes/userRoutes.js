import express from 'express';
import {
  searchUsers,
  getUserById,
  updateProfile,
  changePassword,
  updatePrivacySettings,
  updateSettings,
} from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/search', searchUsers);
router.get('/:id', getUserById);
router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.put('/privacy', updatePrivacySettings);
router.put('/settings', updateSettings);

export default router;
