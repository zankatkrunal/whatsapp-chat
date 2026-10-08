import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import BlockedUser from '../models/BlockedUser.js';
import { isUserOnline } from './presenceHandler.js';

export const registerChatHandlers = (io, socket) => {
  // Join specific conversation room
  socket.on('joinConversation', (conversationId) => {
    if (!conversationId) return;
    const roomName = `conversation_${conversationId}`;
    socket.join(roomName);
  });

  // Leave specific conversation room
  socket.on('leaveConversation', (conversationId) => {
    if (!conversationId) return;
    const roomName = `conversation_${conversationId}`;
    socket.leave(roomName);
  });

  // Real-time message sending
  socket.on('sendMessage', async (data, callback) => {
    try {
      const {
        conversationId,
        receiverId,
        content = '',
        messageType = 'text',
        mediaUrl = '',
        fileName = '',
        fileSize = 0,
        mimeType = '',
        replyTo = null,
        clientTempId = '',
      } = data;
      const senderId = socket.userId;

      if (!conversationId) {
        if (callback) callback({ success: false, error: 'Conversation ID required' });
        return;
      }

      // Verify conversation
      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: senderId,
      });

      if (!conversation) {
        if (callback) callback({ success: false, error: 'Conversation not found or not participant' });
        return;
      }

      // Check blocking if direct
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
            if (callback) callback({ success: false, error: 'User is blocked' });
            socket.emit('errorNotification', {
              message: 'Cannot send message to blocked user.',
            });
            return;
          }
        }
      }

      // Determine initial delivery status
      let initialStatus = 'sent';
      const isRecipientOnline = receiverId ? isUserOnline(receiverId) : false;

      // Check if recipient is active in the conversation room
      const convRoom = io.sockets.adapter.rooms.get(`conversation_${conversationId}`);
      let isRecipientActiveInRoom = false;

      if (receiverId && convRoom) {
        // Find if any of receiver's sockets are in the room
        for (const sockId of convRoom) {
          const recipientSocket = io.sockets.sockets.get(sockId);
          if (recipientSocket && recipientSocket.userId === receiverId.toString()) {
            isRecipientActiveInRoom = true;
            break;
          }
        }
      }

      if (isRecipientActiveInRoom) {
        initialStatus = 'read';
      } else if (isRecipientOnline) {
        initialStatus = 'delivered';
      }

      // Save message in MongoDB (Message must be saved before/around delivery)
      const messageDoc = await Message.create({
        conversationId,
        senderId,
        receiverId: receiverId || null,
        content,
        messageType,
        mediaUrl,
        fileName,
        fileSize,
        mimeType,
        replyTo: replyTo || null,
        clientTempId,
        status: initialStatus,
        deliveredTo: isRecipientOnline && receiverId ? [{ userId: receiverId, deliveredAt: new Date() }] : [],
        readBy: isRecipientActiveInRoom && receiverId ? [{ userId: receiverId, readAt: new Date() }] : [],
      });

      // Populate sender and replyTo
      const populatedMessage = await Message.findById(messageDoc._id)
        .populate('senderId', '_id fullName username avatar')
        .populate({
          path: 'replyTo',
          select: '_id content senderId messageType mediaUrl fileName',
          populate: {
            path: 'senderId',
            select: '_id fullName username',
          },
        });

      // Update Conversation lastMessage & unread count
      conversation.lastMessage = populatedMessage._id;
      conversation.lastMessageAt = populatedMessage.createdAt;

      if (!conversation.unreadCounts) {
        conversation.unreadCounts = new Map();
      }

      conversation.participants.forEach((pId) => {
        const idStr = pId.toString();
        if (idStr !== senderId.toString()) {
          // If recipient is already viewing room, keep unread at 0, otherwise increment
          if (!isRecipientActiveInRoom) {
            const currentCount = conversation.unreadCounts.get(idStr) || 0;
            conversation.unreadCounts.set(idStr, currentCount + 1);
          }
        }
      });

      await conversation.save();

      // Emit ack / messageSent to sender
      socket.emit('messageSent', {
        message: populatedMessage,
        clientTempId,
      });

      // Broadcast receiveMessage to conversation room (excluding sender socket)
      socket.to(`conversation_${conversationId}`).emit('receiveMessage', populatedMessage);

      // Also notify participants through their personal rooms (for sidebar previews & badge counts)
      conversation.participants.forEach((pId) => {
        const pIdStr = pId.toString();
        if (pIdStr !== senderId.toString()) {
          io.to(`user_${pIdStr}`).emit('conversationUpdated', {
            conversationId,
            lastMessage: populatedMessage,
            unreadCount: conversation.unreadCounts.get(pIdStr) || 0,
          });
          io.to(`user_${pIdStr}`).emit('receiveMessage', populatedMessage);
        }
      });

      // If delivered or read, inform sender immediately
      if (initialStatus === 'delivered') {
        socket.emit('messageDelivered', {
          messageId: populatedMessage._id,
          conversationId,
          status: 'delivered',
        });
      } else if (initialStatus === 'read') {
        socket.emit('messageRead', {
          conversationId,
          messageId: populatedMessage._id,
          status: 'read',
        });
      }

      if (callback) {
        callback({ success: true, message: populatedMessage });
      }
    } catch (err) {
      console.error('[Socket Chat] sendMessage error:', err.message);
      if (callback) callback({ success: false, error: err.message });
    }
  });

  // Message read acknowledgment from client
  socket.on('markConversationRead', async ({ conversationId }) => {
    try {
      if (!conversationId) return;
      const userId = socket.userId;

      const conversation = await Conversation.findOne({
        _id: conversationId,
        participants: userId,
      });

      if (!conversation) return;

      if (conversation.unreadCounts) {
        conversation.unreadCounts.set(userId, 0);
        await conversation.save();
      }

      // Update all messages in this conversation where sender != userId
      await Message.updateMany(
        {
          conversationId,
          senderId: { $ne: userId },
          status: { $ne: 'read' },
        },
        {
          $set: { status: 'read' },
          $addToSet: { readBy: { userId, readAt: new Date() } },
        }
      );

      // Broadcast to room that messages are read
      io.to(`conversation_${conversationId}`).emit('messageRead', {
        conversationId,
        readerId: userId,
        status: 'read',
      });

      // Notify the reader's other tabs to reset unread count
      io.to(`user_${userId}`).emit('conversationUpdated', {
        conversationId,
        unreadCount: 0,
      });
    } catch (err) {
      console.error('[Socket Chat] markConversationRead error:', err.message);
    }
  });

  // Typing indicator
  socket.on('typing', ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(`conversation_${conversationId}`).emit('typing', {
      conversationId,
      userId: socket.userId,
      userName: socket.user.fullName,
    });
  });

  socket.on('stopTyping', ({ conversationId }) => {
    if (!conversationId) return;
    socket.to(`conversation_${conversationId}`).emit('stopTyping', {
      conversationId,
      userId: socket.userId,
    });
  });

  // Real-time message deletion event
  socket.on('messageDeleted', ({ messageId, conversationId, deleteType }) => {
    if (!conversationId) return;
    io.to(`conversation_${conversationId}`).emit('messageDeleted', {
      messageId,
      conversationId,
      deleteType,
      senderId: socket.userId,
    });
  });

  // Real-time message forwarded event
  socket.on('messageForwarded', ({ targetConversationId, message }) => {
    if (!targetConversationId) return;
    io.to(`conversation_${targetConversationId}`).emit('receiveMessage', message);
  });
};
