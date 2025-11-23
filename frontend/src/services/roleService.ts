import api from './api';
import { Role, ApiResponse, PaginatedResponse } from '../types';

export const roleService = {
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Role>> {
    const response = await api.get<PaginatedResponse<Role>>('/admin/roles', { params });
    return response.data;
  },

  async getOne(id: string): Promise<Role> {
    const response = await api.get<ApiResponse<Role>>(`/admin/roles/${id}`);
    return response.data.data;
  },

  async create(data: { name: string; description?: string; isActive?: boolean }): Promise<Role> {
    const response = await api.post<ApiResponse<Role>>('/admin/roles', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<Role>): Promise<Role> {
    const response = await api.put<ApiResponse<Role>>(`/admin/roles/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/roles/${id}`);
  },

  async assignPolicy(roleId: string, policyId: string): Promise<void> {
    await api.post(`/admin/roles/${roleId}/policies`, { policyId });
  },

  async removePolicy(roleId: string, policyId: string): Promise<void> {
    await api.delete(`/admin/roles/${roleId}/policies/${policyId}`);
  },
};
