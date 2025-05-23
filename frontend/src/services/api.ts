import axios from 'axios';
import { ApiResponse, AuthResponse, User, Organization, Account, AccountType, AccountCategory } from '../types';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'https://3000-i0fzuaix54a2mlgdwssh5-456de580.manus.computer/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for adding auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle token expiration
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Generic API request function
const apiRequest = async <T>(
  method: string,
  url: string,
  data?: any
): Promise<ApiResponse<T>> => {
  try {
    const response = await api.request({
      method,
      url,
      data
    });
    return response.data;
  } catch (error: any) {
    if (error.response && error.response.data) {
      return error.response.data;
    }
    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: error.message || 'Network error occurred'
      }
    };
  }
};

// API service methods
const apiService = {
  // Auth endpoints
  auth: {
    login: (email: string, password: string) =>
      apiRequest<AuthResponse>('post', '/auth/login', { email, password }),
    register: (userData: any) =>
      apiRequest<AuthResponse>('post', '/auth/register', userData),
    getCurrentUser: () =>
      apiRequest<User>('get', '/auth/me')
  },

  // Organization endpoints
  organizations: {
    getAll: () =>
      apiRequest<Organization[]>('get', '/organizations'),
    getById: (id: number) =>
      apiRequest<Organization>('get', `/organizations/${id}`),
    create: (data: any) =>
      apiRequest<Organization>('post', '/organizations', data),
    update: (id: number, data: any) =>
      apiRequest<Organization>('put', `/organizations/${id}`, data),
    delete: (id: number) =>
      apiRequest<void>('delete', `/organizations/${id}`),
    getUsers: (id: number) =>
      apiRequest<User[]>('get', `/organizations/${id}/users`)
  },

  // Account endpoints
  accounts: {
    getAll: (orgId: number, params?: any) =>
      apiRequest<Account[]>('get', `/organizations/${orgId}/accounts`, { params }),
    getById: (orgId: number, id: number) =>
      apiRequest<Account>('get', `/organizations/${orgId}/accounts/${id}`),
    create: (orgId: number, data: any) =>
      apiRequest<Account>('post', `/organizations/${orgId}/accounts`, data),
    update: (orgId: number, id: number, data: any) =>
      apiRequest<Account>('put', `/organizations/${orgId}/accounts/${id}`, data),
    getTypes: (orgId: number) =>
      apiRequest<AccountType[]>('get', `/organizations/${orgId}/accounts/types`),
    getCategories: (orgId: number) =>
      apiRequest<AccountCategory[]>('get', `/organizations/${orgId}/accounts/categories`)
  },

  // Journal Entry endpoints
  journalEntries: {
    getAll: (orgId: number, params?: any) =>
      apiRequest('get', `/organizations/${orgId}/journal-entries`, { params }),
    getById: (orgId: number, id: number) =>
      apiRequest('get', `/organizations/${orgId}/journal-entries/${id}`),
    create: (orgId: number, data: any) =>
      apiRequest('post', `/organizations/${orgId}/journal-entries`, data),
    post: (orgId: number, id: number) =>
      apiRequest('post', `/organizations/${orgId}/journal-entries/${id}/post`)
  },

  // General Ledger endpoints
  generalLedger: {
    getEntries: (orgId: number, params?: any) =>
      apiRequest('get', `/organizations/${orgId}/general-ledger`, { params }),
    getAccountEntries: (orgId: number, accountId: number, params?: any) =>
      apiRequest('get', `/organizations/${orgId}/general-ledger/account/${accountId}`, { params }),
    getAccountBalances: (orgId: number, params?: any) =>
      apiRequest('get', `/organizations/${orgId}/general-ledger/account-balances`, { params }),
    getTrialBalance: (orgId: number, fiscalPeriodId: number) =>
      apiRequest('get', `/organizations/${orgId}/general-ledger/trial-balance`, { 
        params: { fiscalPeriodId } 
      })
  }
};

export default apiService;
