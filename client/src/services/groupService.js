import api from './api.js';

export const groupService = {
  async createGroup(data) {
    const res = await api.post('/groups', data);
    return res.data;
  },

  async getGroupDetails(id) {
    const res = await api.get(`/groups/${id}`);
    return res.data.group;
  },

  async updateGroup(id, data) {
    const res = await api.put(`/groups/${id}`, data);
    return res.data.group;
  },

  async addMembers(id, userIds) {
    const res = await api.post(`/groups/${id}/members`, { userIds });
    return res.data;
  },

  async removeMember(id, userId) {
    const res = await api.delete(`/groups/${id}/members/${userId}`);
    return res.data;
  },

  async leaveGroup(id) {
    const res = await api.post(`/groups/${id}/leave`);
    return res.data;
  },
};
