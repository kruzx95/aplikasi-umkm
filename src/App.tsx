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
import { 
  LayoutDashboard, 
  ReceiptText, 
  CircleDollarSign, 
  BookOpen, 
  FileBarChart2, 
  History, 
  Users, 
  TrendingUp, 
  ShieldCheck 
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { role, activeTab, setActiveTab, setIsShiftModalOpen } = useApp();

  return (
    <div className="app-container">
      {/* Top Header Navbar */}
      <Navbar />

      {/* Desktop Tabs Header (Tampil di Laptop / Tablet) */}
      <div className="desktop-nav-tabs">
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
              <span>Buku Kas Masuk & Keluar</span>
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
                  <span>Audit Log Toko</span>
                </button>
              </>
            )}
          </>
        )}
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
