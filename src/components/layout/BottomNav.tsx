import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  ReceiptText, 
  CircleDollarSign, 
  BookOpen, 
  FileBarChart2, 
  History, 
  Users, 
  TrendingUp, 
  ShieldAlert,
  Plus,
  LayoutGrid,
  Store,
  Sun,
  Moon,
  X,
  ChevronRight,
  Database,
  Tag,
  ShieldCheck,
  Smartphone,
  Layers,
  ArrowLeft
} from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { 
    role, 
    activeTab, 
    setActiveTab, 
    setIsAddTxOpen, 
    setIsStoreModalOpen, 
    setIsShiftModalOpen,
    setIsBackupModalOpen,
    setIsCategoryModalOpen,
    setIsRoleModalOpen,
    setIsSettlementModalOpen,
    activeShift,
    activeStore,
    theme,
    toggleTheme,
    overdueDebtsCount,
    pendingSettlementCount,
    lowStockCount
  } = useApp();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (role === 'superadmin') {
    return (
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'admin-tenants' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin-tenants')}
        >
          <div className="nav-icon-wrap">
            <Users size={20} />
          </div>
          <span>Klien Kedai</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'admin-metrics' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin-metrics')}
        >
          <div className="nav-icon-wrap">
            <TrendingUp size={20} />
          </div>
          <span>Analitik SaaS</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'admin-logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin-logs')}
        >
          <div className="nav-icon-wrap">
            <ShieldAlert size={20} />
          </div>
          <span>Audit Global</span>
        </button>
      </nav>
    );
  }

  // Cashier Navigation (4 items + FAB)
  if (role === 'cashier') {
    return (
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <div className="nav-icon-wrap">
            <ReceiptText size={20} />
          </div>
          <span>Buku Kas</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'shift' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('shift');
            setIsShiftModalOpen(true);
          }}
        >
          <div className="nav-icon-wrap">
            <CircleDollarSign size={20} />
          </div>
          <span>Kas Laci</span>
        </button>

        {/* Center Quick Add FAB */}
        <button 
          className="quick-add-btn" 
          onClick={() => setIsAddTxOpen(true)}
          title="Catat Pemasukan / Pengeluaran"
          aria-label="Tambah Transaksi"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>

        <button
          className={`nav-item ${activeTab === 'debts' ? 'active' : ''}`}
          onClick={() => setActiveTab('debts')}
        >
          <div className="nav-icon-wrap relative-icon-wrap">
            <BookOpen size={20} />
            {overdueDebtsCount > 0 && (
              <span className="mobile-overdue-badge" title={`${overdueDebtsCount} kasbon melewati jatuh tempo`}>
                {overdueDebtsCount}
              </span>
            )}
          </div>
          <span>Kasbon</span>
        </button>
      </nav>
    );
  }

  // Owner Navigation (Golden 5-destination mobile layout: Dashboard, Buku Kas, FAB, Kasbon, Menu Lainnya)
  const isOtherActive = activeTab === 'shift' || activeTab === 'reports' || activeTab === 'logs';

  const handleSelectMenuItem = (tab: string, openShiftModal: boolean = false) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
    if (openShiftModal) {
      setIsShiftModalOpen(true);
    }
  };

  return (
    <>
      <nav className="bottom-nav">
        <button
          className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <div className="nav-icon-wrap">
            <LayoutDashboard size={20} />
          </div>
          <span>Dashboard</span>
        </button>

        <button
          className={`nav-item ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <div className="nav-icon-wrap">
            <ReceiptText size={20} />
          </div>
          <span>Buku Kas</span>
        </button>

        {/* Floating Center Quick Action Button */}
        <button 
          className="quick-add-btn" 
          onClick={() => setIsAddTxOpen(true)}
          title="Catat Transaksi Cepat"
          aria-label="Tambah Transaksi"
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>

        <button
          className={`nav-item ${activeTab === 'debts' ? 'active' : ''}`}
          onClick={() => setActiveTab('debts')}
        >
          <div className="nav-icon-wrap relative-icon-wrap">
            <BookOpen size={20} />
            {overdueDebtsCount > 0 && (
              <span className="mobile-overdue-badge" title={`${overdueDebtsCount} kasbon melewati jatuh tempo`}>
                {overdueDebtsCount}
              </span>
            )}
          </div>
          <span>Kasbon</span>
        </button>

        {/* 5th Tab: Menu / Fitur Lainnya */}
        <button
          className={`nav-item ${isOtherActive || isMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMenuOpen(true)}
          aria-label="Menu Fitur Lainnya"
        >
          <div className="nav-icon-wrap">
            <LayoutGrid size={20} />
          </div>
          <span>Menu</span>
        </button>
      </nav>

      {/* Mobile Menu Bottom Sheet Drawer */}
      {isMenuOpen && (
        <div className="modal-overlay menu-drawer-overlay" onClick={() => setIsMenuOpen(false)}>
          <div className="menu-drawer-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-drag-handle"></div>
            
            <div className="menu-drawer-header">
              <button 
                type="button"
                className="menu-back-btn" 
                onClick={() => setIsMenuOpen(false)} 
                aria-label="Kembali ke Layar Sebelumnya"
              >
                <ArrowLeft size={17} />
                <span>Kembali</span>
              </button>

              <div className="menu-drawer-header-center">
                <h3 className="menu-drawer-title">Menu & Fitur Kedai</h3>
                <p className="text-muted text-xs">{activeStore?.name} • {activeStore?.branchName}</p>
              </div>

              <button 
                type="button"
                className="icon-btn menu-close-x-btn" 
                onClick={() => setIsMenuOpen(false)} 
                aria-label="Tutup Menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="menu-drawer-list">
              {/* Ganti Peran Pengguna Tile */}
              <button 
                className="menu-tile role-drawer-tile"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsRoleModalOpen(true);
                }}
              >
                <div className="menu-tile-icon icon-emerald">
                  <ShieldCheck size={20} />
                </div>
                <div className="menu-tile-info">
                  <strong>Ganti Peran Pengguna</strong>
                  <span className="text-muted text-xs">
                    Peran Aktif: 🏪 Pemilik Kedai (Owner)
                  </span>
                </div>
                <span className="badge badge-emerald">
                  Ganti
                </span>
                <ChevronRight size={16} className="text-muted" />
              </button>

              {/* Pencairan Saldo Online Food Tile */}
              <button 
                className="menu-tile"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsSettlementModalOpen(true);
                }}
              >
                <div className="menu-tile-icon icon-emerald">
                  <Smartphone size={20} />
                </div>
                <div className="menu-tile-info">
                  <strong>Pencairan Saldo Online Food</strong>
                  <span className="text-muted text-xs">
                    GoFood, ShopeeFood, GrabFood ke Bank
                  </span>
                </div>
                {pendingSettlementCount > 0 ? (
                  <span className="badge badge-amber">{pendingSettlementCount} Belum Cair</span>
                ) : (
                  <span className="badge badge-emerald">Semua Cair</span>
                )}
                <ChevronRight size={16} className="text-muted" />
              </button>

              {/* Stok Bahan Baku Kedai Tile */}
              <button 
                className={`menu-tile ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => handleSelectMenuItem('inventory')}
              >
                <div className="menu-tile-icon icon-blue">
                  <Layers size={20} />
                </div>
                <div className="menu-tile-info">
                  <strong>Stok Bahan Baku & Mentah</strong>
                  <span className="text-muted text-xs">
                    Pantau sisa persediaan & belanja pasar
                  </span>
                </div>
                {lowStockCount > 0 ? (
                  <span className="badge badge-danger">⚠️ {lowStockCount} Menipis</span>
                ) : (
                  <span className="badge badge-emerald">Aman</span>
                )}
                <ChevronRight size={16} className="text-muted" />
              </button>

              {/* Shift & Laci */}
              <button 
                className={`menu-tile ${activeTab === 'shift' ? 'active' : ''}`}
                onClick={() => handleSelectMenuItem('shift', true)}
              >
                <div className="menu-tile-icon icon-amber">
                  <CircleDollarSign size={20} />
                </div>
                <div className="menu-tile-info">
                  <strong>Kas Laci & Shift Kasir</strong>
                  <span className="text-muted text-xs">
                    {activeShift ? `Shift aktif: ${activeShift.cashierName}` : 'Buka modal laci kasir baru'}
                  </span>
                </div>
                {activeShift && <span className="status-pill status-online text-xs">Aktif</span>}
                <ChevronRight size={16} className="text-muted" />
              </button>

              {/* Laporan & WA */}
              <button 
                className={`menu-tile ${activeTab === 'reports' ? 'active' : ''}`}
                onClick={() => handleSelectMenuItem('reports')}
              >
                <div className="menu-tile-icon icon-emerald">
                  <FileBarChart2 size={20} />
                </div>
                <div className="menu-tile-info">
                  <strong>Laporan Penjualan & WA</strong>
                  <span className="text-muted text-xs">Rekap harian, laba bersih & kirim ke WhatsApp</span>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>

              {/* Audit Log */}
              <button 
                className={`menu-tile ${activeTab === 'logs' ? 'active' : ''}`}
                onClick={() => handleSelectMenuItem('logs')}
              >
                <div className="menu-tile-icon icon-purple">
                  <History size={20} />
                </div>
                <div className="menu-tile-info">
                  <strong>Audit Log Kedai</strong>
                  <span className="text-muted text-xs">Rekam jejak penghapusan kas & anti-fraud</span>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>

              {/* Cadangan & Pemulihan Data */}
              <button 
                className="menu-tile"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsBackupModalOpen(true);
                }}
              >
                <div className="menu-tile-icon icon-emerald">
                  <Database size={20} />
                </div>
                <div className="menu-tile-info">
                  <strong>Cadangan Data (Backup & Restore)</strong>
                  <span className="text-muted text-xs">Simpan / pulihkan file database JSON</span>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>

              {/* Kelola Kategori Pos Kas */}
              <button 
                className="menu-tile"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsCategoryModalOpen(true);
                }}
              >
                <div className="menu-tile-icon icon-purple">
                  <Tag size={20} />
                </div>
                <div className="menu-tile-info">
                  <strong>Kelola Kategori Pos Kas</strong>
                  <span className="text-muted text-xs">Atur pos pemasukan & pengeluaran kedai</span>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>

              {/* Kelola Toko / Cabang */}
              <button 
                className="menu-tile"
                onClick={() => {
                  setIsMenuOpen(false);
                  setIsStoreModalOpen(true);
                }}
              >
                <div className="menu-tile-icon icon-blue">
                  <Store size={20} />
                </div>
                <div className="menu-tile-info">
                  <strong>Kelola Outlet & Cabang</strong>
                  <span className="text-muted text-xs">Tambah cabang baru & lisensi kedai</span>
                </div>
                <ChevronRight size={16} className="text-muted" />
              </button>

              {/* Theme Quick Toggle */}
              <div className="menu-tile theme-tile" onClick={toggleTheme}>
                <div className="menu-tile-icon icon-gray">
                  {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </div>
                <div className="menu-tile-info">
                  <strong>Tema Tampilan</strong>
                  <span className="text-muted text-xs">{theme === 'dark' ? 'Mode Gelap Aktif' : 'Mode Terang (Putih)'}</span>
                </div>
                <button className="btn btn-outline btn-sm" style={{ pointerEvents: 'none' }}>
                  {theme === 'dark' ? '☀️ Terang' : '🌙 Gelap'}
                </button>
              </div>
            </div>

            {/* Sticky/Pinned Bottom Close & Kembali Button */}
            <div className="menu-drawer-footer">
              <button 
                type="button"
                className="btn btn-secondary menu-footer-back-btn" 
                onClick={() => setIsMenuOpen(false)}
              >
                <ArrowLeft size={16} />
                <span>Kembali / Tutup Menu</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
