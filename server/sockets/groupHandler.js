export const registerGroupHandlers = (io, socket) => {
  // When a new group is created, notify each participant
  socket.on('groupCreated', ({ group, conversation }) => {
    if (!conversation || !conversation.participants) return;

    conversation.participants.forEach((p) => {
      const pId = typeof p === 'object' ? p._id : p;
      if (pId) {
        io.to(`user_${pId.toString()}`).emit('newConversation', conversation);
        io.to(`user_${pId.toString()}`).emit('groupCreated', { group, conversation });
      }
    });
  });

  // When members are added
  socket.on('groupMemberAdded', ({ groupId, conversationId, addedUserIds, updatedConversation }) => {
    if (!conversationId) return;

    // Notify room
    io.to(`conversation_${conversationId}`).emit('groupMemberAdded', {
      groupId,
      conversationId,
      addedUserIds,
      updatedConversation,
    });

    // Notify newly added users directly
    if (Array.isArray(addedUserIds)) {
      addedUserIds.forEach((uId) => {
        io.to(`user_${uId.toString()}`).emit('newConversation', updatedConversation);
      });
    }
  });

  // When a member is removed
  socket.on('groupMemberRemoved', ({ groupId, conversationId, removedUserId, updatedConversation }) => {
    if (!conversationId) return;

    io.to(`conversation_${conversationId}`).emit('groupMemberRemoved', {
      groupId,
      conversationId,
      removedUserId,
      updatedConversation,
    });

    if (removedUserId) {
      io.to(`user_${removedUserId.toString()}`).emit('removedFromGroup', {
        groupId,
        conversationId,
      });
    }
  });

  // When group details are updated
  socket.on('groupUpdated', ({ groupId, conversationId, updatedGroup }) => {
    if (!conversationId) return;

    io.to(`conversation_${conversationId}`).emit('groupUpdated', {
      groupId,
      conversationId,
      updatedGroup,
    });
  });
};
