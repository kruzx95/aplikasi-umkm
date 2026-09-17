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
  PieChart,
  Printer,
  Loader2,
  FileCheck2,
  Sparkles,
  Database,
  ArrowRight,
  ShoppingBag,
  ArrowLeft
} from 'lucide-react';
import { generatePdfReport } from '../../utils/pdfGenerator';

export const ReportView: React.FC = () => {
  const { activeStore, activeTenant, setActiveTab, setIsBackupModalOpen, setIsSettlementModalOpen } = useApp();
  const [period, setPeriod] = useState<'today' | '7days' | 'month'>('today');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copied, setCopied] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

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

  // Multi-Channel Breakdown
  const channelStats = {
    offline: { label: 'Kasir Offline', count: 0, gross: 0, commission: 0, net: 0, color: '#10b981' },
    gofood: { label: 'GoFood', count: 0, gross: 0, commission: 0, net: 0, color: '#ef4444' },
    shopeefood: { label: 'ShopeeFood', count: 0, gross: 0, commission: 0, net: 0, color: '#f97316' },
    grabfood: { label: 'GrabFood', count: 0, gross: 0, commission: 0, net: 0, color: '#059669' },
  };

  let totalGrossIncome = 0;
  let totalCommissions = 0;
  let totalPendingSettlement = 0;
  let totalSettledOnline = 0;

  transactions.filter(t => t.type === 'in').forEach(t => {
    const ch = (t.channel || 'offline') as keyof typeof channelStats;
    const gross = t.grossAmount ?? t.amount;
    const comm = t.commissionAmount ?? 0;
    const net = t.netAmount ?? t.amount;

    if (channelStats[ch]) {
      channelStats[ch].count += 1;
      channelStats[ch].gross += gross;
      channelStats[ch].commission += comm;
      channelStats[ch].net += net;
    }

    totalGrossIncome += gross;
    totalCommissions += comm;

    if (ch !== 'offline') {
      if (t.settlementStatus === 'pending') {
        totalPendingSettlement += net;
      } else {
        totalSettledOnline += net;
      }
    }
  });

  const hasOnlineFoodOrders = channelStats.gofood.count > 0 || channelStats.shopeefood.count > 0 || channelStats.grabfood.count > 0;

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

    msg += `*💰 TOTAL PENDAPATAN BERSIH: ${formatRupiah(totalIncome)}*\n`;
    if (totalGrossIncome > totalIncome) {
      msg += `  • Omset Kotor (Gross): ${formatRupiah(totalGrossIncome)}\n`;
      msg += `  • Potongan Komisi Ojol: -${formatRupiah(totalCommissions)}\n`;
    }
    msg += `  • Pembayaran Tunai Kasir: ${formatRupiah(cashIncome)}\n`;
    msg += `  • Non-Tunai (QRIS/Transfer/Ojol): ${formatRupiah(qrisIncome)}\n\n`;

    if (hasOnlineFoodOrders) {
      msg += `*🛵 RINCIAN KANAL PENJUALAN:*\n`;
      if (channelStats.offline.count > 0) {
        msg += `  • Kasir Offline: ${formatRupiah(channelStats.offline.net)} (${channelStats.offline.count} transaksi)\n`;
      }
      if (channelStats.gofood.count > 0) {
        msg += `  • GoFood: Bersih ${formatRupiah(channelStats.gofood.net)} (Kotor: ${formatRupiah(channelStats.gofood.gross)}, Komisi: -${formatRupiah(channelStats.gofood.commission)} | ${channelStats.gofood.count} pesanan)\n`;
      }
      if (channelStats.shopeefood.count > 0) {
        msg += `  • ShopeeFood: Bersih ${formatRupiah(channelStats.shopeefood.net)} (Kotor: ${formatRupiah(channelStats.shopeefood.gross)}, Komisi: -${formatRupiah(channelStats.shopeefood.commission)} | ${channelStats.shopeefood.count} pesanan)\n`;
      }
      if (channelStats.grabfood.count > 0) {
        msg += `  • GrabFood: Bersih ${formatRupiah(channelStats.grabfood.net)} (Kotor: ${formatRupiah(channelStats.grabfood.gross)}, Komisi: -${formatRupiah(channelStats.grabfood.commission)} | ${channelStats.grabfood.count} pesanan)\n`;
      }
      if (totalPendingSettlement > 0) {
        msg += `  ⏳ Saldo Ojol Belum Dicairkan ke Rekening: *${formatRupiah(totalPendingSettlement)}*\n`;
      }
      msg += `\n`;
    }

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

  // Export PDF Handler
  const handleDownloadPdf = () => {
    if (transactions.length === 0) {
      alert('Tidak ada data transaksi pada periode ini untuk diekspor ke PDF.');
      return;
    }
    setIsGeneratingPdf(true);
    setTimeout(() => {
      try {
        generatePdfReport(
          activeStore,
          activeTenant,
          period,
          transactions,
          {
            totalIncome,
            cashIncome,
            qrisIncome,
            totalExpense,
            netProfit,
            profitMargin,
            totalGrossIncome,
            totalCommissions,
            channelStats,
            totalPendingSettlement
          }
        );
      } catch (err) {
        console.error('Failed to generate PDF:', err);
        alert('Terjadi kendala saat menyusun dokumen PDF. Silakan coba kembali.');
      } finally {
        setIsGeneratingPdf(false);
      }
    }, 150);
  };

  // Direct Browser Print
  const handlePrint = () => {
    window.print();
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

    const headers = [
      'ID', 
      'Tanggal', 
      'Waktu', 
      'Tipe', 
      'Kanal Penjualan', 
      'Nominal Bersih', 
      'Nominal Kotor', 
      'Potongan Komisi', 
      'Order ID Platform', 
      'Status Pencairan', 
      'Metode', 
      'Kategori', 
      'Deskripsi', 
      'Pencatat'
    ];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.time,
      t.type === 'in' ? 'Pemasukan' : 'Pengeluaran',
      t.channel ? t.channel.toUpperCase() : 'OFFLINE',
      t.amount,
      t.grossAmount ?? t.amount,
      t.commissionAmount ?? 0,
      `"${(t.externalOrderId || '-').replace(/"/g, '""')}"`,
      t.settlementStatus ? (t.settlementStatus === 'settled' ? 'Sudah Cair' : 'Belum Cair') : '-',
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
      {/* Header with Period & Action Buttons */}
      <div className="report-header-wrap">
        <div>
          <button 
            type="button" 
            className="mobile-back-crumb-btn" 
            onClick={() => setActiveTab('dashboard')}
          >
            <ArrowLeft size={15} />
            <span>Kembali ke Dashboard</span>
          </button>
          <h2>Laporan & Rekapitulasi</h2>
          <p className="text-muted text-sm">
            {activeStore?.name} ({activeStore?.branchName}) • Evaluasi performa keuangan kedai
          </p>
        </div>

        {/* Action Controls: Period Selector & PDF/Print Buttons */}
        <div className="report-actions-toolbar">
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

          {/* Quick Export Actions */}
          <div className="export-action-btns">
            <button 
              className="btn btn-primary btn-sm btn-export-pdf"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              title="Unduh dokumen PDF A4 lengkap"
            >
              {isGeneratingPdf ? <Loader2 size={15} className="spin-icon" /> : <FileText size={15} />}
              <span>{isGeneratingPdf ? 'Menyiapkan...' : 'Unduh PDF'}</span>
            </button>
            <button 
              className="btn btn-outline btn-sm"
              onClick={handlePrint}
              title="Cetak langsung lewat printer / browser"
            >
              <Printer size={15} />
              <span>Cetak</span>
            </button>
            <button 
              className="btn btn-outline btn-sm"
              onClick={handleExportCSV}
              title="Unduh file Excel / CSV"
            >
              <Download size={15} />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Share Banner */}
      <div className="card wa-share-card">
        <div className="wa-card-content">
          <div className="wa-icon-badge">
            <Share2 size={24} className="text-emerald" />
          </div>
          <div>
            <h3>Kirim Ringkasan ke WhatsApp Pemilik / Mitra</h3>
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

      {/* Multi-Channel Sales Breakdown (Offline vs GoFood vs ShopeeFood vs GrabFood) */}
      <div className="card channel-report-card">
        <div className="card-header-flex">
          <div>
            <h3>Kinerja Penjualan Multi-Kanal & Ojek Online</h3>
            <p className="text-muted text-sm">
              Pantau omset kotor, potongan komisi platform, dan uang bersih diterima per saluran
            </p>
          </div>
          {totalPendingSettlement > 0 && (
            <button 
              className="btn btn-outline btn-sm btn-settle-fast"
              onClick={() => setIsSettlementModalOpen(true)}
            >
              <span>Rekonsiliasi Saldo ({formatRupiah(totalPendingSettlement)})</span>
              <ArrowRight size={14} />
            </button>
          )}
        </div>

        {/* Channel Grid 4 columns / responsive */}
        <div className="channel-stats-grid">
          {/* Offline Kasir */}
          <div className="channel-stat-box">
            <div className="channel-stat-header">
              <span className="channel-badge offline">Kasir Offline Kedai</span>
              <span className="channel-count">{channelStats.offline.count} nota</span>
            </div>
            <div className="channel-stat-amt text-emerald">{formatRupiah(channelStats.offline.net)}</div>
            <div className="channel-stat-sub">
              <span>Komisi: 0% (Rp 0)</span>
              <span>Kotor = Bersih</span>
            </div>
          </div>

          {/* GoFood */}
          <div className="channel-stat-box">
            <div className="channel-stat-header">
              <span className="channel-badge gofood">GoFood</span>
              <span className="channel-count">{channelStats.gofood.count} order</span>
            </div>
            <div className="channel-stat-amt text-emerald">{formatRupiah(channelStats.gofood.net)}</div>
            <div className="channel-stat-sub">
              <span>Kotor: {formatRupiah(channelStats.gofood.gross)}</span>
              <span className="text-rose">Komisi: -{formatRupiah(channelStats.gofood.commission)}</span>
            </div>
          </div>

          {/* ShopeeFood */}
          <div className="channel-stat-box">
            <div className="channel-stat-header">
              <span className="channel-badge shopeefood">ShopeeFood</span>
              <span className="channel-count">{channelStats.shopeefood.count} order</span>
            </div>
            <div className="channel-stat-amt text-emerald">{formatRupiah(channelStats.shopeefood.net)}</div>
            <div className="channel-stat-sub">
              <span>Kotor: {formatRupiah(channelStats.shopeefood.gross)}</span>
              <span className="text-rose">Komisi: -{formatRupiah(channelStats.shopeefood.commission)}</span>
            </div>
          </div>

          {/* GrabFood */}
          <div className="channel-stat-box">
            <div className="channel-stat-header">
              <span className="channel-badge grabfood">GrabFood</span>
              <span className="channel-count">{channelStats.grabfood.count} order</span>
            </div>
            <div className="channel-stat-amt text-emerald">{formatRupiah(channelStats.grabfood.net)}</div>
            <div className="channel-stat-sub">
              <span>Kotor: {formatRupiah(channelStats.grabfood.gross)}</span>
              <span className="text-rose">Komisi: -{formatRupiah(channelStats.grabfood.commission)}</span>
            </div>
          </div>
        </div>

        {/* Aggregate Summary Footer inside Card */}
        {totalCommissions > 0 && (
          <div className="channel-aggregate-summary">
            <div className="summary-pill">
              <span className="text-muted text-xs">Total Omset Kotor:</span>
              <strong>{formatRupiah(totalGrossIncome)}</strong>
            </div>
            <div className="summary-pill highlight-rose">
              <span className="text-rose text-xs">Total Komisi Platform:</span>
              <strong className="text-rose">-{formatRupiah(totalCommissions)}</strong>
            </div>
            <div className="summary-pill highlight-emerald">
              <span className="text-emerald text-xs">Pendapatan Bersih Masuk:</span>
              <strong className="text-emerald">{formatRupiah(totalIncome)}</strong>
            </div>
            {totalPendingSettlement > 0 && (
              <div className="summary-pill highlight-amber">
                <span className="text-amber text-xs">Saldo Ojol Belum Cair:</span>
                <strong className="text-amber">{formatRupiah(totalPendingSettlement)}</strong>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Category Expenses Breakdown & PDF Feature Card */}
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

        {/* Dedicated PDF Document Card */}
        <div className="card pdf-feature-card">
          <div className="card-header-flex">
            <div className="pdf-header-title">
              <div className="icon-badge icon-badge-emerald">
                <FileCheck2 size={18} />
              </div>
              <div>
                <h3>Dokumen PDF Resmi Kedai</h3>
                <p className="text-muted text-sm">Standar A4 siap cetak & arsip pembukuan</p>
              </div>
            </div>
            <span className="badge badge-emerald">
              <Sparkles size={11} /> Format A4
            </span>
          </div>

          <div className="pdf-features-list">
            <div className="pdf-feature-item">
              <span className="pdf-check">✓</span>
              <span>Kop toko lengkap dengan nama cabang, alamat & kontak</span>
            </div>
            <div className="pdf-feature-item">
              <span className="pdf-check">✓</span>
              <span>3 Kartu ringkasan omset, belanja & laba bersih</span>
            </div>
            <div className="pdf-feature-item">
              <span className="pdf-check">✓</span>
              <span>Tabel rekapitulasi pos biaya & persentase</span>
            </div>
            <div className="pdf-feature-item">
              <span className="pdf-check">✓</span>
              <span>Daftar seluruh transaksi {transactions.length} baris dengan penomoran halaman</span>
            </div>
            <div className="pdf-feature-item">
              <span className="pdf-check">✓</span>
              <span>Kolom tanda tangan resmi Kasir & Pemilik Kedai</span>
            </div>
          </div>

          <div className="pdf-card-actions">
            <button 
              className="btn btn-primary btn-lg btn-download-pdf-large"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? <Loader2 size={18} className="spin-icon" /> : <FileText size={18} />}
              <span>{isGeneratingPdf ? 'Menyusun Dokumen PDF...' : 'Unduh Dokumen PDF Resmi'}</span>
            </button>
            <button 
              className="btn btn-outline btn-lg"
              onClick={handlePrint}
              title="Cetak langsung ke printer kasir / A4"
            >
              <Printer size={18} />
              <span>Cetak Dokumen</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Row: WhatsApp Text Preview & Excel CSV */}
      <div className="card">
        <div className="card-header-flex">
          <div>
            <h3>Format Teks Pesan WhatsApp</h3>
            <p className="text-muted text-sm">Pratinjau pesan teks siap kirim ke grup atau chat pribadi</p>
          </div>
          <div className="card-header-actions">
            <button className="btn btn-outline btn-sm" onClick={() => setIsBackupModalOpen(true)}>
              <Database size={14} />
              <span>Cadangan JSON</span>
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleCopyWhatsApp}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              <span>{copied ? 'Tersalin' : 'Salin Pesan'}</span>
            </button>
            <button className="btn btn-outline btn-sm" onClick={handleExportCSV}>
              <Download size={14} />
              <span>Unduh CSV</span>
            </button>
          </div>
        </div>

        <pre className="wa-preview-box">
          {generateWhatsAppMessage()}
        </pre>
      </div>
    </div>
  );
};
