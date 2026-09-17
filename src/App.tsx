import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { BottomNav } from './components/layout/BottomNav';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionListView } from './components/transactions/TransactionListView';
import { AddTransactionModal } from './components/transactions/AddTransactionModal';
import { CashRegisterShiftModal } from './components/shifts/CashRegisterShiftModal';
import { DebtListView } from './components/debts/DebtListView';
import { ReportView } from './components/reports/ReportView';
import { ActivityLogView } from './components/logs/ActivityLogView';
import { SuperAdminDashboard } from './components/superadmin/SuperAdminDashboard';
import { StoreManagerModal } from './components/stores/StoreManagerModal';
import { BackupRestoreModal } from './components/backup/BackupRestoreModal';
import { CategoryManagerModal } from './components/categories/CategoryManagerModal';
import { RoleSelectModal } from './components/layout/RoleSelectModal';
import { SettlementModal } from './components/onlinefood/SettlementModal';
import { RawMaterialView } from './components/inventory/RawMaterialView';
import { 
  LayoutDashboard, 
  ReceiptText, 
  CircleDollarSign, 
  BookOpen, 
  FileBarChart2, 
  History, 
  Users, 
  TrendingUp, 
  ShieldCheck,
  Crown,
  LogOut,
  Smartphone,
  Layers
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { 
    role, 
    activeTab, 
    setActiveTab, 
    setIsShiftModalOpen,
    isBackupModalOpen,
    setIsBackupModalOpen,
    isRoleModalOpen,
    setIsRoleModalOpen,
    setIsSettlementModalOpen,
    overdueDebtsCount,
    pendingSettlementCount,
    lowStockCount,
    isImpersonating,
    exitImpersonation,
    activeTenant
  } = useApp();

  return (
    <div className="app-container">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="impersonation-banner">
          <div className="impersonation-content">
            <div className="impersonation-crown-wrap">
              <Crown size={15} className="text-amber" />
            </div>
            <span>
              <strong>Mode Impersonasi Aktif:</strong> Anda sedang mengelola kedai <strong>{activeTenant?.businessName}</strong> ({activeTenant?.ownerName})
            </span>
          </div>
          <button 
            className="btn btn-sm btn-impersonation-exit" 
            onClick={exitImpersonation}
            title="Keluar dari mode impersonasi dan kembali ke Master Console"
          >
            <LogOut size={13} />
            <span>Kembali ke Master Console Superadmin</span>
          </button>
        </div>
      )}

      {/* Top Header Navbar */}
      <Navbar />

      {/* Desktop Tabs Header (Tampil di Laptop / Tablet) */}
      <div className="desktop-nav-tabs">
        <div className="desktop-nav-tabs-track">
          {role === 'superadmin' ? (
            <>
              <button
                className={`tab-btn ${activeTab === 'admin-tenants' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin-tenants')}
              >
                <Users size={16} />
                <span>Klien Kedai & Lisensi</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'admin-logs' ? 'active' : ''}`}
                onClick={() => setActiveTab('admin-logs')}
              >
                <ShieldCheck size={16} />
                <span>Audit Log Platform</span>
              </button>
            </>
          ) : (
            <>
              {role === 'owner' && (
                <button
                  className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
                  onClick={() => setActiveTab('dashboard')}
                >
                  <LayoutDashboard size={16} />
                  <span>Dashboard Omset</span>
                </button>
              )}
              <button
                className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
                onClick={() => setActiveTab('transactions')}
              >
                <ReceiptText size={16} />
                <span>Buku Kas</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
                onClick={() => setActiveTab('inventory')}
              >
                <Layers size={16} />
                <span>Stok Bahan</span>
                {lowStockCount > 0 && (
                  <span className="tab-overdue-badge badge-amber" title={`${lowStockCount} bahan baku mendekati habis!`}>
                    {lowStockCount}
                  </span>
                )}
              </button>
              <button
                className={`tab-btn ${activeTab === 'settlement' ? 'active' : ''}`}
                onClick={() => setIsSettlementModalOpen(true)}
              >
                <Smartphone size={16} />
                <span>Pencairan Online</span>
                {pendingSettlementCount > 0 && (
                  <span className="tab-overdue-badge badge-emerald" title={`${pendingSettlementCount} pesanan online food belum dicairkan`}>
                    {pendingSettlementCount}
                  </span>
                )}
              </button>
              <button
                className={`tab-btn ${activeTab === 'shift' ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab('shift');
                  setIsShiftModalOpen(true);
                }}
              >
                <CircleDollarSign size={16} />
                <span>Kas Laci & Shift</span>
              </button>
              <button
                className={`tab-btn ${activeTab === 'debts' ? 'active' : ''}`}
                onClick={() => setActiveTab('debts')}
              >
                <BookOpen size={16} />
                <span>Buku Kasbon</span>
                {overdueDebtsCount > 0 && (
                  <span className="tab-overdue-badge" title={`${overdueDebtsCount} kasbon melewati tanggal tempo!`}>
                    {overdueDebtsCount}
                  </span>
                )}
              </button>
              {role === 'owner' && (
                <>
                  <button
                    className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                  >
                    <FileBarChart2 size={16} />
                    <span>Laporan & WA</span>
                  </button>
                  <button
                    className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('logs')}
                  >
                    <History size={16} />
                    <span>Audit Log</span>
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Main View Router */}
      <main className="main-content">
        {role === 'superadmin' ? (
          <>
            {activeTab === 'admin-tenants' && <SuperAdminDashboard />}
            {activeTab === 'admin-logs' && <ActivityLogView />}
          </>
        ) : (
          <>
            {activeTab === 'dashboard' && role === 'owner' && <DashboardView />}
            {(activeTab === 'transactions' || (role === 'cashier' && activeTab === 'dashboard')) && <TransactionListView />}
            {activeTab === 'inventory' && <RawMaterialView />}
            {activeTab === 'shift' && <DashboardView />}
            {activeTab === 'debts' && <DebtListView />}
            {activeTab === 'reports' && role === 'owner' && <ReportView />}
            {activeTab === 'logs' && role === 'owner' && <ActivityLogView />}
          </>
        )}
      </main>

      {/* Floating Bottom Nav for Mobile */}
      <BottomNav />

      {/* Modals */}
      <AddTransactionModal />
      <CashRegisterShiftModal />
      <StoreManagerModal />
      <CategoryManagerModal />
      <SettlementModal />
      <BackupRestoreModal 
        isOpen={isBackupModalOpen} 
        onClose={() => setIsBackupModalOpen(false)} 
      />
      <RoleSelectModal 
        isOpen={isRoleModalOpen} 
        onClose={() => setIsRoleModalOpen(false)} 
      />
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainAppContent />
    </AppProvider>
  );
}
