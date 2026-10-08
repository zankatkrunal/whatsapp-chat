import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import BlockedUser from '../models/BlockedUser.js';

// @desc    Get all conversations for logged-in user
// @route   GET /api/conversations
// @access  Private
export const getConversations = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate('participants', '_id fullName username email phone avatar about isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'senderId',
          select: '_id fullName username avatar',
        },
      })
      .populate('groupAdmin', '_id fullName username avatar')
      .sort({ lastMessageAt: -1 })
      .lean();

    // Map conversations and calculate unread count for current user
    const formatted = conversations.map((conv) => {
      const userUnread = conv.unreadCounts ? conv.unreadCounts[userId.toString()] || 0 : 0;
      return {
        ...conv,
        unreadCount: userUnread,
      };
    });

    res.status(200).json({
      success: true,
      conversations: formatted,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get or create 1-on-1 conversation
// @route   POST /api/conversations/direct
// @access  Private
export const getOrCreateDirectConversation = async (req, res, next) => {
  try {
    const { recipientId } = req.body;
    const senderId = req.user._id;

    if (!recipientId) {
      return res.status(400).json({
        success: false,
        message: 'Recipient ID is required.',
        error: 'MISSING_RECIPIENT_ID',
      });
    }

    if (recipientId.toString() === senderId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Cannot create conversation with yourself.',
        error: 'INVALID_RECIPIENT',
      });
    }

    // Check recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({
        success: false,
        message: 'Recipient user not found.',
        error: 'RECIPIENT_NOT_FOUND',
      });
    }

    // Check if blocked
    const isBlocked = await BlockedUser.findOne({
      $or: [
        { userId: senderId, blockedUserId: recipientId },
        { userId: recipientId, blockedUserId: senderId },
      ],
    });

    if (isBlocked) {
      return res.status(403).json({
        success: false,
        message: 'Cannot start conversation with this user due to blocking privacy.',
        error: 'USER_BLOCKED',
      });
    }

    // Find existing direct conversation
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [senderId, recipientId], $size: 2 },
    })
      .populate('participants', '_id fullName username email phone avatar about isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'senderId',
          select: '_id fullName username avatar',
        },
      });

    if (!conversation) {
      // Create new conversation
      conversation = await Conversation.create({
        participants: [senderId, recipientId],
        isGroup: false,
        unreadCounts: {
          [senderId.toString()]: 0,
          [recipientId.toString()]: 0,
        },
      });

      conversation = await Conversation.findById(conversation._id).populate(
        'participants',
        '_id fullName username email phone avatar about isOnline lastSeen'
      );
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single conversation by ID
// @route   GET /api/conversations/:id
// @access  Private
export const getConversationById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
    })
      .populate('participants', '_id fullName username email phone avatar about isOnline lastSeen')
      .populate({
        path: 'lastMessage',
        populate: {
          path: 'senderId',
          select: '_id fullName username avatar',
        },
      })
      .populate('groupAdmin', '_id fullName username avatar');

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or access denied.',
        error: 'CONVERSATION_NOT_FOUND',
      });
    }

    res.status(200).json({
      success: true,
      conversation,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark conversation messages as read
// @route   PUT /api/conversations/:id/read
// @access  Private
export const markConversationAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;

    const conversation = await Conversation.findOne({
      _id: id,
      participants: userId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.',
        error: 'NOT_FOUND',
      });
    }

    // Reset unread count for this user
    if (conversation.unreadCounts) {
      conversation.unreadCounts.set(userId.toString(), 0);
      await conversation.save();
    }

    // Update messages: set status to 'read' where sender != userId
    await Message.updateMany(
      {
        conversationId: id,
        senderId: { $ne: userId },
        status: { $ne: 'read' },
      },
      {
        $set: { status: 'read' },
        $addToSet: { readBy: { userId, readAt: new Date() } },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Conversation marked as read.',
    });
  } catch (err) {
    next(err);
  }
};
