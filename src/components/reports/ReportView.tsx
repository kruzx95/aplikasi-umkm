import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { Transaction } from '../../types';
import { 
  FileText, 
  Share2, 
  Download, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Check, 
  Copy,
  CreditCard,
  Coins,
  PieChart
} from 'lucide-react';

export const ReportView: React.FC = () => {
  const { activeStore, activeTenant } = useApp();
  const [period, setPeriod] = useState<'today' | '7days' | 'month'>('today');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copied, setCopied] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    const loadReportData = async () => {
      if (!activeStore) return;
      const allTxs = await db.transactions
        .where('storeId')
        .equals(activeStore.id)
        .toArray();

      let filtered = allTxs;
      if (period === 'today') {
        filtered = allTxs.filter(t => t.date === todayStr);
      } else if (period === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const cutoff = sevenDaysAgo.toISOString().split('T')[0];
        filtered = allTxs.filter(t => t.date >= cutoff);
      } else if (period === 'month') {
        const currentMonth = todayStr.substring(0, 7);
        filtered = allTxs.filter(t => t.date.startsWith(currentMonth));
      }

      setTransactions(filtered);
    };

    loadReportData();
  }, [activeStore, period, todayStr]);

  const totalIncome = transactions
    .filter(t => t.type === 'in')
    .reduce((sum, t) => sum + t.amount, 0);

  const cashIncome = transactions
    .filter(t => t.type === 'in' && t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const qrisIncome = transactions
    .filter(t => t.type === 'in' && t.paymentMethod !== 'cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter(t => t.type === 'out')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpense;
  const profitMargin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;

  // Breakdown by Category
  const expenseByCategory = transactions
    .filter(t => t.type === 'out')
    .reduce((acc, t) => {
      acc[t.categoryName] = (acc[t.categoryName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const sortedCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

  // WhatsApp Message Generator
  const generateWhatsAppMessage = () => {
    const periodLabel = period === 'today' ? 'Harian' : period === '7days' ? '7 Hari Terakhir' : 'Bulan Ini';
    const dateFormatted = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    let msg = `*📊 LAPORAN KEUANGAN KASKEDAI (${periodLabel.toUpperCase()})*\n`;
    msg += `🏪 *${activeStore?.name} - ${activeStore?.branchName}*\n`;
    msg += `📅 Tanggal: ${dateFormatted}\n\n`;

    msg += `*💰 TOTAL OMSET / PEMASUKAN: ${formatRupiah(totalIncome)}*\n`;
    msg += `  • Tunai Kasir: ${formatRupiah(cashIncome)}\n`;
    msg += `  • QRIS / Transfer: ${formatRupiah(qrisIncome)}\n\n`;

    msg += `*🛒 TOTAL BELANJA & BEBAN: ${formatRupiah(totalExpense)}*\n`;
    if (sortedCategories.length > 0) {
      sortedCategories.forEach(([cat, amt]) => {
        msg += `  • ${cat}: ${formatRupiah(amt)}\n`;
      });
    } else {
      msg += `  • Belum ada pengeluaran\n`;
    }
    msg += `\n`;

    msg += `*📈 ESTIMASI LABA BERSIH: ${formatRupiah(netProfit)}*\n`;
    msg += `🎯 Margin Keuntungan: ${profitMargin}%\n\n`;
    msg += `_Dicatat otomatis via KasKedai PWA (Local-First Multi-Tenant)_`;

    return msg;
  };

  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppMessage();
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  // Export CSV
  const handleExportCSV = () => {
    if (transactions.length === 0) {
      alert('Tidak ada data transaksi untuk diekspor.');
      return;
    }

    const headers = ['ID', 'Tanggal', 'Waktu', 'Tipe', 'Nominal', 'Metode', 'Kategori', 'Deskripsi', 'Pencatat'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.time,
      t.type === 'in' ? 'Pemasukan' : 'Pengeluaran',
      t.amount,
      t.paymentMethod.toUpperCase(),
      `"${t.categoryName}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      `"${t.createdByName}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan_kaskedai_${activeStore?.branchName.replace(/\s+/g, '_')}_${todayStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="report-page-container">
      {/* Header */}
      <div className="page-header-flex">
        <div>
          <h2>Laporan & Rekapitulasi</h2>
          <p className="text-muted text-sm">
            {activeStore?.name} ({activeStore?.branchName}) • Evaluasi performa keuangan kedai
          </p>
        </div>

        {/* Period Selector */}
        <div className="btn-group">
          <button
            className={`filter-btn ${period === 'today' ? 'active' : ''}`}
            onClick={() => setPeriod('today')}
          >
            Hari Ini
          </button>
          <button
            className={`filter-btn ${period === '7days' ? 'active' : ''}`}
            onClick={() => setPeriod('7days')}
          >
            7 Hari
          </button>
          <button
            className={`filter-btn ${period === 'month' ? 'active' : ''}`}
            onClick={() => setPeriod('month')}
          >
            Bulan Ini
          </button>
        </div>
      </div>

      {/* WhatsApp Share Banner (Highlight Feature) */}
      <div className="card wa-share-card">
        <div className="wa-card-content">
          <div className="wa-icon-badge">
            <Share2 size={24} className="text-emerald" />
          </div>
          <div>
            <h3>Kirim Laporan ke WhatsApp Pemilik / Mitra</h3>
            <p className="text-muted text-sm">
              Salin ringkasan omset, belanja, dan laba bersih ke pesan WhatsApp yang rapi dalam 1 klik.
            </p>
          </div>
        </div>

        <button 
          className={`btn ${copied ? 'btn-primary' : 'btn-primary'} btn-wa`}
          onClick={handleCopyWhatsApp}
        >
          {copied ? <Check size={18} /> : <Copy size={18} />}
          <span>{copied ? 'Tersalin ke Clipboard!' : 'Salin Format WhatsApp'}</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="report-stats-grid">
        <div className="card">
          <span className="stat-label">Total Pemasukan</span>
          <div className="stat-value text-emerald">{formatRupiah(totalIncome)}</div>
          <div className="stat-breakdown">
            <span><Coins size={12} /> Tunai: {formatRupiah(cashIncome)}</span>
            <span><CreditCard size={12} /> QRIS: {formatRupiah(qrisIncome)}</span>
          </div>
        </div>

        <div className="card">
          <span className="stat-label">Total Belanja & Biaya</span>
          <div className="stat-value text-rose">{formatRupiah(totalExpense)}</div>
          <div className="stat-breakdown">
            <span>{transactions.filter(t => t.type === 'out').length} kali transaksi belanja</span>
          </div>
        </div>

        <div className="card">
          <span className="stat-label">Estimasi Keuntungan Bersih</span>
          <div className={`stat-value ${netProfit >= 0 ? 'text-emerald' : 'text-rose'}`}>
            {formatRupiah(netProfit)}
          </div>
          <div className="stat-breakdown">
            <span>Margin Keuntungan: {profitMargin}%</span>
          </div>
        </div>
      </div>

      {/* Category Expenses Breakdown & Export Options */}
      <div className="report-detail-grid">
        {/* Category Breakdown */}
        <div className="card">
          <div className="card-header-flex">
            <h3>Rincian Pengeluaran Kedai</h3>
            <span className="badge badge-amber"><PieChart size={12} /> Analisis Biaya</span>
          </div>

          {sortedCategories.length === 0 ? (
            <div className="empty-state">
              <p className="text-muted">Tidak ada pengeluaran pada periode ini.</p>
            </div>
          ) : (
            <div className="cat-breakdown-list">
              {sortedCategories.map(([catName, amt]) => {
                const percent = totalExpense > 0 ? Math.round((amt / totalExpense) * 100) : 0;
                return (
                  <div key={catName} className="cat-breakdown-item">
                    <div className="cat-item-top">
                      <strong>{catName}</strong>
                      <span className="text-rose font-bold">{formatRupiah(amt)} ({percent}%)</span>
                    </div>
                    <div className="progress-bar-bg">
                      <div className="progress-bar-fill" style={{ width: `${percent}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Preview WA Format & Export Options */}
        <div className="card">
          <div className="card-header-flex">
            <h3>Format Teks Pesan WhatsApp</h3>
            <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
              <Download size={14} />
              <span>Unduh Excel (CSV)</span>
            </button>
          </div>

          <pre className="wa-preview-box">
            {generateWhatsAppMessage()}
          </pre>
        </div>
      </div>
    </div>
  );
};
