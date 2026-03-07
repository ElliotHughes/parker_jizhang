import type { Account, Category, Transaction, Budget, Summary, PaginatedResponse } from './types';

const BASE_URL = (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_API_URL)
  ? (import.meta as any).env.VITE_API_URL
  : 'http://localhost:3001/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || '请求失败');
  }
  return res.json();
}

// --- Transactions ---
export const transactionApi = {
  list: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<PaginatedResponse<Transaction>>(`/transactions${qs}`);
  },
  summary: (params?: { year?: number; month?: number }) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return request<Summary>(`/transactions/summary${qs}`);
  },
  create: (data: Partial<Transaction>) =>
    request<Transaction>('/transactions', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Transaction>) =>
    request<Transaction>(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) =>
    request<{ message: string }>(`/transactions/${id}`, { method: 'DELETE' }),
};

// --- Accounts ---
export const accountApi = {
  list: () => request<Account[]>('/accounts'),
  create: (data: Partial<Account>) =>
    request<Account>('/accounts', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Account>) =>
    request<Account>(`/accounts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) =>
    request<{ message: string }>(`/accounts/${id}`, { method: 'DELETE' }),
};

// --- Categories ---
export const categoryApi = {
  list: (type?: 'income' | 'expense') => {
    const qs = type ? `?type=${type}` : '';
    return request<Category[]>(`/categories${qs}`);
  },
  create: (data: Partial<Category>) =>
    request<Category>('/categories', { method: 'POST', body: JSON.stringify(data) }),
  update: (id: number, data: Partial<Category>) =>
    request<Category>(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (id: number) =>
    request<{ message: string }>(`/categories/${id}`, { method: 'DELETE' }),
};

// --- Budgets ---
export const budgetApi = {
  list: (year: number, month?: number) => {
    const qs = month ? `?year=${year}&month=${month}` : `?year=${year}`;
    return request<Budget[]>(`/budgets${qs}`);
  },
  create: (data: Partial<Budget>) =>
    request<Budget>('/budgets', { method: 'POST', body: JSON.stringify(data) }),
  remove: (id: number) =>
    request<{ message: string }>(`/budgets/${id}`, { method: 'DELETE' }),
};
