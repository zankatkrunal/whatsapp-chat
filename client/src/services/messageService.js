import api from './api.js';

export const messageService = {
  async getMessages(conversationId, before = null, limit = 50) {
    let url = `/messages/${conversationId}?limit=${limit}`;
    if (before) {
      url += `&before=${encodeURIComponent(before)}`;
    }
    const res = await api.get(url);
    return res.data;
  },

  async sendMessage(data) {
    const res = await api.post('/messages', data);
    return res.data.message;
  },

  async deleteMessage(messageId, deleteType = 'forMe') {
    const res = await api.post(`/messages/${messageId}/delete`, { deleteType });
    return res.data;
  },

  async forwardMessage(messageId, targetConversationId) {
    const res = await api.post(`/messages/${messageId}/forward`, {
      targetConversationId,
    });
    return res.data.message;
  },
};
