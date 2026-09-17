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
  ChevronDown,
  MapPin,
  Database
} from 'lucide-react';
import { UserRole } from '../../types';
import { WorkspaceSelectModal } from './WorkspaceSelectModal';

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
    setIsStoreModalOpen,
    setIsBackupModalOpen,
    setIsRoleModalOpen
  } = useApp();

  const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);

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
          {/* Workspace Switcher Chip — only for Owner & Kasir */}
          {role !== 'superadmin' && activeTenant && (
            <button
              type="button"
              className="workspace-chip"
              onClick={() => setIsWorkspaceModalOpen(true)}
              title="Ganti Bisnis & Cabang Aktif"
              aria-label="Pilih Bisnis & Cabang"
            >
              <StoreIcon size={14} className="workspace-chip-icon" />
              <span className="workspace-chip-name">
                {activeTenant.businessName}
              </span>
              <span className="workspace-chip-divider">·</span>
              <MapPin size={12} className="workspace-chip-pin" />
              <span className="workspace-chip-branch">
                {activeStore?.branchName || 'Pilih Cabang'}
              </span>
              <ChevronDown size={13} className="workspace-chip-chevron" />
            </button>
          )}

          {/* Online/Offline Status Indicator */}
          <div className={`status-pill ${isOnline ? 'status-online' : 'status-offline'}`} title={isOnline ? 'Online - Siap Sinkronisasi' : 'Offline - Mode IndexedDB Aktif'}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            <span className="status-text">{isOnline ? 'Online' : 'Offline'}</span>
          </div>

          {/* Theme Switcher — hidden on mobile since it is prominently in the mobile menu */}
          <button 
            className="icon-btn hide-mobile" 
            onClick={toggleTheme} 
            title={theme === 'dark' ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Database Backup & Restore Trigger — hidden on mobile since it is prominently in the mobile menu */}
          <button 
            className="icon-btn hide-mobile" 
            onClick={() => setIsBackupModalOpen(true)} 
            title="Cadangan & Pemulihan Database (Backup JSON)"
            aria-label="Backup & Restore Database"
          >
            <Database size={18} />
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

      {/* Workspace Selection Modal */}
      <WorkspaceSelectModal
        isOpen={isWorkspaceModalOpen}
        onClose={() => setIsWorkspaceModalOpen(false)}
      />
    </header>
  );
};
