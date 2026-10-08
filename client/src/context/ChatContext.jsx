import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { useAuth } from './AuthContext.jsx';
import { useSocket } from './SocketContext.jsx';
import { chatService } from '../services/chatService.js';
import { messageService } from '../services/messageService.js';
import { groupService } from '../services/groupService.js';

const ChatContext = createContext(null);

// Audio notification chime using Web Audio API (Zero external assets required)
const playNotificationSound = () => {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (e) {
    // Audio might be blocked before first user gesture
  }
};

export const ChatProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConversation, setActiveConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const [typingUsers, setTypingUsers] = useState({}); // convId -> array of names
  const [replyingTo, setReplyingTo] = useState(null);
  const [forwardingMessage, setForwardingMessage] = useState(null);
  const [selectedMessages, setSelectedMessages] = useState([]);

  const activeConvRef = useRef(activeConversation);
  activeConvRef.current = activeConversation;

  const typingTimeoutRef = useRef(null);

  // 1. Fetch Conversations on mount
  const loadConversations = useCallback(async () => {
    try {
      setLoadingConversations(true);
      const data = await chatService.getConversations();
      setConversations(data || []);
    } catch (err) {
      console.error('[Chat] Failed to load conversations:', err.message);
    } finally {
      setLoadingConversations(false);
    }
  }, []);

  const prevUserIdRef = useRef(null);

  useEffect(() => {
    const currentUserId = user?._id?.toString() || null;
    if (prevUserIdRef.current !== currentUserId) {
      // User changed or logged out: completely wipe all chat and message state!
      setConversations([]);
      setActiveConversation(null);
      setMessages([]);
      setReplyingTo(null);
      setSelectedMessages([]);
      setTypingUsers({});
      activeConvRef.current = null;
      prevUserIdRef.current = currentUserId;
    }

    if (user && user._id) {
      loadConversations();
    }
  }, [user, loadConversations]);

  // 2. Select conversation & fetch messages
  const selectConversation = useCallback(
    async (conv) => {
      if (!conv) {
        setActiveConversation(null);
        setMessages([]);
        activeConvRef.current = null;
        return;
      }

      // Leave old room
      if (socket && activeConvRef.current) {
        socket.emit('leaveConversation', activeConvRef.current._id);
      }

      setActiveConversation(conv);
      setMessages([]); // Clear previous messages immediately to prevent history flash
      setReplyingTo(null);
      setSelectedMessages([]);
      setLoadingMessages(true);

      // Join new conversation room
      if (socket) {
        socket.emit('joinConversation', conv._id);
        socket.emit('markConversationRead', { conversationId: conv._id });
      }

      try {
        const res = await messageService.getMessages(conv._id);
        setMessages(res.messages || []);
        setHasMoreMessages(res.hasMore || false);

        // Mark as read on server & update local conversation unread count
        await chatService.markAsRead(conv._id);
        setConversations((prev) =>
          prev.map((c) => (c._id === conv._id ? { ...c, unreadCount: 0 } : c))
        );
      } catch (err) {
        console.error('[Chat] Error loading messages:', err.message);
      } finally {
        setLoadingMessages(false);
      }
    },
    [socket]
  );

  // 3. Load older messages (Pagination)
  const loadMoreMessages = useCallback(async () => {
    if (!activeConversation || messages.length === 0 || loadingMessages || !hasMoreMessages) {
      return;
    }

    try {
      const oldestMsg = messages[0];
      const res = await messageService.getMessages(activeConversation._id, oldestMsg.createdAt);

      if (res.messages && res.messages.length > 0) {
        setMessages((prev) => [...res.messages, ...prev]);
        setHasMoreMessages(res.hasMore || false);
      } else {
        setHasMoreMessages(false);
      }
    } catch (err) {
      console.error('[Chat] Error loading older messages:', err.message);
    }
  }, [activeConversation, messages, loadingMessages, hasMoreMessages]);

  // 4. Send Text Message
  const sendTextMessage = useCallback(
    async (text) => {
      if (!activeConversation || !text || !text.trim()) return;

      const trimmed = text.trim();
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Identify receiver in 1-on-1 chats
      let receiverId = null;
      if (!activeConversation.isGroup) {
        const otherParticipant = activeConversation.participants.find(
          (p) => (typeof p === 'object' ? p._id : p).toString() !== user._id.toString()
        );
        receiverId = typeof otherParticipant === 'object' ? otherParticipant._id : otherParticipant;
      }

      const optimisticMsg = {
        _id: tempId,
        conversationId: activeConversation._id,
        senderId: {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          avatar: user.avatar,
        },
        receiverId,
        content: trimmed,
        messageType: 'text',
        status: 'sent',
        createdAt: new Date().toISOString(),
        replyTo: replyingTo ? { ...replyingTo } : null,
        clientTempId: tempId,
      };

      // Optimistically append to chat area
      setMessages((prev) => [...prev, optimisticMsg]);
      setReplyingTo(null);

      // Stop typing
      if (socket) {
        socket.emit('stopTyping', { conversationId: activeConversation._id });
      }

      // Send via Socket.IO
      if (socket && isConnected) {
        socket.emit(
          'sendMessage',
          {
            conversationId: activeConversation._id,
            receiverId,
            content: trimmed,
            messageType: 'text',
            replyTo: replyingTo ? replyingTo._id : null,
            clientTempId: tempId,
          },
          (response) => {
            if (response && response.success && response.message) {
              setMessages((prev) =>
                prev.map((m) => (m.clientTempId === tempId ? response.message : m))
              );
            }
          }
        );
      } else {
        // Fallback to REST API if socket is temporarily reconnecting
        try {
          const savedMsg = await messageService.sendMessage({
            conversationId: activeConversation._id,
            receiverId,
            content: trimmed,
            messageType: 'text',
            replyTo: replyingTo ? replyingTo._id : null,
            clientTempId: tempId,
          });
          setMessages((prev) =>
            prev.map((m) => (m.clientTempId === tempId ? savedMsg : m))
          );
          setConversations((prev) => {
            const idx = prev.findIndex((c) => c._id === activeConversation._id);
            if (idx !== -1) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], lastMessage: savedMsg, lastMessageAt: savedMsg.createdAt };
              const target = updated.splice(idx, 1)[0];
              return [target, ...updated];
            }
            return prev;
          });
        } catch (err) {
          console.error('[Chat] REST fallback send failed:', err.message);
        }
      }
    },
    [activeConversation, user, replyingTo, socket, isConnected]
  );

  // 5. Send Media Message
  const sendMediaMessage = useCallback(
    async (fileData, caption = '') => {
      if (!activeConversation || !fileData) return;

      const tempId = `temp-media-${Date.now()}`;

      let receiverId = null;
      if (!activeConversation.isGroup) {
        const otherParticipant = activeConversation.participants.find(
          (p) => (typeof p === 'object' ? p._id : p).toString() !== user._id.toString()
        );
        receiverId = typeof otherParticipant === 'object' ? otherParticipant._id : otherParticipant;
      }

      const optimisticMsg = {
        _id: tempId,
        conversationId: activeConversation._id,
        senderId: {
          _id: user._id,
          fullName: user.fullName,
          username: user.username,
          avatar: user.avatar,
        },
        receiverId,
        content: caption,
        messageType: fileData.messageType || 'document',
        mediaUrl: fileData.fileUrl,
        fileName: fileData.fileName,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
        status: 'sent',
        createdAt: new Date().toISOString(),
        replyTo: replyingTo ? { ...replyingTo } : null,
        clientTempId: tempId,
      };

      setMessages((prev) => [...prev, optimisticMsg]);
      setReplyingTo(null);

      if (socket && isConnected) {
        socket.emit(
          'sendMessage',
          {
            conversationId: activeConversation._id,
            receiverId,
            content: caption,
            messageType: fileData.messageType,
            mediaUrl: fileData.fileUrl,
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            mimeType: fileData.mimeType,
            replyTo: replyingTo ? replyingTo._id : null,
            clientTempId: tempId,
          },
          (response) => {
            if (response && response.success && response.message) {
              setMessages((prev) =>
                prev.map((m) => (m.clientTempId === tempId ? response.message : m))
              );
            }
          }
        );
      } else {
        try {
          const savedMsg = await messageService.sendMessage({
            conversationId: activeConversation._id,
            receiverId,
            content: caption,
            messageType: fileData.messageType || 'document',
            mediaUrl: fileData.fileUrl,
            fileName: fileData.fileName,
            fileSize: fileData.fileSize,
            mimeType: fileData.mimeType,
            replyTo: replyingTo ? replyingTo._id : null,
            clientTempId: tempId,
          });
          setMessages((prev) =>
            prev.map((m) => (m.clientTempId === tempId ? savedMsg : m))
          );
        } catch (err) {
          console.error('[Chat] Media REST send failed:', err.message);
        }
      }
    },
    [activeConversation, user, replyingTo, socket, isConnected]
  );

  // 6. Delete Message
  const deleteMessage = useCallback(
    async (messageId, deleteType = 'forMe') => {
      try {
        await messageService.deleteMessage(messageId, deleteType);

        if (deleteType === 'forEveryone') {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === messageId
                ? {
                    ...m,
                    content: 'This message was deleted',
                    isDeletedEveryone: true,
                    mediaUrl: '',
                    fileName: '',
                  }
                : m
            )
          );

          if (socket && activeConversation) {
            socket.emit('messageDeleted', {
              messageId,
              conversationId: activeConversation._id,
              deleteType: 'forEveryone',
            });
          }
        } else {
          // Delete for me
          setMessages((prev) => prev.filter((m) => m._id !== messageId));
        }
      } catch (err) {
        console.error('[Chat] Delete message failed:', err.message);
      }
    },
    [socket, activeConversation]
  );

  // 7. Forward Message
  const forwardMessage = useCallback(
    async (messageId, targetConvId) => {
      try {
        const forwarded = await messageService.forwardMessage(messageId, targetConvId);
        if (socket) {
          socket.emit('messageForwarded', {
            targetConversationId: targetConvId,
            message: forwarded,
          });
        }
        await loadConversations();
        return forwarded;
      } catch (err) {
        console.error('[Chat] Forward message failed:', err.message);
        throw err;
      }
    },
    [socket, loadConversations]
  );

  // 8. Typing Notification
  const notifyTyping = useCallback(
    (isTyping) => {
      if (!socket || !activeConversation) return;

      if (isTyping) {
        socket.emit('typing', { conversationId: activeConversation._id });

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
          socket.emit('stopTyping', { conversationId: activeConversation._id });
        }, 3000);
      } else {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        socket.emit('stopTyping', { conversationId: activeConversation._id });
      }
    },
    [socket, activeConversation]
  );

  // 9. Create Direct Chat
  const createDirectConversation = useCallback(
    async (recipientId) => {
      try {
        const conv = await chatService.getOrCreateDirect(recipientId);
        await loadConversations();
        selectConversation(conv);
        return conv;
      } catch (err) {
        console.error('[Chat] Create direct conversation failed:', err.message);
        throw err;
      }
    },
    [loadConversations, selectConversation]
  );

  // 10. Create Group
  const createNewGroup = useCallback(
    async (groupData) => {
      try {
        const res = await groupService.createGroup(groupData);
        if (socket) {
          socket.emit('groupCreated', {
            group: res.group,
            conversation: res.conversation,
          });
        }
        await loadConversations();
        if (res.conversation) {
          selectConversation(res.conversation);
        }
        return res;
      } catch (err) {
        console.error('[Chat] Create group failed:', err.message);
        throw err;
      }
    },
    [socket, loadConversations, selectConversation]
  );

  // 11. Multi-message selection helpers
  const toggleMessageSelection = (msgId) => {
    setSelectedMessages((prev) =>
      prev.includes(msgId) ? prev.filter((id) => id !== msgId) : [...prev, msgId]
    );
  };

  const clearMessageSelection = () => {
    setSelectedMessages([]);
  };

  // 12. Listen to Real-Time Socket Events
  useEffect(() => {
    if (!socket) return;

    // Incoming message
    const handleReceiveMessage = (incomingMsg) => {
      const isCurrentChat =
        activeConvRef.current &&
        activeConvRef.current._id === incomingMsg.conversationId;

      if (isCurrentChat) {
        setMessages((prev) => {
          // If optimistic message exists with matching clientTempId, replace it
          if (incomingMsg.clientTempId) {
            const hasTemp = prev.some((m) => m.clientTempId === incomingMsg.clientTempId);
            if (hasTemp) {
              return prev.map((m) =>
                m.clientTempId === incomingMsg.clientTempId ? incomingMsg : m
              );
            }
          }
          // Avoid duplicate by _id
          if (prev.some((m) => m._id === incomingMsg._id)) {
            return prev;
          }
          return [...prev, incomingMsg];
        });

        // Acknowledge read immediately since user is actively viewing
        socket.emit('markConversationRead', {
          conversationId: incomingMsg.conversationId,
        });
      }

      // Play audio notification chime for incoming message (not sent by oneself)
      const senderIdStr =
        typeof incomingMsg.senderId === 'object'
          ? incomingMsg.senderId._id
          : incomingMsg.senderId;

      if (user && senderIdStr !== user._id.toString()) {
        playNotificationSound();
      }

      // Update sidebar conversations list
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === incomingMsg.conversationId);
        if (idx !== -1) {
          const updated = [...prev];
          const target = { ...updated[idx] };
          target.lastMessage = incomingMsg;
          target.lastMessageAt = incomingMsg.createdAt;
          if (!isCurrentChat) {
            target.unreadCount = (target.unreadCount || 0) + 1;
          }
          // Move conversation to top
          updated.splice(idx, 1);
          return [target, ...updated];
        } else {
          // Newly initialized conversation, refresh list
          loadConversations();
          return prev;
        }
      });
    };

    // Message delivery status update (✓ -> ✓✓)
    const handleMessageDelivered = ({ messageId, conversationId, status }) => {
      if (activeConvRef.current && activeConvRef.current._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m._id === messageId ? { ...m, status: 'delivered' } : m))
        );
      }
    };

    // Message read status update (✓✓ -> blue ✓✓)
    const handleMessageRead = ({ conversationId, readerId }) => {
      if (activeConvRef.current && activeConvRef.current._id === conversationId) {
        setMessages((prev) =>
          prev.map((m) => (m.status !== 'read' ? { ...m, status: 'read' } : m))
        );
      }
    };

    // Real-time typing indicators
    const handleTyping = ({ conversationId, userName }) => {
      setTypingUsers((prev) => {
        const currentList = prev[conversationId] || [];
        if (!currentList.includes(userName)) {
          return { ...prev, [conversationId]: [...currentList, userName] };
        }
        return prev;
      });
    };

    const handleStopTyping = ({ conversationId, userId }) => {
      setTypingUsers((prev) => {
        const currentList = prev[conversationId] || [];
        return {
          ...prev,
          [conversationId]: currentList.filter((name) => name !== userId),
        };
      });
    };

    // Real-time message deletion
    const handleMessageDeleted = ({ messageId, conversationId, deleteType }) => {
      if (activeConvRef.current && activeConvRef.current._id === conversationId) {
        if (deleteType === 'forEveryone') {
          setMessages((prev) =>
            prev.map((m) =>
              m._id === messageId
                ? {
                    ...m,
                    content: 'This message was deleted',
                    isDeletedEveryone: true,
                    mediaUrl: '',
                    fileName: '',
                  }
                : m
            )
          );
        }
      }
    };

    // New conversation created
    const handleNewConversation = (newConv) => {
      setConversations((prev) => {
        if (prev.some((c) => c._id === newConv._id)) return prev;
        return [newConv, ...prev];
      });
    };

    // Conversation preview update
    const handleConversationUpdated = ({ conversationId, lastMessage, unreadCount }) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c._id === conversationId) {
            return {
              ...c,
              lastMessage: lastMessage || c.lastMessage,
              lastMessageAt: lastMessage?.createdAt || c.lastMessageAt,
              unreadCount: unreadCount !== undefined ? unreadCount : c.unreadCount,
            };
          }
          return c;
        })
      );
    };

    socket.on('receiveMessage', handleReceiveMessage);
    socket.on('messageDelivered', handleMessageDelivered);
    socket.on('messageRead', handleMessageRead);
    socket.on('typing', handleTyping);
    socket.on('stopTyping', handleStopTyping);
    socket.on('messageDeleted', handleMessageDeleted);
    socket.on('newConversation', handleNewConversation);
    socket.on('conversationUpdated', handleConversationUpdated);

    return () => {
      socket.off('receiveMessage', handleReceiveMessage);
      socket.off('messageDelivered', handleMessageDelivered);
      socket.off('messageRead', handleMessageRead);
      socket.off('typing', handleTyping);
      socket.off('stopTyping', handleStopTyping);
      socket.off('messageDeleted', handleMessageDeleted);
      socket.off('newConversation', handleNewConversation);
      socket.off('conversationUpdated', handleConversationUpdated);
    };
  }, [socket, user, loadConversations]);

  // 13. Smart Real-Time Polling Engine (Active whenever WebSockets are unavailable or on Vercel)
  useEffect(() => {
    if (!user) return;

    // Fast active chat message polling (every 1.5 seconds)
    const messagePollInterval = setInterval(async () => {
      const currentActiveConv = activeConvRef.current;
      if (!currentActiveConv) return;

      try {
        const res = await messageService.getMessages(currentActiveConv._id);
        const serverMessages = res.messages || [];

        setMessages((prev) => {
          if (serverMessages.length === 0) return prev;

          const prevMap = new Map(prev.map((m) => [m._id, m]));
          let hasNewMessage = false;
          let newIncomingFromOther = false;

          for (const sMsg of serverMessages) {
            const existing = prevMap.get(sMsg._id);
            if (!existing) {
              hasNewMessage = true;
              const senderIdStr =
                typeof sMsg.senderId === 'object' ? sMsg.senderId._id : sMsg.senderId;
              if (senderIdStr && senderIdStr.toString() !== user._id.toString()) {
                newIncomingFromOther = true;
              }
            } else if (existing.status !== sMsg.status) {
              hasNewMessage = true;
            }
          }

          if (newIncomingFromOther) {
            playNotificationSound();
          }

          if (hasNewMessage || serverMessages.length !== prev.length) {
            const tempMessages = prev.filter((m) => m._id && m._id.startsWith('temp-'));
            const merged = [...serverMessages];
            tempMessages.forEach((t) => {
              if (!merged.some((m) => m.clientTempId === t.clientTempId)) {
                merged.push(t);
              }
            });
            return merged;
          }

          return prev;
        });
      } catch (err) {
        // Silent background sync
      }
    }, 1500);

    // Periodic conversation list sync (every 3.5 seconds)
    const convPollInterval = setInterval(async () => {
      try {
        const data = await chatService.getConversations();
        if (data && Array.isArray(data)) {
          setConversations((prev) => {
            const hasChanged =
              data.length !== prev.length ||
              JSON.stringify(data.map((c) => ({ id: c._id, unread: c.unreadCount, last: c.lastMessage?._id }))) !==
                JSON.stringify(prev.map((c) => ({ id: c._id, unread: c.unreadCount, last: c.lastMessage?._id })));
            return hasChanged ? data : prev;
          });
        }
      } catch (err) {
        // Silent background sync
      }
    }, 3500);

    return () => {
      clearInterval(messagePollInterval);
      clearInterval(convPollInterval);
    };
  }, [user]);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        activeConversation,
        messages,
        loadingConversations,
        loadingMessages,
        hasMoreMessages,
        typingUsers,
        replyingTo,
        forwardingMessage,
        selectedMessages,
        selectConversation,
        loadMoreMessages,
        sendTextMessage,
        sendMediaMessage,
        deleteMessage,
        forwardMessage,
        setReplyingTo,
        cancelReply: () => setReplyingTo(null),
        setForwardingMessage,
        notifyTyping,
        createDirectConversation,
        createNewGroup,
        toggleMessageSelection,
        clearMessageSelection,
        refreshConversations: loadConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
