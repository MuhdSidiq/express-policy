import api from './api';
import { User, ApiResponse } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<User> {
    const response = await api.post<ApiResponse<{ user: User }>>('/auth/login', {
      email,
      password,
    });
    return response.data.data.user;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data.user;
  },

  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }): Promise<User> {
    const response = await api.post<ApiResponse<{ user: User }>>('/auth/register', data);
    return response.data.data.user;
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await api.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  },
};
