import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { logActivity } from '../../db/logger';
import { Store } from '../../types';
import { X, Store as StoreIcon, Plus, Check, MapPin, Phone } from 'lucide-react';

export const StoreManagerModal: React.FC = () => {
  const { 
    isStoreModalOpen, 
    setIsStoreModalOpen, 
    activeTenant, 
    stores, 
    activeStore, 
    setActiveStore, 
    role, 
    currentActorName,
    refreshAllData 
  } = useApp();

  const [isAddingNew, setIsAddingNew] = useState(false);
  const [branchName, setBranchName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  if (!isStoreModalOpen || !activeTenant) return null;

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) return;

    // Check plan limits
    if (activeTenant.subscriptionPlan === 'starter' && stores.length >= 1) {
      alert('Paket Starter dibatasi hanya 1 outlet/cabang. Silakan upgrade ke Paket Pro untuk mengelola banyak cabang kedai!');
      return;
    }

    const newStoreId = 'store_' + Date.now();
    const newStore: Store = {
      id: newStoreId,
      tenantId: activeTenant.id,
      name: activeTenant.businessName,
      branchName: branchName.trim(),
      address: address.trim() || 'Alamat Kedai',
      phone: phone.trim() || activeTenant.phone,
      currency: 'Rp',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    await db.stores.add(newStore);

    await logActivity({
      tenantId: activeTenant.id,
      storeId: newStoreId,
      storeName: `${newStore.name} - ${newStore.branchName}`,
      actorRole: role,
      actorName: currentActorName,
      actionType: 'STORE_ADD',
      description: `Menambahkan outlet/cabang baru: "${branchName}"`,
      metadata: { store: newStore }
    });

    setIsAddingNew(false);
    setBranchName('');
    setAddress('');
    setPhone('');
    await refreshAllData();
    setActiveStore(newStore);
  };

  return (
    <div className="modal-overlay" onClick={() => setIsStoreModalOpen(false)}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>Kelola Cabang & Toko</h3>
            <span className="text-muted text-sm">{activeTenant.businessName}</span>
          </div>
          <button className="icon-btn" onClick={() => setIsStoreModalOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Subscription info */}
          <div className="tenant-plan-notice">
            <span>Paket: <strong>{activeTenant.subscriptionPlan.toUpperCase()}</strong></span>
            <span>Jumlah Cabang: <strong>{stores.length} Outlet</strong></span>
          </div>

          {/* List of Outlets */}
          <div className="stores-list">
            {stores.map((s) => (
              <div 
                key={s.id} 
                className={`store-item-card ${activeStore?.id === s.id ? 'active-store' : ''}`}
                onClick={() => setActiveStore(s)}
              >
                <div className="store-item-content">
                  <div className="store-badge-icon">
                    <StoreIcon size={18} />
                  </div>
                  <div>
                    <strong>{s.branchName}</strong>
                    <div className="store-sub-info text-muted text-xs">
                      <MapPin size={11} /> {s.address}
                    </div>
                  </div>
                </div>

                {activeStore?.id === s.id && (
                  <span className="badge badge-emerald">
                    <Check size={12} /> Aktif
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Form to add branch */}
          {isAddingNew ? (
            <form onSubmit={handleCreateStore} className="add-store-form">
              <div className="form-group">
                <label className="form-label">Nama Cabang Baru</label>
                <input
                  type="text"
                  className="form-input"
                  value={branchName}
                  onChange={(e) => setBranchName(e.target.value)}
                  placeholder="Misal: Cabang Foodcourt Pasar Modern"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Alamat / Lokasi Kedai</label>
                <input
                  type="text"
                  className="form-input"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Misal: Jl. Soekarno Hatta No. 12"
                />
              </div>

              <div className="form-group">
                <label className="form-label">No. Telepon / WhatsApp Cabang</label>
                <input
                  type="text"
                  className="form-input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Misal: 081234567890"
                />
              </div>

              <div className="flex-gap-sm mt-2">
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setIsAddingNew(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary btn-sm flex-1">
                  Simpan Cabang Baru
                </button>
              </div>
            </form>
          ) : (
            <button 
              className="btn btn-outline btn-block"
              onClick={() => setIsAddingNew(true)}
            >
              <Plus size={16} />
              <span>Tambah Cabang / Outlet Baru</span>
            </button>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={() => setIsStoreModalOpen(false)}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
