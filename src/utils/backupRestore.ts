import { db } from '../db/database';
import { logActivity } from '../db/logger';
import { 
  Tenant, 
  Store, 
  Category, 
  Transaction, 
  Shift, 
  Debt, 
  AuditLog, 
  UserRole 
} from '../types';

export interface BackupData {
  app: 'KasKedai';
  version: '1.0.0';
  exportedAt: string;
  exportedBy: {
    name: string;
    role: UserRole;
  };
  metadata: {
    tenantCount: number;
    storeCount: number;
    transactionCount: number;
    debtCount: number;
    shiftCount: number;
    logCount: number;
    totalIncome: number;
    totalExpense: number;
  };
  data: {
    tenants: Tenant[];
    stores: Store[];
    categories: Category[];
    transactions: Transaction[];
    shifts: Shift[];
    debts: Debt[];
    audit_logs: AuditLog[];
  };
}

/**
 * Creates and downloads a complete JSON backup file of all IndexedDB tables.
 */
export async function exportDatabaseBackup(
  actorName: string, 
  actorRole: UserRole
): Promise<BackupData> {
  const [
    tenants, 
    stores, 
    categories, 
    transactions, 
    shifts, 
    debts, 
    audit_logs
  ] = await Promise.all([
    db.tenants.toArray(),
    db.stores.toArray(),
    db.categories.toArray(),
    db.transactions.toArray(),
    db.shifts.toArray(),
    db.debts.toArray(),
    db.audit_logs.toArray()
  ]);

  const totalIncome = transactions
    .filter(t => t.type === 'in')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'out')
    .reduce((sum, t) => sum + t.amount, 0);

  const backupData: BackupData = {
    app: 'KasKedai',
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    exportedBy: {
      name: actorName,
      role: actorRole
    },
    metadata: {
      tenantCount: tenants.length,
      storeCount: stores.length,
      transactionCount: transactions.length,
      debtCount: debts.length,
      shiftCount: shifts.length,
      logCount: audit_logs.length,
      totalIncome,
      totalExpense
    },
    data: {
      tenants,
      stores,
      categories,
      transactions,
      shifts,
      debts,
      audit_logs
    }
  };

  // Convert to formatted JSON
  const jsonString = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  
  const dateStr = new Date().toISOString().split('T')[0];
  const downloadAnchor = document.createElement('a');
  downloadAnchor.href = url;
  downloadAnchor.download = `KasKedai_Backup_${dateStr}_${Date.now().toString().slice(-4)}.json`;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  document.body.removeChild(downloadAnchor);
  URL.revokeObjectURL(url);

  // Record to audit log
  await logActivity({
    actorRole,
    actorName,
    actionType: 'DATA_BACKUP',
    description: `Mengekspor cadangan database lengkap (${transactions.length} transaksi, ${tenants.length} bisnis)`,
    metadata: {
      transactionCount: transactions.length,
      tenantCount: tenants.length,
      exportedAt: backupData.exportedAt
    }
  });

  return backupData;
}

/**
 * Validates a parsed or string JSON to ensure it is a valid KasKedai backup file.
 */
export function validateBackupJson(jsonString: string): BackupData {
  let parsed: any;
  try {
    parsed = JSON.parse(jsonString);
  } catch (e) {
    throw new Error('File yang dipilih bukan format JSON yang valid.');
  }

  if (!parsed || parsed.app !== 'KasKedai') {
    throw new Error('File ini bukan file cadangan resmi KasKedai (Signature KasKedai tidak ditemukan).');
  }

  if (!parsed.data || typeof parsed.data !== 'object') {
    throw new Error('Struktur data cadangan rusak atau tidak lengkap.');
  }

  const { tenants, stores, categories, transactions } = parsed.data;
  if (!Array.isArray(tenants) || !Array.isArray(stores) || !Array.isArray(transactions)) {
    throw new Error('Tabel data bisnis atau transaksi dalam file cadangan tidak valid.');
  }

  return parsed as BackupData;
}

/**
 * Restores data from BackupData into IndexedDB.
 * @param backup The validated backup object
 * @param mode 'merge' to add/update without deleting, 'replace' to clean tables first
 */
export async function restoreDatabaseBackup(
  backup: BackupData,
  mode: 'merge' | 'replace',
  actorName: string,
  actorRole: UserRole
): Promise<{ success: boolean; message: string }> {
  const { 
    tenants, 
    stores, 
    categories, 
    transactions, 
    shifts, 
    debts, 
    audit_logs 
  } = backup.data;

  // Execute in an atomic transaction
  await db.transaction(
    'rw', 
    [db.tenants, db.stores, db.categories, db.transactions, db.shifts, db.debts, db.audit_logs], 
    async () => {
      if (mode === 'replace') {
        await Promise.all([
          db.tenants.clear(),
          db.stores.clear(),
          db.categories.clear(),
          db.transactions.clear(),
          db.shifts.clear(),
          db.debts.clear(),
          db.audit_logs.clear()
        ]);
      }

      // Populate tables
      if (categories?.length) await db.categories.bulkPut(categories);
      if (tenants?.length) await db.tenants.bulkPut(tenants);
      if (stores?.length) await db.stores.bulkPut(stores);
      if (transactions?.length) await db.transactions.bulkPut(transactions);
      if (shifts?.length) await db.shifts.bulkPut(shifts);
      if (debts?.length) await db.debts.bulkPut(debts);
      if (audit_logs?.length) await db.audit_logs.bulkPut(audit_logs);
    }
  );

  // Log restore action
  await logActivity({
    actorRole,
    actorName,
    actionType: 'DATA_RESTORE',
    description: `Memulihkan database dari file cadangan (${mode === 'replace' ? 'Ganti Bersih' : 'Penggabungan Data'}) berisi ${transactions.length} transaksi`,
    metadata: {
      mode,
      backupExportedAt: backup.exportedAt,
      restoredTransactionCount: transactions.length
    }
  });

  return {
    success: true,
    message: `Berhasil memulihkan ${transactions.length} transaksi dan ${tenants.length} profil bisnis.`
  };
}
