import { create } from 'zustand';
import type { Account, Category, Transaction, Summary } from '@jizhang/shared';
import { transactionApi, accountApi, categoryApi } from '@jizhang/shared';

// 移动端使用本地网络地址，开发时需修改为实际服务器 IP
// 例如: http://192.168.1.100:3001/api
const API_BASE = 'http://10.0.2.2:3001/api'; // Android 模拟器默认宿主机地址

// 覆盖 shared 包里的 fetch base (通过环境变量无法在 RN 中直接使用)
(globalThis as any).__API_BASE__ = API_BASE;

interface AppState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  summary: Summary | null;

  fetchAccounts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchTransactions: (params?: Record<string, string | number>) => Promise<{ data: Transaction[]; total: number }>;
  fetchSummary: (year: number, month?: number) => Promise<void>;
  createTransaction: (data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
}

async function apiRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || '请求失败');
  }
  return res.json();
}

export const useStore = create<AppState>((set) => ({
  accounts: [],
  categories: [],
  transactions: [],
  summary: null,

  fetchAccounts: async () => {
    const data = await apiRequest<Account[]>('/accounts');
    set({ accounts: data });
  },

  fetchCategories: async () => {
    const data = await apiRequest<Category[]>('/categories');
    set({ categories: data });
  },

  fetchTransactions: async (params) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    const result = await apiRequest<{ data: Transaction[]; total: number }>(`/transactions${qs}`);
    set({ transactions: result.data });
    return result;
  },

  fetchSummary: async (year, month) => {
    const qs = month ? `?year=${year}&month=${month}` : `?year=${year}`;
    const data = await apiRequest<Summary>(`/transactions/summary${qs}`);
    set({ summary: data });
  },

  createTransaction: async (data) => {
    await apiRequest('/transactions', { method: 'POST', body: JSON.stringify(data) });
  },

  deleteTransaction: async (id) => {
    await apiRequest(`/transactions/${id}`, { method: 'DELETE' });
  },
}));
