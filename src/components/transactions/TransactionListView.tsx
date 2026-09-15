import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { logActivity } from '../../db/logger';
import { Transaction, TransactionType, PaymentMethod } from '../../types';
import { 
  Search, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Trash2, 
  Coins, 
  CreditCard,
  Calendar,
  AlertTriangle
} from 'lucide-react';

export const TransactionListView: React.FC = () => {
  const { 
    activeStore, 
    activeTenant, 
    role, 
    currentActorName, 
    setIsAddTxOpen, 
    refreshAllData 
  } = useApp();

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterMethod, setFilterMethod] = useState<'all' | PaymentMethod>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTransactions();
  }, [activeStore]);

  const loadTransactions = async () => {
    if (!activeStore) return;
    setLoading(true);
    const txs = await db.transactions
      .where('storeId')
      .equals(activeStore.id)
      .reverse()
      .sortBy('createdAt');
    setTransactions(txs);
    setLoading(false);
  };

  const handleDelete = async (tx: Transaction) => {
    if (role === 'cashier') {
      alert('Akses Dibatasi: Kasir tidak diizinkan menghapus transaksi. Hubungi Pemilik/Owner untuk koreksi kas.');
      return;
    }

    const confirmDelete = window.confirm(
      `Hapus transaksi: "${tx.description || tx.categoryName}" senilai Rp ${tx.amount.toLocaleString('id-ID')}?\n\nAksi ini akan dicatat ke dalam Audit Log untuk mencegah kecurangan!`
    );

    if (!confirmDelete) return;

    try {
      await db.transactions.delete(tx.id);

      // Record in Audit Log
      await logActivity({
        tenantId: activeTenant?.id,
        storeId: activeStore?.id,
        storeName: `${activeStore?.name} - ${activeStore?.branchName}`,
        actorRole: role,
        actorName: currentActorName,
        actionType: 'TRANSACTION_DELETE',
        description: `MENGHAPUS transaksi senilai Rp ${tx.amount.toLocaleString('id-ID')} (${tx.categoryName}) - "${tx.description}"`,
        metadata: { deletedTransaction: tx }
      });

      await refreshAllData();
      await loadTransactions();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus transaksi.');
    }
  };

  // Filtered List
  const filteredList = transactions.filter((tx) => {
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesMethod = filterMethod === 'all' || tx.paymentMethod === filterMethod;
    const matchesSearch = 
      (tx.description && tx.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.categoryName && tx.categoryName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (tx.createdByName && tx.createdByName.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesType && matchesMethod && matchesSearch;
  });

  const totalFilteredIncome = filteredList
    .filter(t => t.type === 'in')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalFilteredExpense = filteredList
    .filter(t => t.type === 'out')
    .reduce((sum, t) => sum + t.amount, 0);

  const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

  return (
    <div className="tx-page-container">
      {/* Page Header */}
      <div className="page-header-flex">
        <div>
          <h2>Buku Kas & Transaksi</h2>
          <p className="text-muted text-sm">
            {activeStore?.branchName} • Riwayat seluruh arus uang kedai
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddTxOpen(true)}>
          <Plus size={18} />
          <span>Catat Transaksi</span>
        </button>
      </div>

      {/* Summary Chips */}
      <div className="tx-summary-bar">
        <div className="summary-chip in-chip">
          <span className="chip-label">Total Masuk (Filter):</span>
          <span className="chip-val text-emerald">+{formatRupiah(totalFilteredIncome)}</span>
        </div>
        <div className="summary-chip out-chip">
          <span className="chip-label">Total Keluar (Filter):</span>
          <span className="chip-val text-rose">-{formatRupiah(totalFilteredExpense)}</span>
        </div>
        <div className="summary-chip net-chip">
          <span className="chip-label">Selisih Bersih:</span>
          <span className={`chip-val ${totalFilteredIncome >= totalFilteredExpense ? 'text-emerald' : 'text-rose'}`}>
            {formatRupiah(totalFilteredIncome - totalFilteredExpense)}
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="filter-controls-card">
        {/* Search */}
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Cari transaksi, menu, bahan, atau kasir..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Filters */}
        <div className="filter-buttons-group">
          {/* Type Filters */}
          <div className="btn-group">
            <button
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Semua
            </button>
            <button
              className={`filter-btn ${filterType === 'in' ? 'active' : ''}`}
              onClick={() => setFilterType('in')}
            >
              Masuk
            </button>
            <button
              className={`filter-btn ${filterType === 'out' ? 'active' : ''}`}
              onClick={() => setFilterType('out')}
            >
              Keluar
            </button>
          </div>

          {/* Payment Method Filter */}
          <div className="btn-group">
            <button
              className={`filter-btn ${filterMethod === 'all' ? 'active' : ''}`}
              onClick={() => setFilterMethod('all')}
            >
              Semua Metode
            </button>
            <button
              className={`filter-btn ${filterMethod === 'cash' ? 'active' : ''}`}
              onClick={() => setFilterMethod('cash')}
            >
              Tunai (Laci)
            </button>
            <button
              className={`filter-btn ${filterMethod === 'qris' ? 'active' : ''}`}
              onClick={() => setFilterMethod('qris')}
            >
              QRIS
            </button>
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="card tx-list-card">
        {loading ? (
          <div className="empty-state">Memuat data transaksi...</div>
        ) : filteredList.length === 0 ? (
          <div className="empty-state">
            <p className="text-muted">Tidak ada transaksi yang cocok dengan pencarian / filter.</p>
          </div>
        ) : (
          <div className="tx-table-wrap">
            <table className="tx-table">
              <thead>
                <tr>
                  <th>Waktu</th>
                  <th>Kategori & Deskripsi</th>
                  <th>Metode</th>
                  <th>Pencatat</th>
                  <th className="text-right">Nominal</th>
                  <th className="text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map((tx) => (
                  <tr key={tx.id}>
                    <td className="tx-col-time">
                      <span className="tx-time-text">{tx.time}</span>
                      <span className="tx-date-text">{tx.date}</span>
                    </td>
                    <td className="tx-col-desc">
                      <div className="tx-cat-badge">{tx.categoryName}</div>
                      <div className="tx-desc-text">{tx.description || '-'}</div>
                    </td>
                    <td>
                      <span className={`payment-badge ${tx.paymentMethod}`}>
                        {tx.paymentMethod === 'cash' ? <Coins size={12} /> : <CreditCard size={12} />}
                        {tx.paymentMethod === 'cash' ? 'Tunai' : 'QRIS'}
                      </span>
                    </td>
                    <td className="tx-col-actor">
                      <span className="actor-text">{tx.createdByName}</span>
                      <span className="actor-role">({tx.createdByRole})</span>
                    </td>
                    <td className="text-right">
                      <span className={`tx-amount-badge ${tx.type === 'in' ? 'amount-in' : 'amount-out'}`}>
                        {tx.type === 'in' ? '+' : '-'}{formatRupiah(tx.amount)}
                      </span>
                    </td>
                    <td className="text-center">
                      <button
                        className="btn-icon-danger"
                        onClick={() => handleDelete(tx)}
                        title={role === 'cashier' ? 'Kasir tidak diizinkan menghapus transaksi' : 'Hapus transaksi (tercatat di audit log)'}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
