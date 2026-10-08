import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import BlockedUser from '../models/BlockedUser.js';

// @desc    Get messages for a conversation with pagination
// @route   GET /api/messages/:conversationId
// @access  Private
export const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { before, limit = 50 } = req.query;
    const userId = req.user._id;

    // Check conversation access
    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: userId,
    });

    if (!conversation) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this conversation.',
        error: 'ACCESS_DENIED',
      });
    }

    const query = {
      conversationId,
      deletedFor: { $ne: userId },
    };

    if (before) {
      query.createdAt = { $lt: new Date(before) };
    }

    const pageSize = Math.min(parseInt(limit, 10) || 50, 100);

    const messages = await Message.find(query)
      .populate('senderId', '_id fullName username avatar')
      .populate({
        path: 'replyTo',
        select: '_id content senderId messageType mediaUrl fileName',
        populate: {
          path: 'senderId',
          select: '_id fullName username',
        },
      })
      .sort({ createdAt: -1 })
      .limit(pageSize)
      .lean();

    // Mask deleted-for-everyone messages
    const formatted = messages.map((msg) => {
      if (msg.isDeletedEveryone) {
        return {
          ...msg,
          content: 'This message was deleted',
          mediaUrl: '',
          fileName: '',
          fileSize: 0,
        };
      }
      return msg;
    });

    // Return in chronological ascending order
    res.status(200).json({
      success: true,
      messages: formatted.reverse(),
      hasMore: messages.length === pageSize,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Send a message (REST API)
// @route   POST /api/messages
// @access  Private
export const sendMessage = async (req, res, next) => {
  try {
    const {
      conversationId,
      receiverId,
      content,
      messageType = 'text',
      mediaUrl,
      fileName,
      fileSize,
      mimeType,
      replyTo,
      clientTempId,
    } = req.body;
    const senderId = req.user._id;

    if (!conversationId) {
      return res.status(400).json({
        success: false,
        message: 'Conversation ID is required.',
        error: 'MISSING_CONVERSATION_ID',
      });
    }

    const conversation = await Conversation.findOne({
      _id: conversationId,
      participants: senderId,
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found or not a participant.',
        error: 'NOT_FOUND',
      });
    }

    // Check blocking if direct 1-on-1
    if (!conversation.isGroup) {
      const otherParticipant = conversation.participants.find(
        (p) => p.toString() !== senderId.toString()
      );
      if (otherParticipant) {
        const isBlocked = await BlockedUser.findOne({
          $or: [
            { userId: senderId, blockedUserId: otherParticipant },
            { userId: otherParticipant, blockedUserId: senderId },
          ],
        });
        if (isBlocked) {
          return res.status(403).json({
            success: false,
            message: 'Cannot send message. User is blocked or has blocked you.',
            error: 'USER_BLOCKED',
          });
        }
      }
    }

    // Create the message
    const newMessage = await Message.create({
      conversationId,
      senderId,
      receiverId: receiverId || null,
      content: content || '',
      messageType,
      mediaUrl: mediaUrl || '',
      fileName: fileName || '',
      fileSize: fileSize || 0,
      mimeType: mimeType || '',
      replyTo: replyTo || null,
      clientTempId: clientTempId || '',
      status: 'sent',
    });

    // Populate sender & replyTo
    const populated = await Message.findById(newMessage._id)
      .populate('senderId', '_id fullName username avatar')
      .populate({
        path: 'replyTo',
        select: '_id content senderId messageType mediaUrl fileName',
        populate: {
          path: 'senderId',
          select: '_id fullName username',
        },
      });

    // Update conversation lastMessage & unread count
    conversation.lastMessage = populated._id;
    conversation.lastMessageAt = populated.createdAt;

    if (!conversation.unreadCounts) {
      conversation.unreadCounts = new Map();
    }

    conversation.participants.forEach((pId) => {
      const idStr = pId.toString();
      if (idStr !== senderId.toString()) {
        const currentCount = conversation.unreadCounts.get(idStr) || 0;
        conversation.unreadCounts.set(idStr, currentCount + 1);
      }
    });

    await conversation.save();

    res.status(201).json({
      success: true,
      message: populated,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete message (forMe or forEveryone)
// @route   POST /api/messages/:id/delete
// @access  Private
export const deleteMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { deleteType } = req.body; // 'forMe' | 'forEveryone'
    const userId = req.user._id;

    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({
        success: false,
        message: 'Message not found.',
        error: 'MESSAGE_NOT_FOUND',
      });
    }

    if (deleteType === 'forEveryone') {
      if (message.senderId.toString() !== userId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own messages for everyone.',
          error: 'UNAUTHORIZED_ACTION',
        });
      }
      message.isDeletedEveryone = true;
      message.content = 'This message was deleted';
      message.mediaUrl = '';
      message.fileName = '';
      await message.save();
    } else {
      // Delete for me
      if (!message.deletedFor.includes(userId)) {
        message.deletedFor.push(userId);
        await message.save();
      }
    }

    res.status(200).json({
      success: true,
      messageId: message._id,
      deleteType,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Forward message to another conversation
// @route   POST /api/messages/:id/forward
// @access  Private
export const forwardMessage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { targetConversationId } = req.body;
    const userId = req.user._id;

    if (!targetConversationId) {
      return res.status(400).json({
        success: false,
        message: 'Target conversation is required.',
        error: 'MISSING_TARGET_CONVERSATION',
      });
    }

    const original = await Message.findById(id);
    if (!original) {
      return res.status(404).json({
        success: false,
        message: 'Original message not found.',
        error: 'MESSAGE_NOT_FOUND',
      });
    }

    const targetConv = await Conversation.findOne({
      _id: targetConversationId,
      participants: userId,
    });

    if (!targetConv) {
      return res.status(404).json({
        success: false,
        message: 'Target conversation not found or access denied.',
        error: 'TARGET_NOT_FOUND',
      });
    }

    const forwardedMsg = await Message.create({
      conversationId: targetConversationId,
      senderId: userId,
      content: original.content,
      messageType: original.messageType,
      mediaUrl: original.mediaUrl,
      fileName: original.fileName,
      fileSize: original.fileSize,
      mimeType: original.mimeType,
      isForwarded: true,
      status: 'sent',
    });

    const populated = await Message.findById(forwardedMsg._id).populate(
      'senderId',
      '_id fullName username avatar'
    );

    targetConv.lastMessage = populated._id;
    targetConv.lastMessageAt = populated.createdAt;
    await targetConv.save();

    res.status(201).json({
      success: true,
      message: populated,
    });
  } catch (err) {
    next(err);
  }
};
