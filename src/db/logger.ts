import { db } from './database';
import { ActionType, AuditLog, UserRole } from '../types';

interface LogActivityParams {
  tenantId?: string;
  storeId?: string;
  storeName?: string;
  actorRole: UserRole;
  actorName: string;
  actionType: ActionType;
  description: string;
  metadata?: Record<string, any>;
}

export async function logActivity(params: LogActivityParams): Promise<void> {
  try {
    const logEntry: AuditLog = {
      id: 'log_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      tenantId: params.tenantId,
      storeId: params.storeId,
      storeName: params.storeName,
      actorRole: params.actorRole,
      actorName: params.actorName,
      actionType: params.actionType,
      description: params.description,
      metadata: params.metadata,
      timestamp: new Date().toISOString(),
    };

    await db.audit_logs.add(logEntry);
  } catch (error) {
    console.error('Gagal mencatat audit log:', error);
  }
}
