import { create } from 'zustand';
import { roleService } from '../services/roleService';
import { Role } from '../types';

interface RoleState {
  roles: Role[];
  selectedRole: Role | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  fetchRoles: (params?: { page?: number; limit?: number; search?: string }) => Promise<void>;
  createRole: (data: { name: string; description?: string }) => Promise<void>;
  updateRole: (id: string, data: Partial<Role>) => Promise<void>;
  deleteRole: (id: string) => Promise<void>;
  selectRole: (role: Role | null) => void;
  setError: (error: string | null) => void;
}

export const useRoleStore = create<RoleState>((set, get) => ({
  roles: [],
  selectedRole: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  },

  fetchRoles: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await roleService.list(params);
      set({
        roles: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch roles',
        isLoading: false,
      });
    }
  },

  createRole: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newRole = await roleService.create(data);
      set(state => ({
        roles: [newRole, ...state.roles],
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to create role',
        isLoading: false,
      });
      throw error;
    }
  },

  updateRole: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedRole = await roleService.update(id, data);
      set(state => ({
        roles: state.roles.map(r => (r.id === id ? updatedRole : r)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to update role',
        isLoading: false,
      });
      throw error;
    }
  },

  deleteRole: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await roleService.delete(id);
      set(state => ({
        roles: state.roles.filter(r => r.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to delete role',
        isLoading: false,
      });
      throw error;
    }
  },

  selectRole: role => set({ selectedRole: role }),
  setError: error => set({ error }),
}));
