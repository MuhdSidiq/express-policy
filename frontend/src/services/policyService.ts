import api from './api';
import { Policy, ApiResponse, PaginatedResponse } from '../types';

export const policyService = {
  async list(params?: { page?: number; limit?: number; search?: string }): Promise<PaginatedResponse<Policy>> {
    const response = await api.get<PaginatedResponse<Policy>>('/admin/policies', { params });
    return response.data;
  },

  async getOne(id: string): Promise<Policy> {
    const response = await api.get<ApiResponse<Policy>>(`/admin/policies/${id}`);
    return response.data.data;
  },

  async create(data: { name: string; description?: string; isActive?: boolean }): Promise<Policy> {
    const response = await api.post<ApiResponse<Policy>>('/admin/policies', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<Policy>): Promise<Policy> {
    const response = await api.put<ApiResponse<Policy>>(`/admin/policies/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/policies/${id}`);
  },
};
