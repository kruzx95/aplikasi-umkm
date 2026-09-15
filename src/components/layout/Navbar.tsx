import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  Store as StoreIcon, 
  ShieldCheck, 
  User, 
  Crown, 
  Sun, 
  Moon, 
  Wifi, 
  WifiOff, 
  Settings,
  ChevronDown
} from 'lucide-react';
import { UserRole } from '../../types';
import { RoleSelectModal } from './RoleSelectModal';

export const Navbar: React.FC = () => {
  const { 
    role, 
    setRole, 
    tenants, 
    activeTenant, 
    setActiveTenant, 
    stores, 
    activeStore, 
    setActiveStore,
    theme, 
    toggleTheme, 
    isOnline,
    setIsStoreModalOpen
  } = useApp();

  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  return (
    <header className="navbar-container">
      <div className="navbar-top">
        {/* Brand */}
        <div className="brand-section">
          <div className="brand-logo">
            <span className="brand-icon">🍲</span>
          </div>
          <div className="brand-info">
            <div className="brand-title-wrap">
              <h1 className="brand-title">KasKedai</h1>
              <span className="badge badge-emerald badge-pwa">F&B PWA</span>
            </div>
            <p className="brand-subtitle">
              {role === 'superadmin' ? 'Master Platform Console' : (activeTenant?.businessName || 'Buku Kas Kedai')}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="navbar-actions">
          {/* Online/Offline Status Indicator */}
          <div className={`status-pill ${isOnline ? 'status-online' : 'status-offline'}`} title={isOnline ? 'Online - Siap Sinkronisasi' : 'Offline - Mode IndexedDB Aktif'}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Theme Switcher */}
          <button 
            className="icon-btn" 
            onClick={toggleTheme} 
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Role Switcher Pill Trigger Modal */}
          <button
            type="button"
            className={`role-badge-btn role-${role}`}
            onClick={() => setIsRoleModalOpen(true)}
            title="Ganti Peran / Hak Akses (Superadmin, Owner, Kasir)"
            aria-label="Pilih Peran Pengguna"
          >
            <span className="role-badge-icon">
              {role === 'superadmin' ? '👑' : role === 'owner' ? '🏪' : '💼'}
            </span>
            <span className="role-badge-label">
              {role === 'superadmin' ? 'Superadmin' : role === 'owner' ? 'Owner' : 'Kasir'}
            </span>
            <ChevronDown size={13} className="role-badge-chevron" />
          </button>
        </div>
      </div>

      {/* Tenant & Branch Bar (Hanya tampil untuk Owner & Kasir) */}
      {role !== 'superadmin' && activeTenant && (
        <div className="tenant-branch-bar">
          <div className="tenant-select-group">
            <span className="bar-label">Bisnis:</span>
            <select
              className="bar-select"
              value={activeTenant.id}
              onChange={(e) => {
                const selected = tenants.find(t => t.id === e.target.value);
                if (selected) setActiveTenant(selected);
              }}
            >
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.businessName} ({t.subscriptionPlan.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          <div className="branch-select-group">
            <span className="bar-label">Cabang:</span>
            <select
              className="bar-select"
              value={activeStore?.id || ''}
              onChange={(e) => {
                const s = stores.find(store => store.id === e.target.value);
                if (s) setActiveStore(s);
              }}
            >
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  📍 {s.branchName}
                </option>
              ))}
            </select>
          </div>

          {/* Settings Outlet Button */}
          {role === 'owner' && (
            <button 
              className="btn btn-outline btn-sm outlet-btn" 
              onClick={() => setIsStoreModalOpen(true)}
              title="Kelola Outlet & Cabang"
              aria-label="Kelola Outlet & Cabang"
            >
              <Settings size={14} />
              <span className="outlet-btn-text">Kelola Toko</span>
            </button>
          )}
        </div>
      )}

      {/* Role Selection Modal */}
      <RoleSelectModal 
        isOpen={isRoleModalOpen} 
        onClose={() => setIsRoleModalOpen(false)} 
      />
    </header>
  );
};
