import api from './api.js';

export const authService = {
  async register(userData) {
    const res = await api.post('/auth/register', userData);
    return res.data;
  },

  async login(credentials) {
    const res = await api.post('/auth/login', credentials);
    return res.data;
  },

  async logout() {
    const res = await api.post('/auth/logout');
    return res.data;
  },

  async getMe() {
    const res = await api.get('/auth/me');
    return res.data;
  },

  async sendOtp(phone) {
    const res = await api.post('/auth/send-otp', { phone });
    return res.data;
  },

  async verifyOtp(phone, otp) {
    const res = await api.post('/auth/verify-otp', { phone, otp });
    return res.data;
  },
};
