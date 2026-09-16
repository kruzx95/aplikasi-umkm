import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { 
  exportDatabaseBackup, 
  validateBackupJson, 
  restoreDatabaseBackup, 
  BackupData 
} from '../../utils/backupRestore';
import { 
  Database, 
  Download, 
  Upload, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileJson, 
  ShieldCheck, 
  Calendar, 
  Users, 
  Store as StoreIcon, 
  ReceiptText, 
  Coins 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({ isOpen, onClose }) => {
  const { currentActorName, role, refreshAllData } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'backup' | 'restore'>('backup');
  const [stats, setStats] = useState({
    tenants: 0,
    stores: 0,
    transactions: 0,
    debts: 0,
    shifts: 0,
    totalIncome: 0
  });

  // Backup state
  const [isExporting, setIsExporting] = useState(false);
  const [backupSuccess, setBackupSuccess] = useState<string | null>(null);

  // Restore state
  const [uploadedBackup, setUploadedBackup] = useState<BackupData | null>(null);
  const [restoreMode, setRestoreMode] = useState<'merge' | 'replace'>('merge');
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [restoreSuccess, setRestoreSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load current stats when modal opens
  useEffect(() => {
    if (!isOpen) {
      setBackupSuccess(null);
      setUploadedBackup(null);
      setRestoreError(null);
      setRestoreSuccess(null);
      return;
    }

    const loadDbStats = async () => {
      const [tenants, stores, txs, debts, shifts] = await Promise.all([
        db.tenants.count(),
        db.stores.count(),
        db.transactions.toArray(),
        db.debts.count(),
        db.shifts.count()
      ]);

      const totalIncome = txs
        .filter(t => t.type === 'in')
        .reduce((sum, t) => sum + t.amount, 0);

      setStats({
        tenants,
        stores,
        transactions: txs.length,
        debts,
        shifts,
        totalIncome
      });
    };

    loadDbStats();
  }, [isOpen]);

  if (!isOpen) return null;

  const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

  // Export action
  const handleExport = async () => {
    setIsExporting(true);
    setBackupSuccess(null);
    try {
      const backup = await exportDatabaseBackup(currentActorName, role);
      setBackupSuccess(`File ${backup.metadata.transactionCount} transaksi berhasil diunduh!`);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      console.error('Backup error:', err);
      alert('Gagal mengekspor cadangan: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Handle file select for restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);
    setRestoreSuccess(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const validated = validateBackupJson(text);
        setUploadedBackup(validated);
      } catch (err: any) {
        setUploadedBackup(null);
        setRestoreError(err.message || 'Gagal membaca file JSON.');
      }
    };
    reader.onerror = () => {
      setRestoreError('Gagal membaca file dari perangkat.');
    };
    reader.readAsText(file);
  };

  // Perform restore
  const handleRestore = async () => {
    if (!uploadedBackup) return;

    if (restoreMode === 'replace') {
      const confirmReplace = window.confirm(
        'PERINGATAN: Mode "Ganti Bersih" akan mengosongkan database lokal yang ada saat ini dan menggantinya dengan data cadangan.\n\nLanjutkan pemulihan?'
      );
      if (!confirmReplace) return;
    }

    setIsRestoring(true);
    setRestoreError(null);
    setRestoreSuccess(null);

    try {
      const result = await restoreDatabaseBackup(
        uploadedBackup, 
        restoreMode, 
        currentActorName, 
        role
      );
      
      await refreshAllData();

      setRestoreSuccess(result.message);
      setUploadedBackup(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (err: any) {
      console.error('Restore error:', err);
      setRestoreError(err.message || 'Terjadi kesalahan saat memulihkan data.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content backup-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-icon-wrap icon-badge-emerald">
            <Database size={20} />
          </div>
          <div>
            <h3 className="modal-title">Cadangan & Pemulihan Database</h3>
            <p className="modal-subtitle">Amankan pembukuan kedai secara mandiri (Local-First)</p>
          </div>
          <button className="icon-btn modal-close-btn" onClick={onClose} aria-label="Tutup Modal">
            <X size={18} />
          </button>
        </div>

        {/* Sub-tab switcher (Rounded 10px button group) */}
        <div className="backup-tab-switcher">
          <button
            type="button"
            className={`backup-tab-btn ${activeSubTab === 'backup' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('backup')}
          >
            <Download size={15} />
            <span>Cadangkan Data (Backup)</span>
          </button>
          <button
            type="button"
            className={`backup-tab-btn ${activeSubTab === 'restore' ? 'active' : ''}`}
            onClick={() => setActiveSubTab('restore')}
          >
            <Upload size={15} />
            <span>Pulihkan Data (Restore)</span>
          </button>
        </div>

        {/* Tab 1: Backup View */}
        {activeSubTab === 'backup' && (
          <div className="backup-tab-body">
            <div className="backup-status-banner">
              <ShieldCheck size={20} className="text-emerald" />
              <div>
                <strong>Semua data tersimpan secara lokal di browser Anda</strong>
                <p className="text-muted text-xs">
                  Ekspor cadangan secara berkala agar pembukuan tidak hilang jika browser dibersihkan atau ingin memindahkan data ke perangkat baru.
                </p>
              </div>
            </div>

            {/* Current Database Metrics */}
            <div className="backup-stats-cards">
              <div className="backup-stat-box">
                <span className="text-muted text-xs">Total Transaksi</span>
                <strong>{stats.transactions} Catatan</strong>
              </div>
              <div className="backup-stat-box">
                <span className="text-muted text-xs">Akumulasi Omset</span>
                <strong className="text-emerald">{formatRupiah(stats.totalIncome)}</strong>
              </div>
              <div className="backup-stat-box">
                <span className="text-muted text-xs">Bisnis & Cabang</span>
                <strong>{stats.tenants} Bisnis / {stats.stores} Toko</strong>
              </div>
              <div className="backup-stat-box">
                <span className="text-muted text-xs">Buku Kasbon</span>
                <strong>{stats.debts} Catatan Bon</strong>
              </div>
            </div>

            {backupSuccess && (
              <div className="alert-box alert-success">
                <CheckCircle2 size={16} />
                <span>{backupSuccess}</span>
              </div>
            )}

            {/* Download Action */}
            <div className="backup-action-wrap">
              <button 
                type="button"
                className="btn btn-primary btn-lg btn-block"
                onClick={handleExport}
                disabled={isExporting}
              >
                <Download size={18} />
                <span>{isExporting ? 'Menyiapkan File Cadangan...' : 'Cadangkan & Unduh Database (.json)'}</span>
              </button>
              <p className="backup-hint text-center text-muted text-xs">
                File .json dapat disimpan di Google Drive, flashdisk, atau dikirimkan via email sebagai arsip aman.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Restore View */}
        {activeSubTab === 'restore' && (
          <div className="restore-tab-body">
            {/* Warning Callout */}
            <div className="backup-status-banner alert-warning">
              <AlertTriangle size={20} className="text-amber" />
              <div>
                <strong>Perhatikan Sebelum Memulihkan Data</strong>
                <p className="text-muted text-xs">
                  Pastikan file yang Anda pilih adalah file cadangan resmi (.json) yang sebelumnya diunduh dari KasKedai.
                </p>
              </div>
            </div>

            {/* Hidden native input */}
            <input 
              ref={fileInputRef}
              type="file" 
              accept=".json,application/json" 
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />

            {/* Upload Selector Card */}
            {!uploadedBackup ? (
              <div 
                className="upload-dropzone"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="icon-badge icon-badge-emerald upload-icon">
                  <FileJson size={28} />
                </div>
                <strong>Pilih File Cadangan KasKedai (.json)</strong>
                <p className="text-muted text-xs">Klik di sini untuk menelusuri file cadangan dari perangkat Anda</p>
                <button type="button" className="btn btn-outline btn-sm mt-2">
                  <Upload size={14} />
                  <span>Buka File dari HP / Laptop</span>
                </button>
              </div>
            ) : (
              /* Validated File Details Card */
              <div className="uploaded-preview-card">
                <div className="preview-header">
                  <div className="preview-title-wrap">
                    <CheckCircle2 size={18} className="text-emerald" />
                    <strong>File Cadangan Terverifikasi</strong>
                  </div>
                  <button 
                    type="button" 
                    className="btn btn-outline btn-xs"
                    onClick={() => {
                      setUploadedBackup(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                  >
                    Ganti File
                  </button>
                </div>

                <div className="preview-meta-grid">
                  <div>
                    <span className="text-muted text-xs">Tanggal Ekspor:</span>
                    <p className="font-semibold text-xs">
                      {new Date(uploadedBackup.exportedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted text-xs">Diekspor Oleh:</span>
                    <p className="font-semibold text-xs">
                      {uploadedBackup.exportedBy.name} ({uploadedBackup.exportedBy.role})
                    </p>
                  </div>
                  <div>
                    <span className="text-muted text-xs">Isi Transaksi:</span>
                    <p className="font-semibold text-xs text-emerald">
                      {uploadedBackup.metadata.transactionCount} Transaksi ({formatRupiah(uploadedBackup.metadata.totalIncome)})
                    </p>
                  </div>
                  <div>
                    <span className="text-muted text-xs">Bisnis / Toko:</span>
                    <p className="font-semibold text-xs">
                      {uploadedBackup.metadata.tenantCount} Bisnis, {uploadedBackup.metadata.storeCount} Cabang
                    </p>
                  </div>
                </div>

                {/* Mode Selector */}
                <div className="restore-mode-picker">
                  <span className="restore-mode-label">Pilih Mode Pemulihan:</span>
                  <div className="mode-options-grid">
                    <label className={`mode-card ${restoreMode === 'merge' ? 'active' : ''}`}>
                      <input 
                        type="radio" 
                        name="restoreMode" 
                        checked={restoreMode === 'merge'} 
                        onChange={() => setRestoreMode('merge')}
                      />
                      <div>
                        <strong>Gabungkan Data (Merge)</strong>
                        <p className="text-muted text-xs">Menambah data baru tanpa menghapus data yang ada di perangkat.</p>
                      </div>
                    </label>

                    <label className={`mode-card ${restoreMode === 'replace' ? 'active' : ''}`}>
                      <input 
                        type="radio" 
                        name="restoreMode" 
                        checked={restoreMode === 'replace'} 
                        onChange={() => setRestoreMode('replace')}
                      />
                      <div>
                        <strong>Ganti Bersih (Replace)</strong>
                        <p className="text-muted text-xs">Kosongkan database lokal & ganti persis sesuai file cadangan.</p>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Confirm Restore Button */}
                <button
                  type="button"
                  className="btn btn-primary btn-lg btn-block mt-3"
                  onClick={handleRestore}
                  disabled={isRestoring}
                >
                  <RefreshCw size={18} className={isRestoring ? 'spin-icon' : ''} />
                  <span>{isRestoring ? 'Memulihkan Data ke Database...' : 'Mulai Pemulihan Data'}</span>
                </button>
              </div>
            )}

            {restoreError && (
              <div className="alert-box alert-danger mt-2">
                <AlertTriangle size={16} />
                <span>{restoreError}</span>
              </div>
            )}

            {restoreSuccess && (
              <div className="alert-box alert-success mt-2">
                <CheckCircle2 size={16} />
                <span>{restoreSuccess}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
