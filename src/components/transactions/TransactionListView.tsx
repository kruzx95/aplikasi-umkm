import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { logActivity } from '../../db/logger';
import { Transaction, TransactionType, PaymentMethod, Category } from '../../types';
import { 
  Search, 
  Filter, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Plus, 
  Trash2, 
  Coins, 
  CreditCard,
  Building2,
  Calendar, 
  AlertTriangle,
  X,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpDown,
  Tag
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
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | TransactionType>('all');
  const [filterMethod, setFilterMethod] = useState<'all' | PaymentMethod>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days' | 'month' | 'custom'>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadTransactionsAndCategories();
  }, [activeStore]);

  const loadTransactionsAndCategories = async () => {
    if (!activeStore) return;
    setLoading(true);
    const [txs, cats] = await Promise.all([
      db.transactions
        .where('storeId')
        .equals(activeStore.id)
        .reverse()
        .sortBy('createdAt'),
      db.categories.toArray()
    ]);
    setTransactions(txs);
    setCategories(cats);
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
      await loadTransactionsAndCategories();
    } catch (err) {
      console.error(err);
      alert('Gagal menghapus transaksi.');
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterMethod('all');
    setFilterCategory('all');
    setDateFilter('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSortBy('date-desc');
  };

  // Check if any filter is active
  const hasActiveFilters = 
    searchQuery.trim() !== '' || 
    filterType !== 'all' || 
    filterMethod !== 'all' || 
    filterCategory !== 'all' || 
    dateFilter !== 'all' || 
    sortBy !== 'date-desc';

  // Filtered & Sorted List
  const filteredList = useMemo(() => {
    let list = transactions.filter((tx) => {
      // 1. Type filter
      if (filterType !== 'all' && tx.type !== filterType) return false;

      // 2. Method filter
      if (filterMethod !== 'all' && tx.paymentMethod !== filterMethod) return false;

      // 3. Category filter
      if (filterCategory !== 'all' && tx.categoryId !== filterCategory && tx.categoryName !== filterCategory) return false;

      // 4. Date filter
      if (dateFilter === 'today') {
        if (tx.date !== todayStr) return false;
      } else if (dateFilter === '7days') {
        const d = new Date();
        d.setDate(d.getDate() - 6);
        const cutoff = d.toISOString().split('T')[0];
        if (tx.date < cutoff) return false;
      } else if (dateFilter === 'month') {
        const currentMonth = todayStr.substring(0, 7);
        if (!tx.date.startsWith(currentMonth)) return false;
      } else if (dateFilter === 'custom') {
        if (customStartDate && tx.date < customStartDate) return false;
        if (customEndDate && tx.date > customEndDate) return false;
      }

      // 5. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = tx.description ? tx.description.toLowerCase().includes(q) : false;
        const catMatch = tx.categoryName ? tx.categoryName.toLowerCase().includes(q) : false;
        const actorMatch = tx.createdByName ? tx.createdByName.toLowerCase().includes(q) : false;
        const amountMatch = tx.amount.toString().includes(q);
        if (!descMatch && !catMatch && !actorMatch && !amountMatch) return false;
      }

      return true;
    });

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'date-desc') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      } else if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });

    return list;
  }, [
    transactions, 
    filterType, 
    filterMethod, 
    filterCategory, 
    dateFilter, 
    customStartDate, 
    customEndDate, 
    searchQuery, 
    sortBy, 
    todayStr
  ]);

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
            {activeStore?.name} ({activeStore?.branchName}) • Riwayat seluruh arus uang kedai
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsAddTxOpen(true)}>
          <Plus size={18} />
          <span>Catat Transaksi</span>
        </button>
      </div>

      {/* Summary KPI Chips */}
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

      {/* Comprehensive Filter Controls Card */}
      <div className="filter-controls-card">
        {/* Row 1: Search & Type Toggle */}
        <div className="filter-row-top">
          {/* Search Box with Clear Button */}
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Cari transaksi, menu, belanja pasar, atau kasir..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="search-clear-btn" 
                onClick={() => setSearchQuery('')}
                title="Hapus pencarian"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Type Filter Buttons */}
          <div className="btn-group">
            <button
              className={`filter-btn ${filterType === 'all' ? 'active' : ''}`}
              onClick={() => setFilterType('all')}
            >
              Semua
            </button>
            <button
              className={`filter-btn filter-btn-in ${filterType === 'in' ? 'active' : ''}`}
              onClick={() => setFilterType('in')}
            >
              Masuk
            </button>
            <button
              className={`filter-btn filter-btn-out ${filterType === 'out' ? 'active' : ''}`}
              onClick={() => setFilterType('out')}
            >
              Keluar
            </button>
          </div>
        </div>

        {/* Row 2: Date Filters & Payment Method */}
        <div className="filter-row-middle">
          {/* Date Filter Buttons */}
          <div className="filter-item-wrap">
            <span className="filter-field-label">
              <Calendar size={13} /> Waktu:
            </span>
            <div className="btn-group">
              <button
                className={`filter-btn ${dateFilter === 'all' ? 'active' : ''}`}
                onClick={() => setDateFilter('all')}
              >
                Semua
              </button>
              <button
                className={`filter-btn ${dateFilter === 'today' ? 'active' : ''}`}
                onClick={() => setDateFilter('today')}
              >
                Hari Ini
              </button>
              <button
                className={`filter-btn ${dateFilter === '7days' ? 'active' : ''}`}
                onClick={() => setDateFilter('7days')}
              >
                7 Hari
              </button>
              <button
                className={`filter-btn ${dateFilter === 'month' ? 'active' : ''}`}
                onClick={() => setDateFilter('month')}
              >
                Bulan Ini
              </button>
              <button
                className={`filter-btn ${dateFilter === 'custom' ? 'active' : ''}`}
                onClick={() => setDateFilter('custom')}
              >
                Kustom
              </button>
            </div>
          </div>

          {/* Payment Method Filter */}
          <div className="filter-item-wrap">
            <span className="filter-field-label">
              <Coins size={13} /> Metode:
            </span>
            <div className="btn-group">
              <button
                className={`filter-btn ${filterMethod === 'all' ? 'active' : ''}`}
                onClick={() => setFilterMethod('all')}
              >
                Semua
              </button>
              <button
                className={`filter-btn ${filterMethod === 'cash' ? 'active' : ''}`}
                onClick={() => setFilterMethod('cash')}
              >
                Tunai
              </button>
              <button
                className={`filter-btn ${filterMethod === 'qris' ? 'active' : ''}`}
                onClick={() => setFilterMethod('qris')}
              >
                QRIS
              </button>
              <button
                className={`filter-btn ${filterMethod === 'transfer' ? 'active' : ''}`}
                onClick={() => setFilterMethod('transfer')}
              >
                Transfer
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Custom Date Range (Conditional) */}
        {dateFilter === 'custom' && (
          <div className="custom-date-row">
            <div className="date-input-group">
              <label>Dari Tanggal:</label>
              <input
                type="date"
                className="date-picker-input"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
            </div>
            <div className="date-input-group">
              <label>Sampai Tanggal:</label>
              <input
                type="date"
                className="date-picker-input"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Row 4: Category Filter & Sorting Selectors */}
        <div className="filter-row-bottom">
          {/* Category Selector */}
          <div className="filter-select-wrap">
            <label className="filter-field-label">
              <Tag size={13} /> Kategori:
            </label>
            <select
              className="filter-custom-select"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="all">Semua Kategori</option>
              <optgroup label="Pemasukan">
                {categories.filter(c => c.type === 'in').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
              <optgroup label="Pengeluaran">
                {categories.filter(c => c.type === 'out').map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Sorting Selector */}
          <div className="filter-select-wrap">
            <label className="filter-field-label">
              <ArrowUpDown size={13} /> Urutan:
            </label>
            <select
              className="filter-custom-select"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
            >
              <option value="date-desc">Waktu Terbaru ↓</option>
              <option value="date-asc">Waktu Terlama ↑</option>
              <option value="amount-desc">Nominal Tertinggi (Rp) ↓</option>
              <option value="amount-asc">Nominal Terendah (Rp) ↑</option>
            </select>
          </div>

          {/* Reset All Filters Button */}
          {hasActiveFilters && (
            <button
              type="button"
              className="btn btn-outline btn-sm reset-filter-btn"
              onClick={handleResetFilters}
            >
              <RotateCcw size={14} />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Active Filter Tags Bar */}
        <div className="active-filters-info">
          <span className="results-count-text">
            Menampilkan <strong>{filteredList.length}</strong> dari {transactions.length} transaksi
          </span>

          <div className="active-tags-list">
            {searchQuery && (
              <span className="active-tag">
                Cari: "{searchQuery}"
                <X size={12} onClick={() => setSearchQuery('')} />
              </span>
            )}
            {filterType !== 'all' && (
              <span className="active-tag">
                {filterType === 'in' ? 'Pemasukan' : 'Pengeluaran'}
                <X size={12} onClick={() => setFilterType('all')} />
              </span>
            )}
            {filterMethod !== 'all' && (
              <span className="active-tag">
                Metode: {filterMethod.toUpperCase()}
                <X size={12} onClick={() => setFilterMethod('all')} />
              </span>
            )}
            {dateFilter !== 'all' && (
              <span className="active-tag">
                Waktu: {dateFilter === 'today' ? 'Hari Ini' : dateFilter === '7days' ? '7 Hari' : dateFilter === 'month' ? 'Bulan Ini' : 'Kustom'}
                <X size={12} onClick={() => setDateFilter('all')} />
              </span>
            )}
            {filterCategory !== 'all' && (
              <span className="active-tag">
                Kategori: {categories.find(c => c.id === filterCategory)?.name || filterCategory}
                <X size={12} onClick={() => setFilterCategory('all')} />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Transactions Table / List */}
      <div className="card tx-list-card">
        {loading ? (
          <div className="empty-state">Memuat data transaksi...</div>
        ) : filteredList.length === 0 ? (
          <div className="empty-state">
            <p className="text-muted">Tidak ada transaksi yang cocok dengan kriteria pencarian atau filter.</p>
            {hasActiveFilters && (
              <button 
                type="button"
                className="btn btn-outline btn-sm mt-2" 
                onClick={handleResetFilters}
              >
                <RotateCcw size={14} />
                <span>Reset Semua Filter</span>
              </button>
            )}
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
                        {tx.paymentMethod === 'cash' ? (
                          <Coins size={12} />
                        ) : tx.paymentMethod === 'qris' ? (
                          <CreditCard size={12} />
                        ) : (
                          <Building2 size={12} />
                        )}
                        {tx.paymentMethod === 'cash' 
                          ? 'Tunai' 
                          : tx.paymentMethod === 'qris' 
                          ? 'QRIS' 
                          : 'Transfer'}
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
