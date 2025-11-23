import api from './api';
import { Permission, ApiResponse } from '../types';

export const permissionService = {
  async list(policyId?: string): Promise<Permission[]> {
    const response = await api.get<ApiResponse<Permission[]>>('/admin/permissions', {
      params: { policyId },
    });
    return response.data.data;
  },

  async create(data: {
    policyId: string;
    action: string;
    subject: string;
    fields?: string[];
    conditions?: Record<string, any> | null;
    inverted?: boolean;
    reason?: string;
  }): Promise<Permission> {
    const response = await api.post<ApiResponse<Permission>>('/admin/permissions', data);
    return response.data.data;
  },

  async update(id: string, data: Partial<Permission>): Promise<Permission> {
    const response = await api.put<ApiResponse<Permission>>(`/admin/permissions/${id}`, data);
    return response.data.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/admin/permissions/${id}`);
  },

  async getMatrix(): Promise<any> {
    const response = await api.get<ApiResponse<any>>('/admin/permission-matrix');
    return response.data.data;
  },

  async testPermission(data: {
    userId: string;
    action: string;
    subject: string;
    subjectData?: any;
  }): Promise<any> {
    const response = await api.post<any>('/admin/permission-test', data);
    return response.data;
  },
};
