export type UserRole = 'superadmin' | 'owner' | 'cashier';

export type SubscriptionPlan = 'starter' | 'pro' | 'enterprise';
export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended';

export type PaymentMethod = 'cash' | 'qris' | 'transfer';
export type TransactionType = 'in' | 'out';

export interface Tenant {
  id: string;
  businessName: string;
  ownerName: string;
  email: string;
  phone: string;
  subscriptionPlan: SubscriptionPlan;
  subscriptionStatus: SubscriptionStatus;
  validUntil: string; // ISO string
  createdAt: string;
}

export interface Store {
  id: string;
  tenantId: string;
  name: string;
  branchName: string;
  address: string;
  phone: string;
  currency: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  isDefault?: boolean;
}

export interface Transaction {
  id: string;
  tenantId: string;
  storeId: string;
  type: TransactionType;
  amount: number;
  paymentMethod: PaymentMethod;
  categoryId: string;
  categoryName: string;
  description: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  createdByRole: UserRole;
  createdByName: string;
  shiftId?: string;
  createdAt: string;
}

export interface Shift {
  id: string;
  tenantId: string;
  storeId: string;
  cashierName: string;
  startCash: number;
  endCashExpected: number;
  endCashActual: number;
  discrepancy: number; // actual - expected
  openedAt: string; // ISO string
  closedAt?: string; // ISO string
  status: 'open' | 'closed';
  notes?: string;
}

export interface Debt {
  id: string;
  tenantId: string;
  storeId: string;
  personName: string;
  phone?: string;
  type: 'piutang' | 'utang'; // piutang: orang ngutang ke kedai, utang: kedai ngutang ke supplier
  amount: number;
  dueDate: string;
  status: 'unpaid' | 'paid';
  description: string;
  createdAt: string;
  paidAt?: string;
}

export type ActionType = 
  | 'TRANSACTION_ADD'
  | 'TRANSACTION_DELETE'
  | 'SHIFT_OPEN'
  | 'SHIFT_CLOSE'
  | 'DEBT_ADD'
  | 'DEBT_PAY'
  | 'TENANT_CREATE'
  | 'SUBSCRIPTION_UPDATE'
  | 'STORE_ADD'
  | 'STORE_UPDATE';

export interface AuditLog {
  id: string;
  tenantId?: string;
  storeId?: string;
  storeName?: string;
  actorRole: UserRole;
  actorName: string;
  actionType: ActionType;
  description: string;
  metadata?: Record<string, any>;
  timestamp: string; // ISO string
}
