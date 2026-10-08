import BlockedUser from '../models/BlockedUser.js';
import User from '../models/User.js';

// @desc    Get all blocked users for authenticated user
// @route   GET /api/blocked
// @access  Private
export const getBlockedUsers = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const blockedList = await BlockedUser.find({ userId })
      .populate('blockedUserId', '_id fullName username avatar email phone')
      .sort({ createdAt: -1 });

    const users = blockedList
      .filter((b) => b.blockedUserId)
      .map((b) => ({
        _id: b.blockedUserId._id,
        fullName: b.blockedUserId.fullName,
        username: b.blockedUserId.username,
        avatar: b.blockedUserId.avatar,
        email: b.blockedUserId.email,
        phone: b.blockedUserId.phone,
        blockedAt: b.createdAt,
      }));

    res.status(200).json({
      success: true,
      blockedUsers: users,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Block a user
// @route   POST /api/blocked/:targetUserId
// @access  Private
export const blockUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.params;
    const { reason = '' } = req.body;

    if (userId.toString() === targetUserId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot block yourself.',
        error: 'INVALID_BLOCK_TARGET',
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'Target user not found.',
        error: 'USER_NOT_FOUND',
      });
    }

    const existingBlock = await BlockedUser.findOne({
      userId,
      blockedUserId: targetUserId,
    });

    if (existingBlock) {
      return res.status(200).json({
        success: true,
        message: 'User is already blocked.',
      });
    }

    await BlockedUser.create({
      userId,
      blockedUserId: targetUserId,
      reason,
    });

    res.status(201).json({
      success: true,
      message: `${targetUser.fullName} has been blocked.`,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Unblock a user
// @route   DELETE /api/blocked/:targetUserId
// @access  Private
export const unblockUser = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.params;

    const result = await BlockedUser.findOneAndDelete({
      userId,
      blockedUserId: targetUserId,
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'User is not in your blocked list.',
        error: 'NOT_BLOCKED',
      });
    }

    res.status(200).json({
      success: true,
      message: 'User unblocked successfully.',
    });
  } catch (err) {
    next(err);
  }
};
