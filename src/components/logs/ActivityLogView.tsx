import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { AuditLog, ActionType, UserRole, Tenant } from '../../types';
import { 
  ShieldCheck, 
  Search, 
  Trash2, 
  PlusCircle, 
  CircleDollarSign, 
  Key, 
  Clock, 
  User, 
  AlertOctagon,
  RefreshCw,
  Store,
  Crown,
  Edit2,
  Building
} from 'lucide-react';

export const ActivityLogView: React.FC = () => {
  const { activeTenant, activeStore, role } = useApp();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [tenantsList, setTenantsList] = useState<Tenant[]>([]);
  const [tenantFilter, setTenantFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const loadLogs = async () => {
    setLoading(true);
    let logList: AuditLog[] = [];
    if (role === 'superadmin') {
      // Superadmin sees all logs
      logList = await db.audit_logs.reverse().sortBy('timestamp');
      const allTenants = await db.tenants.toArray();
      setTenantsList(allTenants);
    } else if (activeTenant) {
      // Owner sees all logs for their tenant
      logList = await db.audit_logs
        .where('tenantId')
        .equals(activeTenant.id)
        .reverse()
        .sortBy('timestamp');
    }
    setLogs(logList);
    setLoading(false);
  };

  useEffect(() => {
    loadLogs();
  }, [activeTenant, role]);

  const filteredLogs = logs.filter((log) => {
    const matchesTenant = 
      role !== 'superadmin' || 
      tenantFilter === 'all' || 
      log.tenantId === tenantFilter;
    const matchesRole = roleFilter === 'all' || log.actorRole === roleFilter;
    const matchesAction = actionFilter === 'all' || log.actionType.startsWith(actionFilter);
    const matchesSearch = 
      log.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.storeName && log.storeName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesTenant && matchesRole && matchesAction && matchesSearch;
  });

  const getActionBadge = (type: ActionType) => {
    switch (type) {
      case 'TRANSACTION_ADD':
        return <span className="badge badge-emerald"><PlusCircle size={12} /> Transaksi Baru</span>;
      case 'TRANSACTION_DELETE':
        return <span className="badge badge-rose"><AlertOctagon size={12} /> Hapus Transaksi</span>;
      case 'SHIFT_OPEN':
        return <span className="badge badge-blue"><CircleDollarSign size={12} /> Buka Shift</span>;
      case 'SHIFT_CLOSE':
        return <span className="badge badge-amber"><Clock size={12} /> Tutup Shift</span>;
      case 'SUBSCRIPTION_UPDATE':
        return <span className="badge badge-purple"><Key size={12} /> Lisensi</span>;
      case 'TENANT_CREATE':
        return <span className="badge badge-purple"><Crown size={12} /> Klien Baru</span>;
      case 'TENANT_UPDATE':
        return <span className="badge badge-amber"><Edit2 size={12} /> Edit Klien</span>;
      case 'TENANT_DELETE':
        return <span className="badge badge-rose"><Trash2 size={12} /> Hapus Klien</span>;
      case 'STORE_ADD':
      case 'STORE_UPDATE':
        return <span className="badge badge-blue"><Store size={12} /> Toko</span>;
      default:
        return <span className="badge badge-blue">{type}</span>;
    }
  };

  const formatTimestamp = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="log-page-container">
      {/* Header Banner */}
      <div className="page-header-flex">
        <div>
          <div className="title-with-badge">
            <h2>Audit & Activity Log</h2>
            <span className="badge badge-emerald">
              <ShieldCheck size={12} /> Anti-Fraud Tracking
            </span>
          </div>
          <p className="text-muted text-sm">
            {role === 'superadmin' ? 'Monitoring aktivitas seluruh tenant platform' : `Pelacakan aktivitas kedai ${activeTenant?.businessName}`}
          </p>
        </div>

        <button className="btn btn-outline btn-sm" onClick={loadLogs}>
          <RefreshCw size={14} />
          <span>Segarkan Log</span>
        </button>
      </div>

      {/* Security Note Alert */}
      <div className="security-alert-box">
        <ShieldCheck size={22} className="text-emerald shrink-0" />
        <p className="text-sm">
          <strong>Keamanan Operasional Terjamin:</strong> Setiap transaksi yang dicatat, uang kembalian kasir yang disetor, serta penghapusan catatan kas terekam permanen dengan stempel waktu dan identitas pencatat.
        </p>
      </div>

      {/* Filter Controls */}
      <div className="filter-controls-card">
        {/* Superadmin Cross-Tenant Filter */}
        {role === 'superadmin' && (
          <div className="filter-tenant-row">
            <div className="filter-tenant-label">
              <Building size={15} className="text-purple" />
              <span>Filter Klien Usaha:</span>
            </div>
            <select
              className="form-select filter-tenant-select"
              value={tenantFilter}
              onChange={(e) => setTenantFilter(e.target.value)}
            >
              <option value="all">Semua Klien Usaha ({tenantsList.length} Terdaftar)</option>
              {tenantsList.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.businessName} — {t.ownerName} ({t.subscriptionPlan.toUpperCase()})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Cari aksi, nama staf/kasir, atau detail nominal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="filter-buttons-group">
          {/* Role Filter */}
          <div className="btn-group">
            <button
              className={`filter-btn ${roleFilter === 'all' ? 'active' : ''}`}
              onClick={() => setRoleFilter('all')}
            >
              Semua Peran
            </button>
            <button
              className={`filter-btn ${roleFilter === 'cashier' ? 'active' : ''}`}
              onClick={() => setRoleFilter('cashier')}
            >
              Kasir
            </button>
            <button
              className={`filter-btn ${roleFilter === 'owner' ? 'active' : ''}`}
              onClick={() => setRoleFilter('owner')}
            >
              Pemilik (Owner)
            </button>
            {role === 'superadmin' && (
              <button
                className={`filter-btn ${roleFilter === 'superadmin' ? 'active' : ''}`}
                onClick={() => setRoleFilter('superadmin')}
              >
                Superadmin
              </button>
            )}
          </div>

          {/* Action Filter */}
          <div className="btn-group">
            <button
              className={`filter-btn ${actionFilter === 'all' ? 'active' : ''}`}
              onClick={() => setActionFilter('all')}
            >
              Semua Aksi
            </button>
            <button
              className={`filter-btn ${actionFilter === 'TRANSACTION' ? 'active' : ''}`}
              onClick={() => setActionFilter('TRANSACTION')}
            >
              Transaksi
            </button>
            <button
              className={`filter-btn ${actionFilter === 'SHIFT' ? 'active' : ''}`}
              onClick={() => setActionFilter('SHIFT')}
            >
              Shift Kasir
            </button>
            {role === 'superadmin' && (
              <button
                className={`filter-btn ${actionFilter === 'TENANT' ? 'active' : ''}`}
                onClick={() => setActionFilter('TENANT')}
              >
                Klien & Lisensi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Log Timeline List */}
      <div className="card log-list-card">
        {loading ? (
          <div className="empty-state">Memuat data log aktivitas...</div>
        ) : filteredLogs.length === 0 ? (
          <div className="empty-state">
            <p className="text-muted">Belum ada riwayat aktivitas yang cocok dengan filter.</p>
          </div>
        ) : (
          <div className="timeline-items">
            {filteredLogs.map((log) => (
              <div key={log.id} className="timeline-item">
                <div className="timeline-indicator">
                  <div className={`timeline-dot dot-${log.actionType.split('_')[0].toLowerCase()}`}></div>
                  <div className="timeline-line"></div>
                </div>

                <div className="timeline-content">
                  <div className="timeline-header">
                    <div className="timeline-meta-left">
                      {getActionBadge(log.actionType)}
                      <span className="actor-badge">
                        <User size={12} />
                        <strong>{log.actorName}</strong> ({log.actorRole})
                      </span>
                      {log.storeName && (
                        <span className="store-tag">📍 {log.storeName}</span>
                      )}
                      {role === 'superadmin' && log.tenantId && (
                        <span className="badge badge-purple text-xs">
                          🏢 {tenantsList.find(t => t.id === log.tenantId)?.businessName || 'Klien'}
                        </span>
                      )}
                    </div>
                    <span className="timeline-time text-muted text-xs">
                      {formatTimestamp(log.timestamp)}
                    </span>
                  </div>

                  <p className="timeline-desc">{log.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
