import api from './api.js';

export const chatService = {
  async getConversations() {
    const res = await api.get('/conversations');
    return res.data.conversations;
  },

  async getOrCreateDirect(recipientId) {
    const res = await api.post('/conversations/direct', { recipientId });
    return res.data.conversation;
  },

  async getConversationById(id) {
    const res = await api.get(`/conversations/${id}`);
    return res.data.conversation;
  },

  async markAsRead(id) {
    const res = await api.put(`/conversations/${id}/read`);
    return res.data;
  },
};
