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

export type SalesChannel = 'offline' | 'gofood' | 'shopeefood' | 'grabfood';
export type SettlementStatus = 'pending' | 'settled';

export interface RawMaterial {
  id: string;
  tenantId: string;
  storeId: string;
  name: string;
  category: string; // 'Bahan Utama' | 'Topping' | 'Minyak & Lemak' | 'Kemasan' | 'Lainnya'
  currentStock: number;
  unit: string; // 'kg' | 'butir' | 'liter' | 'kaleng' | 'pack' | 'pcs'
  minStockAlert: number;
  costPerUnit?: number;
  lastRestockedAt?: string;
  updatedAt: string;
}

export interface SettlementRecord {
  id: string;
  tenantId: string;
  storeId: string;
  channel: SalesChannel;
  totalAmount: number;
  transactionCount: number;
  bankName: string;
  bankAccountRef?: string;
  settledAt: string;
  notes?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  tenantId: string;
  storeId: string;
  type: TransactionType;
  amount: number; // Net amount yang masuk ke kas/buku kas
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

  // Fitur Online Food & Omnichannel
  channel?: SalesChannel; // default: 'offline'
  grossAmount?: number; // Nilai kotor penjualan aplikasi (sebelum komisi)
  commissionRate?: number; // Persentase komisi (misal: 20)
  commissionAmount?: number; // Nilai potongan komisi platform (misal: Rp 13.100)
  netAmount?: number; // Nilai bersih yang didapatkan toko
  settlementStatus?: SettlementStatus; // 'pending' jika masih di saldo aplikasi, 'settled' jika sudah cair
  settlementBank?: string; // Bank pencairan (BCA, Mandiri, BRI, dll)
  settledAt?: string; // Waktu dicairkan ke bank
  externalOrderId?: string; // Nomor pesanan aplikasi (misal: F-3358527824)

  // Fitur Tautkan Belanja Bahan Mentah
  rawMaterialId?: string;
  rawMaterialQtyAdded?: number;
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

export interface DebtPayment {
  amount: number;
  date: string;
  paymentMethod: 'cash' | 'qris' | 'transfer';
  note?: string;
  actorName?: string;
}

export interface Debt {
  id: string;
  tenantId: string;
  storeId: string;
  personName: string;
  phone?: string;
  type: 'piutang' | 'utang'; // piutang: orang ngutang ke kedai, utang: kedai ngutang ke supplier
  amount: number;
  originalAmount?: number; // nominal awal sebelum dicicil
  dueDate: string;
  status: 'unpaid' | 'paid';
  description: string;
  createdAt: string;
  paidAt?: string;
  paymentHistory?: DebtPayment[];
}

export type ActionType = 
  | 'TRANSACTION_ADD'
  | 'TRANSACTION_DELETE'
  | 'SHIFT_OPEN'
  | 'SHIFT_CLOSE'
  | 'DEBT_ADD'
  | 'DEBT_PAY'
  | 'DEBT_INSTALLMENT'
  | 'TENANT_CREATE'
  | 'TENANT_UPDATE'
  | 'TENANT_DELETE'
  | 'SUBSCRIPTION_UPDATE'
  | 'STORE_ADD'
  | 'STORE_UPDATE'
  | 'CATEGORY_ADD'
  | 'CATEGORY_DELETE'
  | 'DATA_BACKUP'
  | 'DATA_RESTORE'
  | 'ONLINE_FOOD_ADD'
  | 'SETTLEMENT_PROCESSED'
  | 'RAW_MATERIAL_UPDATE'
  | 'RAW_MATERIAL_RESTOCK';

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

