import express from 'express';
import {
  getMessages,
  sendMessage,
  deleteMessage,
  forwardMessage,
} from '../controllers/messageController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/:conversationId', getMessages);
router.post('/', sendMessage);
router.post('/:id/delete', deleteMessage);
router.post('/:id/forward', forwardMessage);

export default router;
