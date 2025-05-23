// Authentication types
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  organizations?: Organization[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

// Organization types
export interface Organization {
  id: number;
  name: string;
  taxId?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone?: string;
  fiscalYearStart?: string;
  baseCurrency?: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Account types
export interface AccountType {
  id: number;
  name: string;
  normalBalance: string;
  description?: string;
}

export interface AccountCategory {
  id: number;
  name: string;
  accountTypeId: number;
  accountTypeName?: string;
  description?: string;
}

export interface Account {
  id: number;
  code: string;
  name: string;
  description?: string;
  accountTypeId: number;
  accountTypeName?: string;
  normalBalance?: string;
  accountCategoryId: number;
  accountCategoryName?: string;
  parentAccountId?: number;
  isActive: boolean;
  isBankAccount: boolean;
  bankAccountDetails?: any;
}

// Journal Entry types
export interface JournalEntryItem {
  id?: number;
  accountId: number;
  accountCode?: string;
  accountName?: string;
  description?: string;
  debitAmount: number;
  creditAmount: number;
  memo?: string;
  dimensions?: any;
}

export interface JournalEntry {
  id?: number;
  entryNo?: string;
  entryDate: string;
  fiscalPeriodId: number;
  description?: string;
  reference?: string;
  status?: string;
  currencyCode?: string;
  exchangeRate?: number;
  items: JournalEntryItem[];
  createdAt?: string;
  postedAt?: string;
  createdByName?: string;
}

// General Ledger types
export interface LedgerEntry {
  id: number;
  transactionDate: string;
  description?: string;
  debitAmount: number;
  creditAmount: number;
  balance: number;
  currencyCode: string;
  baseDebitAmount: number;
  baseCreditAmount: number;
  baseBalance: number;
  accountId?: number;
  accountCode?: string;
  accountName?: string;
  journalEntryNo?: string;
  journalEntryReference?: string;
}

export interface AccountBalance {
  id: number;
  fiscalPeriodId: number;
  accountId: number;
  accountCode: string;
  accountName: string;
  accountTypeId: number;
  accountTypeName: string;
  normalBalance: string;
  accountCategoryId?: number;
  accountCategoryName?: string;
  openingBalance: number;
  debitAmount: number;
  creditAmount: number;
  closingBalance: number;
  currencyCode: string;
  baseOpeningBalance: number;
  baseDebitAmount: number;
  baseCreditAmount: number;
  baseClosingBalance: number;
}

// Fiscal Period types
export interface FiscalPeriod {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  fiscalYearId?: number;
  fiscalYearName?: string;
}

export interface FiscalYear {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  isClosed: boolean;
  periods?: FiscalPeriod[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}
