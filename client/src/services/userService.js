import api from './api.js';

export const userService = {
  async searchUsers(query) {
    const res = await api.get(`/users/search?q=${encodeURIComponent(query)}`);
    return res.data.users;
  },

  async getUserById(id) {
    const res = await api.get(`/users/${id}`);
    return res.data.user;
  },

  async updateProfile(data) {
    const res = await api.put('/users/profile', data);
    return res.data.user;
  },

  async changePassword(currentPassword, newPassword) {
    const res = await api.put('/users/change-password', {
      currentPassword,
      newPassword,
    });
    return res.data;
  },

  async updatePrivacy(privacyData) {
    const res = await api.put('/users/privacy', privacyData);
    return res.data.privacy;
  },

  async updateSettings(settingsData) {
    const res = await api.put('/users/settings', settingsData);
    return res.data.settings;
  },
};
