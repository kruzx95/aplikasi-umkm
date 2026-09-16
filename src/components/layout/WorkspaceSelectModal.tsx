import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Tenant, Store } from '../../types';
import { X, Check, Store as StoreIcon, MapPin, ChevronRight, Plus, Settings, Building2, Sparkles } from 'lucide-react';

interface WorkspaceSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WorkspaceSelectModal: React.FC<WorkspaceSelectModalProps> = ({ isOpen, onClose }) => {
  const { 
    tenants, 
    activeTenant, 
    setActiveTenant, 
    stores, 
    activeStore, 
    setActiveStore, 
    role,
    setIsStoreModalOpen 
  } = useApp();

  if (!isOpen) return null;

  const handleSelectTenant = (tenant: Tenant) => {
    setActiveTenant(tenant);
  };

  const handleSelectStore = (store: Store) => {
    setActiveStore(store);
    onClose();
  };

  const handleManageStores = () => {
    onClose();
    setIsStoreModalOpen(true);
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'pro': return 'badge-emerald';
      case 'enterprise': return 'badge-purple';
      default: return 'badge-amber';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active': return { label: 'Aktif', className: 'ws-status-active' };
      case 'trial': return { label: 'Trial', className: 'ws-status-trial' };
      case 'expired': return { label: 'Expired', className: 'ws-status-expired' };
      default: return { label: status, className: 'ws-status-default' };
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content ws-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-handle"></div>

        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Pilih Bisnis & Cabang</h3>
            <p className="text-muted text-xs">Kelola workspace aktif Anda</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body ws-modal-body">
          {/* Section: Bisnis / Tenant */}
          <div className="ws-section">
            <div className="ws-section-label">
              <Building2 size={14} />
              <span>Bisnis Kedai</span>
            </div>

            <div className="ws-cards-list">
              {tenants.map((tenant) => {
                const isActive = activeTenant?.id === tenant.id;
                const statusInfo = getStatusLabel(tenant.subscriptionStatus);
                return (
                  <div
                    key={tenant.id}
                    className={`ws-card ${isActive ? 'ws-card-active' : ''}`}
                    onClick={() => handleSelectTenant(tenant)}
                  >
                    <div className="ws-card-icon">
                      <StoreIcon size={20} />
                    </div>
                    <div className="ws-card-info">
                      <div className="ws-card-title-row">
                        <strong>{tenant.businessName}</strong>
                        <div className="ws-card-badges">
                          <span className={`badge badge-xs ${getPlanColor(tenant.subscriptionPlan)}`}>
                            {tenant.subscriptionPlan.toUpperCase()}
                          </span>
                          {isActive && (
                            <span className="ws-check-badge">
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="ws-card-sub">
                        👤 {tenant.ownerName} · <span className={statusInfo.className}>{statusInfo.label}</span>
                      </p>
                    </div>
                    <ChevronRight size={16} className="ws-card-chevron" />
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Cabang / Store */}
          {activeTenant && (
            <div className="ws-section">
              <div className="ws-section-label">
                <MapPin size={14} />
                <span>Cabang — {activeTenant.businessName}</span>
              </div>

              <div className="ws-cards-list">
                {stores.map((store) => {
                  const isActive = activeStore?.id === store.id;
                  return (
                    <div
                      key={store.id}
                      className={`ws-card ws-card-branch ${isActive ? 'ws-card-active' : ''}`}
                      onClick={() => handleSelectStore(store)}
                    >
                      <div className="ws-card-icon ws-card-icon-branch">
                        <MapPin size={18} />
                      </div>
                      <div className="ws-card-info">
                        <div className="ws-card-title-row">
                          <strong>{store.branchName}</strong>
                          {isActive && (
                            <span className="ws-check-badge">
                              <Check size={12} />
                            </span>
                          )}
                        </div>
                        <p className="ws-card-sub">
                          📍 {store.address}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Manage Stores button — only for Owner */}
              {role === 'owner' && (
                <button 
                  className="ws-manage-btn" 
                  onClick={handleManageStores}
                  type="button"
                >
                  <Settings size={15} />
                  <span>Kelola Cabang & Toko</span>
                </button>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary btn-block" onClick={onClose}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
