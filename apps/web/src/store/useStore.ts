import { create } from 'zustand';
import type { Account, Category, Transaction, Summary } from '@jizhang/shared';
import { transactionApi, accountApi, categoryApi } from '@jizhang/shared';

interface AppState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  summary: Summary | null;
  loading: boolean;

  fetchAccounts: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchTransactions: (params?: Record<string, string | number>) => Promise<{ data: Transaction[]; total: number }>;
  fetchSummary: (year: number, month?: number) => Promise<void>;
  createTransaction: (data: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
}

export const useStore = create<AppState>((set) => ({
  accounts: [],
  categories: [],
  transactions: [],
  summary: null,
  loading: false,

  fetchAccounts: async () => {
    const data = await accountApi.list();
    set({ accounts: data });
  },

  fetchCategories: async () => {
    const data = await categoryApi.list();
    set({ categories: data });
  },

  fetchTransactions: async (params) => {
    const result = await transactionApi.list(params);
    set({ transactions: result.data });
    return result;
  },

  fetchSummary: async (year, month) => {
    const data = await transactionApi.summary({ year, month });
    set({ summary: data });
  },

  createTransaction: async (data) => {
    await transactionApi.create(data);
  },

  deleteTransaction: async (id) => {
    await transactionApi.remove(id);
  },
}));
