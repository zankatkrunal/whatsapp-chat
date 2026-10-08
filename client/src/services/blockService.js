import api from './api.js';

export const blockService = {
  async getBlockedUsers() {
    const res = await api.get('/blocked');
    return res.data.blockedUsers;
  },

  async blockUser(targetUserId, reason = '') {
    const res = await api.post(`/blocked/${targetUserId}`, { reason });
    return res.data;
  },

  async unblockUser(targetUserId) {
    const res = await api.delete(`/blocked/${targetUserId}`);
    return res.data;
  },
};
