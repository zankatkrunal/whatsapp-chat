import express from 'express';
import {
  getBlockedUsers,
  blockUser,
  unblockUser,
} from '../controllers/blockController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getBlockedUsers);
router.post('/:targetUserId', blockUser);
router.delete('/:targetUserId', unblockUser);

export default router;
