import api from './api';
import { User, ApiResponse, PaginatedResponse } from '../types';

export const userService = {
  async list(params?: {
    page?: number;
    limit?: number;
    search?: string;
    roleId?: string;
  }): Promise<PaginatedResponse<User>> {
    const response = await api.get<PaginatedResponse<User>>('/admin/users', { params });
    return response.data;
  },

  async getOne(id: string): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/admin/users/${id}`);
    return response.data.data;
  },

  async create(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    isActive?: boolean;
  }): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/admin/users', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    const response = await api.put<ApiResponse<User>>(`/admin/users/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },

  async assignRole(userId: string, roleId: string): Promise<void> {
    await api.post(`/admin/users/${userId}/roles`, { roleId });
  },

  async removeRole(userId: string, roleId: string): Promise<void> {
    await api.delete(`/admin/users/${userId}/roles/${roleId}`);
  },
};
