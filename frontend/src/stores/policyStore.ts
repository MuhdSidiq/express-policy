import { create } from 'zustand';
import { policyService } from '../services/policyService';
import { Policy } from '../types';

interface PolicyState {
  policies: Policy[];
  selectedPolicy: Policy | null;
  isLoading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  fetchPolicies: (params?: { page?: number; limit?: number; search?: string }) => Promise<void>;
  createPolicy: (data: { name: string; description?: string }) => Promise<void>;
  updatePolicy: (id: string, data: Partial<Policy>) => Promise<void>;
  deletePolicy: (id: string) => Promise<void>;
  selectPolicy: (policy: Policy | null) => void;
  setError: (error: string | null) => void;
}

export const usePolicyStore = create<PolicyState>((set, get) => ({
  policies: [],
  selectedPolicy: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 50,
    total: 0,
    totalPages: 0,
  },

  fetchPolicies: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const response = await policyService.list(params);
      set({
        policies: response.data,
        pagination: response.pagination,
        isLoading: false,
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to fetch policies',
        isLoading: false,
      });
    }
  },

  createPolicy: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const newPolicy = await policyService.create(data);
      set(state => ({
        policies: [newPolicy, ...state.policies],
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to create policy',
        isLoading: false,
      });
      throw error;
    }
  },

  updatePolicy: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPolicy = await policyService.update(id, data);
      set(state => ({
        policies: state.policies.map(p => (p.id === id ? updatedPolicy : p)),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to update policy',
        isLoading: false,
      });
      throw error;
    }
  },

  deletePolicy: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await policyService.delete(id);
      set(state => ({
        policies: state.policies.filter(p => p.id !== id),
        isLoading: false,
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.error || 'Failed to delete policy',
        isLoading: false,
      });
      throw error;
    }
  },

  selectPolicy: policy => set({ selectedPolicy: policy }),
  setError: error => set({ error }),
}));
