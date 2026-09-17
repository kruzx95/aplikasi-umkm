import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { Transaction } from '../../types';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  CreditCard, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Plus, 
  CircleDollarSign, 
  Share2, 
  Clock, 
  AlertCircle,
  Calendar,
  Smartphone,
  Layers
} from 'lucide-react';
import { TrendChart7Days } from './TrendChart7Days';
import { PaymentMethodDonut } from './PaymentMethodDonut';

export const DashboardView: React.FC = () => {
  const { 
    activeStore, 
    activeTenant, 
    role, 
    setIsAddTxOpen, 
    setIsShiftModalOpen, 
    activeShift,
    setActiveTab,
    pendingSettlementCount,
    pendingSettlementTotal,
    setIsSettlementModalOpen,
    lowStockCount
  } = useApp();

  const [todayTransactions, setTodayTransactions] = useState<Transaction[]>([]);
  const [weekTransactions, setWeekTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!activeStore) return;
      setLoading(true);
      const txs = await db.transactions
        .where('storeId')
        .equals(activeStore.id)
        .reverse()
        .sortBy('createdAt');

      // Filter last 7 days (today - 6 days through today)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
      const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

      const weekList = txs.filter(t => t.date >= sevenDaysAgoStr && t.date <= todayStr);
      setWeekTransactions(weekList);

      // Filter today's transactions
      const todayList = txs.filter(t => t.date === todayStr);
      setTodayTransactions(todayList);
      setLoading(false);
    };

    fetchDashboardData();
  }, [activeStore, todayStr]);

  // Calculations
  const totalIncome = todayTransactions
    .filter(t => t.type === 'in')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = todayTransactions
    .filter(t => t.type === 'out')
    .reduce((sum, t) => sum + t.amount, 0);

  const estimatedProfit = totalIncome - totalExpense;

  // Split cash vs digital
  const cashIncome = todayTransactions
    .filter(t => t.type === 'in' && t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const qrisIncome = todayTransactions
    .filter(t => t.type === 'in' && t.paymentMethod !== 'cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const cashExpense = todayTransactions
    .filter(t => t.type === 'out' && t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);

  // Expected Cash In Drawer
  const startCash = activeShift ? activeShift.startCash : 0;
  const expectedCashInDrawer = startCash + cashIncome - cashExpense;

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const formatDateIndo = () => {
    return new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <div className="dashboard-container">
      {/* Top Welcome & Shift Status Banner */}
      <div className="dashboard-header">
        <div>
          <div className="date-badge">
            <Calendar size={14} />
            <span>{formatDateIndo()}</span>
          </div>
          <h2 className="store-title">{activeStore?.name}</h2>
          <p className="branch-subtitle">{activeStore?.branchName} • {activeTenant?.businessName}</p>
        </div>

        {/* Quick Shift Button */}
        <div className="shift-badge-wrap">
          {activeShift ? (
            <div className="shift-status active-shift" onClick={() => setIsShiftModalOpen(true)}>
              <span className="pulse-dot"></span>
              <div>
                <span className="shift-label">Shift Aktif: {activeShift.cashierName}</span>
                <span className="shift-sub">Klik untuk Tutup Kas Laci</span>
              </div>
            </div>
          ) : (
            <button className="btn btn-outline btn-sm" onClick={() => setIsShiftModalOpen(true)}>
              <CircleDollarSign size={16} />
              <span>Buka Shift Kasir Baru</span>
            </button>
          )}
        </div>
      </div>

      {/* Main KPI Cards Grid */}
      <div className="stats-grid">
        {/* Card 1: Total Omset */}
        <div className="stat-card income-card">
          <div className="stat-card-header">
            <span className="stat-label">Omset Hari Ini</span>
            <div className="icon-badge icon-badge-emerald">
              <TrendingUp size={18} />
            </div>
          </div>
          <div className="stat-value text-emerald">{formatRupiah(totalIncome)}</div>
          <div className="stat-breakdown">
            <span className="breakdown-item" title="Uang Tunai di Tangan">
              <Coins size={12} /> Tunai: {formatRupiah(cashIncome)}
            </span>
            <span className="breakdown-item" title="Masuk Rekening via QRIS / Transfer">
              <CreditCard size={12} /> QRIS: {formatRupiah(qrisIncome)}
            </span>
          </div>
        </div>

        {/* Card 2: Total Pengeluaran */}
        <div className="stat-card expense-card">
          <div className="stat-card-header">
            <span className="stat-label">Pengeluaran & Belanja</span>
            <div className="icon-badge icon-badge-rose">
              <TrendingDown size={18} />
            </div>
          </div>
          <div className="stat-value text-rose">{formatRupiah(totalExpense)}</div>
          <div className="stat-breakdown">
            <span className="breakdown-desc">
              {todayTransactions.filter(t => t.type === 'out').length} transaksi belanja bahan & operasional
            </span>
          </div>
        </div>

        {/* Card 3: Uang Fisik Kas Laci (Fitur Andalan Kedai) */}
        <div className="stat-card drawer-card">
          <div className="stat-card-header">
            <span className="stat-label">Kas Fisik Laci (Uang Nyata)</span>
            <div className="icon-badge icon-badge-amber">
              <Wallet size={18} />
            </div>
          </div>
          <div className="stat-value text-amber">{formatRupiah(expectedCashInDrawer)}</div>
          <div className="stat-breakdown">
            <span className="breakdown-item">
              Modal Awal: {formatRupiah(startCash)}
            </span>
            <span className="breakdown-item">
              Tunai Bersih: +{formatRupiah(cashIncome - cashExpense)}
            </span>
          </div>
        </div>

        {/* Card 4: Estimasi Profit Bersih (Hanya Owner & Superadmin) */}
        {role !== 'cashier' && (
          <div className="stat-card profit-card">
            <div className="stat-card-header">
              <span className="stat-label">Estimasi Untung Bersih</span>
              <div className="icon-badge icon-badge-blue">
                <ArrowUpRight size={18} />
              </div>
            </div>
            <div className={`stat-value ${estimatedProfit >= 0 ? 'text-emerald' : 'text-rose'}`}>
              {formatRupiah(estimatedProfit)}
            </div>
            <div className="stat-breakdown">
              <span className="breakdown-desc">
                {totalIncome > 0 
                  ? `Margin Untung: ${Math.round((estimatedProfit / totalIncome) * 100)}%` 
                  : 'Belum ada data omset hari ini'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Omnichannel & Inventory Quick Alert Banner */}
      <div className="dashboard-smart-widgets-grid">
        {/* Widget 1: Online Food Settlement Tracker */}
        <div className="smart-widget-card widget-settlement">
          <div className="widget-icon-wrap bg-emerald-subtle">
            <Smartphone size={20} className="text-emerald" />
          </div>
          <div className="widget-content">
            <div className="widget-title-row">
              <strong>Saldo Online Food Belum Cair</strong>
              {pendingSettlementCount > 0 ? (
                <span className="badge badge-amber">{pendingSettlementCount} Pesanan</span>
              ) : (
                <span className="badge badge-emerald">Semua Cair</span>
              )}
            </div>
            <div className="widget-amount-row">
              <span className="widget-amount text-emerald">{formatRupiah(pendingSettlementTotal)}</span>
              <span className="widget-sub">GoFood • ShopeeFood • GrabFood</span>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-outline-emerald widget-btn"
            onClick={() => setIsSettlementModalOpen(true)}
          >
            <span>Cek & Cairkan</span>
          </button>
        </div>

        {/* Widget 2: Raw Material Inventory Alert */}
        <div className={`smart-widget-card widget-inventory ${lowStockCount > 0 ? 'border-amber' : ''}`}>
          <div className={`widget-icon-wrap ${lowStockCount > 0 ? 'bg-amber-subtle' : 'bg-blue-subtle'}`}>
            <Layers size={20} className={lowStockCount > 0 ? 'text-amber' : 'text-blue'} />
          </div>
          <div className="widget-content">
            <div className="widget-title-row">
              <strong>Stok Bahan Baku Kedai</strong>
              {lowStockCount > 0 ? (
                <span className="badge badge-danger">⚠️ {lowStockCount} Menipis</span>
              ) : (
                <span className="badge badge-emerald">🟢 Stok Aman</span>
              )}
            </div>
            <div className="widget-amount-row">
              <span className="widget-sub">
                {lowStockCount > 0 
                  ? 'Ada bahan baku mendekati batas habis! Segera belanja pasar.' 
                  : 'Seluruh stok bahan mentah mencukupi untuk operasional.'}
              </span>
            </div>
          </div>
          <button 
            type="button" 
            className="btn btn-sm btn-secondary widget-btn"
            onClick={() => setActiveTab('inventory')}
          >
            <span>Kelola Bahan</span>
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="quick-actions-bar">
        <button className="btn btn-primary btn-lg action-btn-main" onClick={() => setIsAddTxOpen(true)}>
          <Plus size={19} />
          <span>Catat Transaksi Cepat</span>
        </button>
        <button className="btn btn-secondary btn-lg action-btn-shift" onClick={() => setIsShiftModalOpen(true)}>
          <CircleDollarSign size={18} />
          <span>Tutup / Buka Shift</span>
        </button>
        {role !== 'cashier' && (
          <button className="btn btn-outline btn-lg action-btn-wa" onClick={() => setActiveTab('reports')}>
            <Share2 size={18} />
            <span>Kirim Rekap WA</span>
          </button>
        )}
      </div>

      {/* Visual Charts: 7-Day Trend & Payment Breakdown */}
      <div className={`dashboard-charts-grid ${role === 'cashier' ? 'single-chart' : ''}`}>
        {role !== 'cashier' && (
          <TrendChart7Days transactions={weekTransactions} />
        )}
        <PaymentMethodDonut 
          todayTransactions={todayTransactions} 
          weekTransactions={weekTransactions} 
        />
      </div>

      {/* Mini Visual Trend & Recent Transactions */}
      <div className="dashboard-sections-grid">
        {/* Section 1: Recent Transactions */}
        <div className="card recent-tx-card">
          <div className="card-header-flex">
            <div>
              <h3>Aktivitas Transaksi Hari Ini</h3>
              <p className="text-muted text-sm">Aliran uang masuk & belanja kedai</p>
            </div>
            <button 
              className="btn btn-outline btn-sm"
              onClick={() => setActiveTab('transactions')}
            >
              Lihat Semua
            </button>
          </div>

          {todayTransactions.length === 0 ? (
            <div className="empty-state">
              <p className="text-muted">Belum ada transaksi yang dicatat hari ini.</p>
              <button 
                className="btn btn-primary btn-sm mt-2" 
                onClick={() => setIsAddTxOpen(true)}
              >
                + Catat Transaksi Pertama
              </button>
            </div>
          ) : (
            <div className="tx-mini-list">
              {todayTransactions.slice(0, 5).map((tx) => (
                <div key={tx.id} className="tx-mini-item">
                  <div className={`tx-icon-wrap ${tx.type === 'in' ? 'tx-in' : 'tx-out'}`}>
                    {tx.type === 'in' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                  </div>
                  <div className="tx-mini-details">
                    <span className="tx-desc">{tx.description || tx.categoryName}</span>
                    <span className="tx-meta">
                      {tx.time} • {tx.channel && tx.channel !== 'offline' ? (
                        <span className={`channel-mini-pill bg-${tx.channel}`}>
                          {tx.channel === 'gofood' ? 'GoFood' : tx.channel === 'shopeefood' ? 'ShopeeFood' : 'GrabFood'}
                        </span>
                      ) : (
                        <span className="payment-tag">{tx.paymentMethod.toUpperCase()}</span>
                      )}
                      {tx.settlementStatus === 'pending' && (
                        <span className="badge-pending-mini">⏳ Belum Cair</span>
                      )} • {tx.createdByName}
                    </span>
                  </div>
                  <div className={`tx-amount ${tx.type === 'in' ? 'text-emerald' : 'text-rose'}`}>
                    {tx.type === 'in' ? '+' : '-'}{formatRupiah(tx.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: F&B Operational Checklist & Tips */}
        <div className="card operational-card">
          <div className="card-header-flex">
            <div>
              <h3>Checklist Operasional Kedai</h3>
              <p className="text-muted text-sm">Disiplin kas harian anti-bocor</p>
            </div>
          </div>

          <div className="checklist-items">
            <div className={`checklist-item ${activeShift ? 'checked' : ''}`}>
              <span className="check-icon">{activeShift ? '✓' : '○'}</span>
              <div>
                <strong>Buka Shift & Masukkan Modal Kasir</strong>
                <p className="text-muted text-sm">
                  {activeShift ? `Modal awal Rp ${activeShift.startCash.toLocaleString('id-ID')} tercatat` : 'Belum buka shift kasir'}
                </p>
              </div>
            </div>

            <div className={`checklist-item ${todayTransactions.some(t => t.type === 'out') ? 'checked' : ''}`}>
              <span className="check-icon">{todayTransactions.some(t => t.type === 'out') ? '✓' : '○'}</span>
              <div>
                <strong>Catat Belanja Bahan Baku Pagi</strong>
                <p className="text-muted text-sm">Catat semua pembelian telur, daging, bumbu & packaging pasar</p>
              </div>
            </div>

            <div className={`checklist-item ${todayTransactions.some(t => t.paymentMethod === 'qris') ? 'checked' : ''}`}>
              <span className="check-icon">{todayTransactions.some(t => t.paymentMethod === 'qris') ? '✓' : '○'}</span>
              <div>
                <strong>Cek Pembayaran QRIS / Rekening</strong>
                <p className="text-muted text-sm">Pastikan notifikasi uang masuk QRIS sinkron dengan kasir</p>
              </div>
            </div>

            <div className="checklist-item">
              <span className="check-icon">○</span>
              <div>
                <strong>Tutup Shift & Cocokkan Uang Fisik Laci</strong>
                <p className="text-muted text-sm">Hitung uang fisik di laci saat pergantian shift atau tutup kedai</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
