import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { logActivity } from '../../db/logger';
import { Transaction, SalesChannel, SettlementRecord } from '../../types';
import { 
  X, 
  Smartphone, 
  CheckCircle2, 
  Building2, 
  FileSpreadsheet, 
  History, 
  Upload, 
  Check, 
  ShieldCheck 
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const SettlementModal: React.FC = () => {
  const { 
    isSettlementModalOpen, 
    setIsSettlementModalOpen, 
    activeStore, 
    activeTenant, 
    role, 
    currentActorName,
    refreshAllData 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'pending' | 'import' | 'history'>('pending');
  const [pendingTxs, setPendingTxs] = useState<Transaction[]>([]);
  const [selectedTxIds, setSelectedTxIds] = useState<string[]>([]);
  const [channelFilter, setChannelFilter] = useState<'all' | 'gofood' | 'shopeefood' | 'grabfood'>('all');
  const [settlementRecords, setSettlementRecords] = useState<SettlementRecord[]>([]);

  // Payout Dialog States
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [targetBank, setTargetBank] = useState('BCA');
  const [bankRef, setBankRef] = useState('');
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  // CSV Import States
  const [csvRawText, setCsvRawText] = useState('');
  const [importChannel, setImportChannel] = useState<SalesChannel>('gofood');
  const [parsedRows, setParsedRows] = useState<Array<{
    orderId: string;
    gross: number;
    commissionRate: number;
    commissionAmount: number;
    net: number;
    date: string;
    time: string;
    desc: string;
  }>>([]);
  const [isImporting, setIsImporting] = useState(false);

  const loadData = async () => {
    if (!activeStore) return;

    // Load Pending Online Transactions
    const txs = await db.transactions
      .where('storeId')
      .equals(activeStore.id)
      .filter(t => t.type === 'in' && !!t.channel && t.channel !== 'offline' && t.settlementStatus === 'pending')
      .reverse()
      .sortBy('createdAt');
    setPendingTxs(txs);

    // Auto select all by default
    setSelectedTxIds(txs.map(t => t.id));

    // Load Settlement History
    const histories = await db.settlements
      .where('storeId')
      .equals(activeStore.id)
      .reverse()
      .sortBy('createdAt');
    setSettlementRecords(histories);
  };

  useEffect(() => {
    if (isSettlementModalOpen) {
      loadData();
    }
  }, [isSettlementModalOpen, activeStore]);

  if (!isSettlementModalOpen) return null;

  // Filter pending items
  const filteredTxs = pendingTxs.filter(t => {
    if (channelFilter === 'all') return true;
    return t.channel === channelFilter;
  });

  // Calculate stats
  const gofoodTotal = pendingTxs.filter(t => t.channel === 'gofood').reduce((sum, t) => sum + (t.netAmount || t.amount), 0);
  const shopeefoodTotal = pendingTxs.filter(t => t.channel === 'shopeefood').reduce((sum, t) => sum + (t.netAmount || t.amount), 0);
  const grabfoodTotal = pendingTxs.filter(t => t.channel === 'grabfood').reduce((sum, t) => sum + (t.netAmount || t.amount), 0);
  const grandTotalPending = gofoodTotal + shopeefoodTotal + grabfoodTotal;

  const selectedTxs = pendingTxs.filter(t => selectedTxIds.includes(t.id));
  const selectedTotal = selectedTxs.reduce((sum, t) => sum + (t.netAmount || t.amount), 0);

  const handleToggleSelect = (id: string) => {
    setSelectedTxIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllToggle = () => {
    if (selectedTxIds.length === filteredTxs.length) {
      setSelectedTxIds([]);
    } else {
      setSelectedTxIds(filteredTxs.map(t => t.id));
    }
  };

  const handleConfirmDisbursement = async () => {
    if (selectedTxs.length === 0 || !activeStore || !activeTenant) return;

    setIsProcessingPayout(true);
    try {
      const now = new Date();
      const settlementId = 'stl_' + Date.now();

      // Update all selected transactions to settled
      for (const tx of selectedTxs) {
        await db.transactions.update(tx.id, {
          settlementStatus: 'settled',
          settledAt: now.toISOString(),
          settlementBank: targetBank,
        });
      }

      // Record settlement record
      const primaryChannel = selectedTxs[0].channel || 'gofood';
      await db.settlements.add({
        id: settlementId,
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        channel: primaryChannel,
        totalAmount: selectedTotal,
        transactionCount: selectedTxs.length,
        bankName: targetBank,
        bankAccountRef: bankRef.trim() || undefined,
        settledAt: now.toISOString(),
        notes: `Pencairan ${selectedTxs.length} pesanan ke Rekening ${targetBank}`,
        createdAt: now.toISOString(),
      });

      // Audit Log
      await logActivity({
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        storeName: `${activeStore.name} - ${activeStore.branchName}`,
        actorRole: role,
        actorName: currentActorName,
        actionType: 'SETTLEMENT_PROCESSED',
        description: `Mencairkan dana online food Rp ${selectedTotal.toLocaleString('id-ID')} (${selectedTxs.length} pesanan) ke rekening ${targetBank}`,
        metadata: {
          settlementId,
          totalAmount: selectedTotal,
          txCount: selectedTxs.length,
          bankName: targetBank,
        }
      });

      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#10b981', '#3b82f6', '#f59e0b'],
      });

      setShowPayoutDialog(false);
      await refreshAllData();
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Gagal memproses pencairan dana.');
    } finally {
      setIsProcessingPayout(false);
    }
  };

  // CSV Parsing Logic
  const handleParseCsv = (text: string) => {
    setCsvRawText(text);
    if (!text.trim()) {
      setParsedRows([]);
      return;
    }

    const lines = text.trim().split('\n');
    const results: Array<{
      orderId: string;
      gross: number;
      commissionRate: number;
      commissionAmount: number;
      net: number;
      date: string;
      time: string;
      desc: string;
    }> = [];

    const todayStr = new Date().toISOString().split('T')[0];

    lines.forEach((line, index) => {
      const cols = line.split(/[,;\t]/).map(c => c.trim().replace(/^["']|["']$/g, ''));
      if (cols.length >= 2) {
        const firstCol = cols[0].toLowerCase();
        if (firstCol.includes('order') || firstCol.includes('id') || firstCol.includes('tanggal') || firstCol.includes('no')) {
          return;
        }

        let orderId = cols[0] || `ORD-${Date.now()}-${index}`;
        let rawGross = 0;
        let commRate = 20;

        for (let i = 1; i < cols.length; i++) {
          const cleanNum = cols[i].replace(/[^0-9]/g, '');
          const val = parseInt(cleanNum, 10);
          if (val > 1000) {
            rawGross = val;
            break;
          }
        }

        if (rawGross > 0) {
          const commAmount = Math.round((rawGross * commRate) / 100);
          const net = rawGross - commAmount;
          results.push({
            orderId,
            gross: rawGross,
            commissionRate: commRate,
            commissionAmount: commAmount,
            net,
            date: todayStr,
            time: '18:00',
            desc: `Pesanan ${importChannel.toUpperCase()} [${orderId}]`,
          });
        }
      }
    });

    setParsedRows(results);
  };

  const handleImportParsedRows = async () => {
    if (parsedRows.length === 0 || !activeStore || !activeTenant) return;

    setIsImporting(true);
    try {
      const txsToInsert: Transaction[] = parsedRows.map((r, idx) => ({
        id: `tx_imp_${Date.now()}_${idx}`,
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        type: 'in',
        amount: r.net,
        paymentMethod: 'transfer',
        categoryId: 'cat_in_sales',
        categoryName: 'Penjualan Menu Makanan & Minuman',
        description: r.desc,
        date: r.date,
        time: r.time,
        createdByRole: role,
        createdByName: currentActorName,
        createdAt: new Date(Date.now() - idx * 60000).toISOString(),
        channel: importChannel,
        grossAmount: r.gross,
        commissionRate: r.commissionRate,
        commissionAmount: r.commissionAmount,
        netAmount: r.net,
        settlementStatus: 'pending',
        externalOrderId: r.orderId,
      }));

      await db.transactions.bulkAdd(txsToInsert);

      await logActivity({
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        storeName: `${activeStore.name} - ${activeStore.branchName}`,
        actorRole: role,
        actorName: currentActorName,
        actionType: 'ONLINE_FOOD_ADD',
        description: `Import ${txsToInsert.length} pesanan ${importChannel.toUpperCase()} dari file laporan rekap`,
      });

      alert(`Berhasil mengimpor ${txsToInsert.length} transaksi ${importChannel.toUpperCase()}!`);
      setCsvRawText('');
      setParsedRows([]);
      setActiveTab('pending');
      await refreshAllData();
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Gagal mengimpor data transaksi.');
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={() => setIsSettlementModalOpen(false)}>
      <div className="modal-content modal-settlement-content" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <div className="title-with-badge">
              <h3>Pencairan Saldo & Rekonsiliasi Online Food</h3>
              <span className="badge badge-emerald">GoFood • ShopeeFood • GrabFood</span>
            </div>
            <span className="text-muted text-xs">
              {activeStore?.name} • {activeStore?.branchName}
            </span>
          </div>
          <button className="icon-btn" onClick={() => setIsSettlementModalOpen(false)} aria-label="Tutup">
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="modal-tabs-track">
          <button
            className={`modal-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Smartphone size={16} />
            <span>Antrean Saldo Belum Cair</span>
            {pendingTxs.length > 0 && (
              <span className="tab-pill-badge">{pendingTxs.length}</span>
            )}
          </button>

          <button
            className={`modal-tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            <FileSpreadsheet size={16} />
            <span>Import Laporan GoBiz / Shopee</span>
          </button>

          <button
            className={`modal-tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <History size={16} />
            <span>Riwayat Pencairan Bank</span>
            {settlementRecords.length > 0 && (
              <span className="tab-pill-badge-gray">{settlementRecords.length}</span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body settlement-modal-body">
          {activeTab === 'pending' && (
            <>
              {/* 1. Summary Cards per Food App */}
              <div className="settlement-cards-grid">
                <div className="settle-card card-gofood">
                  <div className="settle-card-header">
                    <span className="channel-pill bg-gofood">GoFood</span>
                    <span className="order-count-text">
                      {pendingTxs.filter(t => t.channel === 'gofood').length} pesanan
                    </span>
                  </div>
                  <strong className="settle-amount">Rp {gofoodTotal.toLocaleString('id-ID')}</strong>
                  <span className="settle-label">Saldo Mengendap</span>
                </div>

                <div className="settle-card card-shopeefood">
                  <div className="settle-card-header">
                    <span className="channel-pill bg-shopeefood">ShopeeFood</span>
                    <span className="order-count-text">
                      {pendingTxs.filter(t => t.channel === 'shopeefood').length} pesanan
                    </span>
                  </div>
                  <strong className="settle-amount">Rp {shopeefoodTotal.toLocaleString('id-ID')}</strong>
                  <span className="settle-label">Saldo Mengendap</span>
                </div>

                <div className="settle-card card-grabfood">
                  <div className="settle-card-header">
                    <span className="channel-pill bg-grabfood">GrabFood</span>
                    <span className="order-count-text">
                      {pendingTxs.filter(t => t.channel === 'grabfood').length} pesanan
                    </span>
                  </div>
                  <strong className="settle-amount">Rp {grabfoodTotal.toLocaleString('id-ID')}</strong>
                  <span className="settle-label">Saldo Mengendap</span>
                </div>

                <div className="settle-card card-grand-total">
                  <div className="settle-card-header">
                    <span className="channel-pill bg-emerald">Total Belum Cair</span>
                    <span className="order-count-text text-emerald-light">
                      {pendingTxs.length} pesanan
                    </span>
                  </div>
                  <strong className="settle-amount text-emerald-light">
                    Rp {grandTotalPending.toLocaleString('id-ID')}
                  </strong>
                  <span className="settle-label">Menunggu Masuk Rekening</span>
                </div>
              </div>

              {/* 2. Filter Bar & Action Button */}
              <div className="settle-toolbar-row">
                <div className="settle-filter-chips">
                  <button
                    type="button"
                    className={`filter-chip ${channelFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setChannelFilter('all')}
                  >
                    Semua ({pendingTxs.length})
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${channelFilter === 'gofood' ? 'active' : ''}`}
                    onClick={() => setChannelFilter('gofood')}
                  >
                    GoFood ({pendingTxs.filter(t => t.channel === 'gofood').length})
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${channelFilter === 'shopeefood' ? 'active' : ''}`}
                    onClick={() => setChannelFilter('shopeefood')}
                  >
                    ShopeeFood ({pendingTxs.filter(t => t.channel === 'shopeefood').length})
                  </button>
                  <button
                    type="button"
                    className={`filter-chip ${channelFilter === 'grabfood' ? 'active' : ''}`}
                    onClick={() => setChannelFilter('grabfood')}
                  >
                    GrabFood ({pendingTxs.filter(t => t.channel === 'grabfood').length})
                  </button>
                </div>

                <div className="settle-actions-right">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleSelectAllToggle}
                  >
                    {selectedTxIds.length === filteredTxs.length ? 'Batal Pilih Semua' : 'Pilih Semua'}
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary btn-sm"
                    disabled={selectedTxIds.length === 0}
                    onClick={() => setShowPayoutDialog(true)}
                  >
                    <Building2 size={16} />
                    <span>Cairkan Rp {selectedTotal.toLocaleString('id-ID')} ({selectedTxIds.length})</span>
                  </button>
                </div>
              </div>

              {/* 3. Orders List */}
              <div className="settle-orders-container">
                {filteredTxs.length === 0 ? (
                  <div className="empty-settle-state">
                    <CheckCircle2 size={40} className="text-emerald" />
                    <h4>Semua Saldo Online Food Sudah Dicairkan!</h4>
                    <p className="text-muted text-xs">
                      Tidak ada pesanan GoFood, ShopeeFood, atau GrabFood yang menumpuk di status pending.
                    </p>
                  </div>
                ) : (
                  <div className="settle-orders-list">
                    {filteredTxs.map(tx => {
                      const isSelected = selectedTxIds.includes(tx.id);
                      const isGf = tx.channel === 'gofood';
                      const isSpf = tx.channel === 'shopeefood';

                      return (
                        <div
                          key={tx.id}
                          className={`settle-order-row ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleToggleSelect(tx.id)}
                        >
                          <div className="order-row-check">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                            />
                          </div>

                          <div className="order-row-channel">
                            <span className={`channel-badge ${isGf ? 'bg-gofood' : isSpf ? 'bg-shopeefood' : 'bg-grabfood'}`}>
                              {isGf ? 'GoFood' : isSpf ? 'ShopeeFood' : 'GrabFood'}
                            </span>
                            <strong className="order-id-code">
                              {tx.externalOrderId || tx.id.substring(0, 10)}
                            </strong>
                            <span className="order-time-text">
                              {tx.time} • {tx.date}
                            </span>
                          </div>

                          <div className="order-row-desc">
                            <span className="order-menu-desc">{tx.description}</span>
                            <span className="order-cashier-desc">Kasir: {tx.createdByName}</span>
                          </div>

                          <div className="order-row-amounts">
                            <div className="amount-col">
                              <span className="col-label">Kotor</span>
                              <span className="col-val text-muted">
                                Rp {(tx.grossAmount || tx.amount).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="amount-col">
                              <span className="col-label">Komisi ({tx.commissionRate || 20}%)</span>
                              <span className="col-val text-danger">
                                -Rp {(tx.commissionAmount || 0).toLocaleString('id-ID')}
                              </span>
                            </div>
                            <div className="amount-col">
                              <span className="col-label">Bersih Cair</span>
                              <strong className="col-val text-emerald">
                                Rp {(tx.netAmount || tx.amount).toLocaleString('id-ID')}
                              </strong>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'import' && (
            <div className="import-tab-content">
              <div className="import-hero-card">
                <div className="hero-icon-wrap">
                  <FileSpreadsheet size={28} className="text-emerald" />
                </div>
                <div>
                  <h4 style={{ margin: 0 }}>Import Laporan Rekap Transaksi Online Food</h4>
                  <p className="text-xs text-muted" style={{ margin: '0.25rem 0 0 0' }}>
                    Salin teks atau unggah file CSV rincian transaksi dari aplikasi GoBiz / Shopee Partner. Sistem akan otomatis membagi nominal kotor, komisi 20%, dan nominal bersih.
                  </p>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Pilih Platform Laporan</label>
                <div className="channel-selector-grid">
                  <button
                    type="button"
                    className={`channel-card ${importChannel === 'gofood' ? 'active gofood' : ''}`}
                    onClick={() => setImportChannel('gofood')}
                  >
                    <div className="channel-icon-wrap bg-gofood">
                      <Smartphone size={18} />
                    </div>
                    <div className="channel-info">
                      <strong>GoFood (GoBiz)</strong>
                      <span>Default komisi 20%</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`channel-card ${importChannel === 'shopeefood' ? 'active shopeefood' : ''}`}
                    onClick={() => setImportChannel('shopeefood')}
                  >
                    <div className="channel-icon-wrap bg-shopeefood">
                      <Smartphone size={18} />
                    </div>
                    <div className="channel-info">
                      <strong>Shopee Partner</strong>
                      <span>Default komisi 20%</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`channel-card ${importChannel === 'grabfood' ? 'active grabfood' : ''}`}
                    onClick={() => setImportChannel('grabfood')}
                  >
                    <div className="channel-icon-wrap bg-grabfood">
                      <Smartphone size={18} />
                    </div>
                    <div className="channel-info">
                      <strong>GrabFood (GrabMerchant)</strong>
                      <span>Default komisi 20%</span>
                    </div>
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Tempel (Paste) Baris CSV / Teks Laporan
                </label>
                <textarea
                  className="form-input form-textarea"
                  rows={5}
                  placeholder={`Contoh baris teks (Order ID, Nominal Kotor):\nF-3358527824, 65500\nF-3358535744, 165000\nF-3358506298, 90500\nF-3358503251, 50500`}
                  value={csvRawText}
                  onChange={(e) => handleParseCsv(e.target.value)}
                />
              </div>

              {parsedRows.length > 0 && (
                <div className="parsed-preview-box">
                  <div className="preview-header">
                    <strong>Pratinjau Hasil Parsing ({parsedRows.length} Pesanan Terdeteksi):</strong>
                    <span className="text-emerald text-xs font-bold">
                      Total Bersih: Rp {parsedRows.reduce((s, r) => s + r.net, 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="preview-table-wrap">
                    <table className="mini-preview-table">
                      <thead>
                        <tr>
                          <th>No. Pesanan</th>
                          <th>Kotor (Gross)</th>
                          <th>Komisi (20%)</th>
                          <th>Bersih (Net)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.map((r, i) => (
                          <tr key={i}>
                            <td><code>{r.orderId}</code></td>
                            <td>Rp {r.gross.toLocaleString('id-ID')}</td>
                            <td className="text-danger">-Rp {r.commissionAmount.toLocaleString('id-ID')}</td>
                            <td className="text-emerald font-bold">Rp {r.net.toLocaleString('id-ID')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <button
                    type="button"
                    className="btn btn-primary w-full"
                    style={{ marginTop: '0.75rem' }}
                    onClick={handleImportParsedRows}
                    disabled={isImporting}
                  >
                    <Upload size={16} />
                    <span>Impor {parsedRows.length} Pesanan ke Antrean KasKedai</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="history-tab-content">
              {settlementRecords.length === 0 ? (
                <div className="empty-settle-state">
                  <History size={36} className="text-muted" />
                  <h4>Belum Ada Riwayat Pencairan</h4>
                  <p className="text-muted text-xs">
                    Catatan transfer pencairan dana ke rekening bank toko akan muncul di sini setiap kali Anda menandai saldo cair.
                  </p>
                </div>
              ) : (
                <div className="settle-history-list">
                  {settlementRecords.map(rec => (
                    <div key={rec.id} className="history-item-card">
                      <div className="history-icon-wrap">
                        <Building2 size={20} className="text-emerald" />
                      </div>
                      <div className="history-info">
                        <div className="history-title-row">
                          <strong>Pencairan ke Bank {rec.bankName}</strong>
                          <span className="history-amount text-emerald font-bold">
                            Rp {rec.totalAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                        <p className="text-xs text-muted" style={{ margin: '0.2rem 0' }}>
                          {rec.transactionCount} Pesanan • {new Date(rec.settledAt).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                        {rec.notes && (
                          <span className="history-notes-pill">{rec.notes}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setIsSettlementModalOpen(false)}
          >
            Tutup
          </button>
          {activeTab === 'pending' && filteredTxs.length > 0 && (
            <button
              type="button"
              className="btn btn-primary"
              disabled={selectedTxIds.length === 0}
              onClick={() => setShowPayoutDialog(true)}
            >
              <Building2 size={16} />
              <span>Cairkan Rp {selectedTotal.toLocaleString('id-ID')}</span>
            </button>
          )}
        </div>

        {/* Dialog Konfirmasi Pencairan Bank */}
        {showPayoutDialog && (
          <div className="sub-modal-overlay" onClick={() => setShowPayoutDialog(false)}>
            <div className="sub-modal-content" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Konfirmasi Pencairan ke Rekening Bank</h3>
                <button className="icon-btn" onClick={() => setShowPayoutDialog(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body">
                <div className="payout-summary-badge">
                  <span className="text-xs text-muted">Total Dana yang Dicairkan</span>
                  <h2 className="text-emerald" style={{ margin: '0.25rem 0' }}>
                    Rp {selectedTotal.toLocaleString('id-ID')}
                  </h2>
                  <span className="text-xs font-medium">
                    {selectedTxs.length} Pesanan Online Food Terpilih
                  </span>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Pilih Rekening Bank Tujuan</label>
                  <select
                    className="form-input"
                    value={targetBank}
                    onChange={(e) => setTargetBank(e.target.value)}
                  >
                    <option value="BCA">Bank BCA (Rekening Utama Kedai)</option>
                    <option value="Mandiri">Bank Mandiri</option>
                    <option value="BRI">Bank BRI</option>
                    <option value="BNI">Bank BNI</option>
                    <option value="Bank Jago">Bank Jago (Kas Operasional)</option>
                    <option value="SeaBank">SeaBank (Shopee Payout)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">No. Rekening / Catatan Mutasi (Opsional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Misal: Mutasi BCA a.n Roy Prasetyo"
                    value={bankRef}
                    onChange={(e) => setBankRef(e.target.value)}
                  />
                </div>

                <div className="info-box-compact">
                  <ShieldCheck size={16} className="text-emerald" />
                  <span>
                    Pesanan yang dicairkan akan ditandai <strong>Settled (Cair)</strong> dan saldo kas bank kedai Anda akan sinkron secara riil.
                  </span>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowPayoutDialog(false)}
                >
                  Batal
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleConfirmDisbursement}
                  disabled={isProcessingPayout}
                >
                  <Check size={16} />
                  <span>Tandai Sudah Masuk Bank</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
