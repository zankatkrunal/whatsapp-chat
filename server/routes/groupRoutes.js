import express from 'express';
import {
  createGroup,
  getGroupDetails,
  updateGroup,
  addMembers,
  removeMember,
  leaveGroup,
} from '../controllers/groupController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createGroup);
router.get('/:id', getGroupDetails);
router.put('/:id', updateGroup);
router.post('/:id/members', addMembers);
router.delete('/:id/members/:userId', removeMember);
router.post('/:id/leave', leaveGroup);

export default router;
