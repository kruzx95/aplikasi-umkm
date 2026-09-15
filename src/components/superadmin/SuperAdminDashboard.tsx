import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { logActivity } from '../../db/logger';
import { Tenant, Store, SubscriptionPlan, SubscriptionStatus } from '../../types';
import { 
  Crown, 
  Users, 
  Store as StoreIcon, 
  TrendingUp, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Plus, 
  LogIn, 
  Key, 
  Calendar,
  Phone,
  Mail,
  X,
  ShieldAlert,
  Edit2
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SuperAdminDashboard: React.FC = () => {
  const { 
    tenants, 
    setActiveTenant, 
    setRole, 
    setActiveTab, 
    refreshAllData,
    activeTab 
  } = useApp();

  const [allStores, setAllStores] = useState<Store[]>([]);
  const [totalTxCount, setTotalTxCount] = useState(0);
  const [totalPlatformVolume, setTotalPlatformVolume] = useState(0);
  const [isAddTenantOpen, setIsAddTenantOpen] = useState(false);

  // New Tenant Form
  const [businessName, setBusinessName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState<SubscriptionPlan>('starter');
  const [status, setStatus] = useState<SubscriptionStatus>('trial');
  const [branchName, setBranchName] = useState('Cabang Utama');

  useEffect(() => {
    const loadPlatformMetrics = async () => {
      const stores = await db.stores.toArray();
      setAllStores(stores);

      const txs = await db.transactions.toArray();
      setTotalTxCount(txs.length);
      const volume = txs.reduce((sum, t) => sum + t.amount, 0);
      setTotalPlatformVolume(volume);
    };

    loadPlatformMetrics();
  }, [tenants]);

  // Subscriptions MRR calculation (Estimasi Pendapatan Langganan Anda)
  const calculateMRR = () => {
    return tenants.reduce((total, t) => {
      if (t.subscriptionStatus === 'active') {
        if (t.subscriptionPlan === 'starter') return total + 29000;
        if (t.subscriptionPlan === 'pro') return total + 49000;
        if (t.subscriptionPlan === 'enterprise') return total + 99000;
      }
      return total;
    }, 0);
  };

  const handleUpdateSubscription = async (
    tenant: Tenant, 
    newStatus: SubscriptionStatus, 
    newPlan?: SubscriptionPlan,
    extendDays: number = 30
  ) => {
    const currentValidUntil = new Date(tenant.validUntil);
    const newDate = new Date(currentValidUntil.getTime() > Date.now() ? currentValidUntil : new Date());
    newDate.setDate(newDate.getDate() + extendDays);

    await db.tenants.update(tenant.id, {
      subscriptionStatus: newStatus,
      subscriptionPlan: newPlan || tenant.subscriptionPlan,
      validUntil: newDate.toISOString(),
    });

    await logActivity({
      tenantId: tenant.id,
      actorRole: 'superadmin',
      actorName: 'Superadmin Platform',
      actionType: 'SUBSCRIPTION_UPDATE',
      description: `Memperbarui lisensi tenant ${tenant.businessName}: Status=${newStatus.toUpperCase()}, Paket=${(newPlan || tenant.subscriptionPlan).toUpperCase()} (+${extendDays} hari)`,
      metadata: { tenantId: tenant.id, newStatus, newPlan, validUntil: newDate.toISOString() }
    });

    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.7 }
    });

    await refreshAllData();
  };

  const handleImpersonate = async (tenant: Tenant) => {
    await setActiveTenant(tenant);
    setRole('owner');
    setActiveTab('dashboard');
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !ownerName.trim()) {
      alert('Nama bisnis dan pemilik wajib diisi!');
      return;
    }

    const tenantId = 'tenant_' + Date.now();
    const validDate = new Date();
    validDate.setDate(validDate.getDate() + (status === 'trial' ? 14 : 30));

    const newTenant: Tenant = {
      id: tenantId,
      businessName: businessName.trim(),
      ownerName: ownerName.trim(),
      email: email.trim() || `${tenantId}@kaskedai.local`,
      phone: phone.trim() || '08123456789',
      subscriptionPlan: plan,
      subscriptionStatus: status,
      validUntil: validDate.toISOString(),
      createdAt: new Date().toISOString(),
    };

    await db.tenants.add(newTenant);

    // Otomatis buat 1 outlet/cabang default
    const storeId = 'store_' + Date.now();
    await db.stores.add({
      id: storeId,
      tenantId: tenantId,
      name: businessName.trim(),
      branchName: branchName.trim() || 'Cabang Utama',
      address: 'Lokasi Kedai',
      phone: phone.trim() || '08123456789',
      currency: 'Rp',
      isActive: true,
      createdAt: new Date().toISOString(),
    });

    await logActivity({
      tenantId: tenantId,
      storeId: storeId,
      storeName: `${businessName} - ${branchName}`,
      actorRole: 'superadmin',
      actorName: 'Superadmin Platform',
      actionType: 'TENANT_CREATE',
      description: `Mendaftarkan klien bisnis baru: "${businessName}" (${ownerName}) dengan paket ${plan.toUpperCase()}`,
      metadata: { tenant: newTenant }
    });

    confetti({
      particleCount: 40,
      spread: 60,
      origin: { y: 0.6 }
    });

    setIsAddTenantOpen(false);
    setBusinessName('');
    setOwnerName('');
    setEmail('');
    setPhone('');
    await refreshAllData();
  };

  const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

  return (
    <div className="superadmin-container">
      {/* Top Banner */}
      <div className="superadmin-banner">
        <div className="banner-content">
          <div className="crown-badge">
            <Crown size={28} className="text-amber" />
          </div>
          <div>
            <div className="banner-title-flex">
              <h2>Master Console Platform</h2>
              <span className="badge badge-purple">Superadmin Mode</span>
            </div>
            <p className="text-muted text-sm">
              Kelola seluruh klien UMKM kedai makanan, pantau pendapatan langganan, dan atur lisensi aktif.
            </p>
          </div>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddTenantOpen(true)}>
          <Plus size={18} />
          <span>Daftarkan Klien Kedai Baru</span>
        </button>
      </div>

      {/* SaaS Global Metrics */}
      <div className="superadmin-metrics-grid">
        <div className="card metric-card metric-card-purple">
          <div className="card-header-flex">
            <span className="stat-label">Total Kedai Klien</span>
            <div className="icon-badge icon-badge-purple">
              <Users size={18} />
            </div>
          </div>
          <div className="stat-value text-blue">{tenants.length} Klien</div>
          <div className="stat-breakdown">
            <span>{allStores.length} Cabang / Outlet Aktif</span>
          </div>
        </div>

        <div className="card metric-card metric-card-emerald">
          <div className="card-header-flex">
            <span className="stat-label">Estimasi MRR (Langganan)</span>
            <div className="icon-badge icon-badge-emerald">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-value text-emerald">{formatRupiah(calculateMRR())} <span className="text-xs text-muted">/bln</span></div>
          <div className="stat-breakdown">
            <span>Dari paket Starter & Pro aktif</span>
          </div>
        </div>

        <div className="card metric-card metric-card-blue">
          <div className="card-header-flex">
            <span className="stat-label">Volume Transaksi Platform</span>
            <div className="icon-badge icon-badge-amber">
              <StoreIcon size={18} />
            </div>
          </div>
          <div className="stat-value text-amber">{formatRupiah(totalPlatformVolume)}</div>
          <div className="stat-breakdown">
            <span>{totalTxCount} transaksi tercatat di sistem</span>
          </div>
        </div>
      </div>

      {/* Tenant List Table */}
      <div className="card">
        <div className="card-header-flex">
          <div>
            <h3>Daftar Klien Usaha Terdaftar</h3>
            <p className="text-muted text-sm">Kelola status lisensi dan akses setiap pelaku usaha</p>
          </div>
          <span className="badge badge-emerald">{tenants.length} Terdaftar</span>
        </div>

        <div className="tenant-cards-grid">
          {tenants.map((t) => {
            const tenantStores = allStores.filter(s => s.tenantId === t.id);
            const daysLeft = Math.ceil((new Date(t.validUntil).getTime() - Date.now()) / (1000 * 3600 * 24));
            const isTrial = t.subscriptionStatus === 'trial';
            const isExpired = t.subscriptionStatus === 'expired' || daysLeft <= 0;

            return (
              <div key={t.id} className="tenant-card">
                <div className="tenant-card-header">
                  <div>
                    <h4 className="tenant-biz-name">{t.businessName}</h4>
                    <p className="tenant-owner text-muted text-sm">Pemilik: <strong>{t.ownerName}</strong></p>
                  </div>

                  <div className="plan-badges">
                    <span className={`badge ${t.subscriptionPlan === 'pro' ? 'badge-purple' : 'badge-blue'}`}>
                      Paket {t.subscriptionPlan.toUpperCase()}
                    </span>
                    <span className={`badge ${isExpired ? 'badge-rose' : isTrial ? 'badge-amber' : 'badge-emerald'}`}>
                      {isExpired ? 'Expired' : isTrial ? `Trial (${daysLeft} Hari)` : 'Aktif'}
                    </span>
                  </div>
                </div>

                <div className="tenant-details-list">
                  <div className="detail-item">
                    <Phone size={13} />
                    <span>{t.phone}</span>
                  </div>
                  <div className="detail-item">
                    <StoreIcon size={13} />
                    <span>{tenantStores.length} Cabang: {tenantStores.map(s => s.branchName).join(', ')}</span>
                  </div>
                  <div className="detail-item">
                    <Calendar size={13} />
                    <span>Masa Aktif s/d: {new Date(t.validUntil).toLocaleDateString('id-ID')}</span>
                  </div>
                </div>

                {/* License Action Bar */}
                <div className="tenant-action-bar">
                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => handleUpdateSubscription(t, 'active', 'pro', 30)}
                    title="Perpanjang 30 hari paket Pro"
                  >
                    <Key size={14} />
                    <span>+30 Hari Pro</span>
                  </button>

                  <button 
                    className="btn btn-outline btn-sm"
                    onClick={() => handleUpdateSubscription(t, 'active', 'starter', 30)}
                    title="Perpanjang 30 hari paket Starter"
                  >
                    <span>+30 Hari Starter</span>
                  </button>

                  {t.subscriptionStatus !== 'suspended' ? (
                    <button 
                      className="btn btn-outline btn-sm text-rose"
                      onClick={() => handleUpdateSubscription(t, 'suspended', undefined, 0)}
                      title="Bekukan akun jika belum bayar"
                    >
                      <span>Suspend</span>
                    </button>
                  ) : (
                    <button 
                      className="btn btn-outline btn-sm text-emerald"
                      onClick={() => handleUpdateSubscription(t, 'active', undefined, 30)}
                    >
                      <span>Aktifkan</span>
                    </button>
                  )}

                  {/* Impersonate Button */}
                  <button 
                    className="btn btn-primary btn-sm ml-auto"
                    onClick={() => handleImpersonate(t)}
                    title="Buka panel toko sebagai pemilik"
                  >
                    <LogIn size={14} />
                    <span>Masuk ke Kedai Ini</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal Daftarkan Klien Baru */}
      {isAddTenantOpen && (
        <div className="modal-overlay" onClick={() => setIsAddTenantOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Daftarkan Klien Kedai Baru</h3>
              <button className="icon-btn" onClick={() => setIsAddTenantOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateTenant}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Usaha / Kedai</label>
                  <input
                    type="text"
                    className="form-input"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Contoh: Bebek Goreng Pak Kumis"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Pemilik (Owner)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Contoh: Pak Haryono"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nomor WhatsApp</label>
                  <input
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Cabang / Outlet Pertama</label>
                  <input
                    type="text"
                    className="form-input"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="Contoh: Cabang Ruko Barat (Utama)"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Pilihan Paket Langganan</label>
                  <select
                    className="form-select"
                    value={plan}
                    onChange={(e) => setPlan(e.target.value as SubscriptionPlan)}
                  >
                    <option value="starter">Starter (1 Outlet - Rp 29.000/bln)</option>
                    <option value="pro">Pro (Multi-Outlet & Ekspor Lengkap - Rp 49.000/bln)</option>
                    <option value="enterprise">Enterprise (Unlimited - Rp 99.000/bln)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Status Awal</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as SubscriptionStatus)}
                  >
                    <option value="trial">Masa Percobaan Gratis (Trial 14 Hari)</option>
                    <option value="active">Langsung Aktif Berlangganan (30 Hari)</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddTenantOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Daftarkan Klien Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
