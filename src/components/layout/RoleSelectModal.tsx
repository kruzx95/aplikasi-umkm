import React from 'react';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import { X, Check, Crown, Store, UserCheck, ShieldCheck } from 'lucide-react';

interface RoleSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RoleSelectModal: React.FC<RoleSelectModalProps> = ({ isOpen, onClose }) => {
  const { role, setRole } = useApp();

  if (!isOpen) return null;

  const handleSelectRole = (newRole: UserRole) => {
    setRole(newRole);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content role-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-drag-handle"></div>

        <div className="modal-header">
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Pilih Peran Pengguna</h3>
            <p className="text-muted text-xs">Simulasikan pengalaman pengguna sesuai hak akses</p>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Tutup">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '0.75rem' }}>
          {/* Option 1: Owner */}
          <div
            className={`role-option-card ${role === 'owner' ? 'active-role' : ''}`}
            onClick={() => handleSelectRole('owner')}
          >
            <div className="role-option-icon icon-owner">
              <Store size={22} />
            </div>
            <div className="role-option-info">
              <div className="role-option-title-row">
                <strong>🏪 Pemilik Kedai (Owner Toko)</strong>
                {role === 'owner' && <span className="active-badge"><Check size={14} /> Aktif</span>}
              </div>
              <p className="role-option-desc">
                Dashboard omset harian, estimasi profit bersih, kas laci fisik, buku kasbon pelanggan, laporan rekap WhatsApp, dan audit log kedai.
              </p>
            </div>
          </div>

          {/* Option 2: Cashier */}
          <div
            className={`role-option-card ${role === 'cashier' ? 'active-role' : ''}`}
            onClick={() => handleSelectRole('cashier')}
          >
            <div className="role-option-icon icon-cashier">
              <UserCheck size={22} />
            </div>
            <div className="role-option-info">
              <div className="role-option-title-row">
                <strong>💼 Kasir / Karyawan Kedai</strong>
                {role === 'cashier' && <span className="active-badge"><Check size={14} /> Aktif</span>}
              </div>
              <p className="role-option-desc">
                Pencatatan kas masuk & belanja bahan, buka/tutup shift laci kasir (uang kembalian), dan pencatatan bon pelanggan.
              </p>
            </div>
          </div>

          {/* Option 3: Superadmin */}
          <div
            className={`role-option-card ${role === 'superadmin' ? 'active-role' : ''}`}
            onClick={() => handleSelectRole('superadmin')}
          >
            <div className="role-option-icon icon-superadmin">
              <Crown size={22} />
            </div>
            <div className="role-option-info">
              <div className="role-option-title-row">
                <strong>👑 Superadmin Platform (Vendor SaaS)</strong>
                {role === 'superadmin' && <span className="active-badge"><Check size={14} /> Aktif</span>}
              </div>
              <p className="role-option-desc">
                Console master untuk mengelola lisensi multi-tenant seluruh kedai klien, analitik MRR langganan, dan audit log global platform.
              </p>
            </div>
          </div>
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
