import Dexie, { Table } from 'dexie';
import { 
  Tenant, 
  Store, 
  Category, 
  Transaction, 
  Shift, 
  Debt, 
  AuditLog 
} from '../types';

export class KasKedaiDatabase extends Dexie {
  tenants!: Table<Tenant, string>;
  stores!: Table<Store, string>;
  categories!: Table<Category, string>;
  transactions!: Table<Transaction, string>;
  shifts!: Table<Shift, string>;
  debts!: Table<Debt, string>;
  audit_logs!: Table<AuditLog, string>;

  constructor() {
    super('KasKedaiDB');
    this.version(1).stores({
      tenants: 'id, businessName, subscriptionStatus, subscriptionPlan, validUntil, createdAt',
      stores: 'id, tenantId, name, isActive',
      categories: 'id, type, name',
      transactions: 'id, tenantId, storeId, date, type, paymentMethod, categoryId, createdAt',
      shifts: 'id, tenantId, storeId, status, [storeId+status], openedAt, closedAt',
      debts: 'id, tenantId, storeId, status, type, dueDate',
      audit_logs: 'id, tenantId, storeId, actorRole, actionType, timestamp',
    });
  }
}

export const db = new KasKedaiDatabase();
