import express from 'express';
import {
  getNotifications,
  markNotificationsAsRead,
} from '../controllers/notificationController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', getNotifications);
router.put('/read', markNotificationsAsRead);

export default router;
