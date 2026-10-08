import express from 'express';
import {
  getConversations,
  getOrCreateDirectConversation,
  getConversationById,
  markConversationAsRead,
} from '../controllers/conversationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getConversations);
router.post('/direct', getOrCreateDirectConversation);
router.get('/:id', getConversationById);
router.put('/:id/read', markConversationAsRead);

export default router;
