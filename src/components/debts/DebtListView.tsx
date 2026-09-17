import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { logActivity } from '../../db/logger';
import { Debt, DebtPayment } from '../../types';
import { 
  BookOpen, 
  Plus, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  Phone, 
  Trash2, 
  AlertCircle,
  AlertTriangle,
  X,
  Coins,
  Search,
  Calendar,
  Send,
  History,
  CreditCard,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface DueDateStatus {
  label: string;
  type: 'overdue' | 'today' | 'soon' | 'future' | 'paid';
  diffDays: number;
}

export const DebtListView: React.FC = () => {
  const { 
    activeStore, 
    activeTenant, 
    role, 
    currentActorName, 
    setActiveTab,
    refreshAllData,
    refreshOverdueDebtsCount 
  } = useApp();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [activeType, setActiveType] = useState<'all' | 'piutang' | 'utang'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'overdue' | 'unpaid' | 'paid'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'dueDate-asc' | 'dueDate-desc' | 'amount-desc' | 'amount-asc'>('dueDate-asc');
  
  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedDebtForWA, setSelectedDebtForWA] = useState<Debt | null>(null);
  const [selectedDebtForPay, setSelectedDebtForPay] = useState<Debt | null>(null);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);
  
  // New Debt Form State
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<'piutang' | 'utang'>('piutang');
  const [amount, setAmount] = useState<number>(0);
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  // WhatsApp Reminder State
  const [waTemplateType, setWaTemplateType] = useState<'friendly' | 'formal' | 'urgent'>('friendly');
  const [waCustomMessage, setWaCustomMessage] = useState('');

  // Payment / Installment Form State
  const [paymentMode, setPaymentMode] = useState<'full' | 'partial'>('full');
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'qris' | 'transfer'>('cash');
  const [paymentNote, setPaymentNote] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const loadDebts = async () => {
    if (!activeStore) return;
    const items = await db.debts
      .where('storeId')
      .equals(activeStore.id)
      .toArray();
    setDebts(items);
  };

  useEffect(() => {
    loadDebts();
  }, [activeStore]);

  // Calculate Due Date Status
  const getDueDateStatus = (dueDateStr: string, status: 'unpaid' | 'paid'): DueDateStatus => {
    if (status === 'paid') {
      return { label: 'Lunas', type: 'paid', diffDays: 0 };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dueDateStr + 'T00:00:00');
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { label: `Telat ${Math.abs(diffDays)} Hari!`, type: 'overdue', diffDays };
    }
    if (diffDays === 0) {
      return { label: 'Jatuh Tempo Hari Ini', type: 'today', diffDays: 0 };
    }
    if (diffDays === 1) {
      return { label: 'Besok (H-1)', type: 'soon', diffDays: 1 };
    }
    return { label: `${diffDays} hari lagi`, type: 'future', diffDays };
  };

  // Overdue and Due Today List for Alert Banner
  const overdueOrTodayList = useMemo(() => {
    return debts.filter(d => {
      if (d.status === 'paid') return false;
      const statusInfo = getDueDateStatus(d.dueDate, d.status);
      return statusInfo.type === 'overdue' || statusInfo.type === 'today';
    });
  }, [debts]);

  const totalOverdueAmount = useMemo(() => {
    return overdueOrTodayList.reduce((sum, d) => sum + d.amount, 0);
  }, [overdueOrTodayList]);

  // Filtered and Sorted Debts
  const filteredDebts = useMemo(() => {
    return debts.filter(debt => {
      // 1. Type Filter
      if (activeType !== 'all' && debt.type !== activeType) return false;

      // 2. Status Filter
      if (statusFilter === 'unpaid' && debt.status !== 'unpaid') return false;
      if (statusFilter === 'paid' && debt.status !== 'paid') return false;
      if (statusFilter === 'overdue') {
        if (debt.status === 'paid') return false;
        const statusInfo = getDueDateStatus(debt.dueDate, debt.status);
        if (statusInfo.type !== 'overdue' && statusInfo.type !== 'today') return false;
      }

      // 3. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = debt.personName.toLowerCase().includes(q);
        const matchPhone = debt.phone ? debt.phone.includes(q) : false;
        const matchDesc = debt.description ? debt.description.toLowerCase().includes(q) : false;
        const matchAmount = debt.amount.toString().includes(q);
        if (!matchName && !matchPhone && !matchDesc && !matchAmount) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'dueDate-asc') {
        return a.dueDate.localeCompare(b.dueDate);
      } else if (sortBy === 'dueDate-desc') {
        return b.dueDate.localeCompare(a.dueDate);
      } else if (sortBy === 'amount-desc') {
        return b.amount - a.amount;
      } else if (sortBy === 'amount-asc') {
        return a.amount - b.amount;
      }
      return 0;
    });
  }, [debts, activeType, statusFilter, searchQuery, sortBy]);

  // Add Debt Handler
  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore || !activeTenant || amount <= 0 || !personName.trim()) {
      alert('Lengkapi nama dan nominal dengan benar!');
      return;
    }

    const newId = 'debt_' + Date.now();
    const finalDueDate = dueDate || todayStr;
    await db.debts.add({
      id: newId,
      tenantId: activeTenant.id,
      storeId: activeStore.id,
      personName: personName.trim(),
      phone: phone.trim(),
      type,
      amount,
      originalAmount: amount,
      dueDate: finalDueDate,
      status: 'unpaid',
      description: description.trim(),
      createdAt: new Date().toISOString(),
      paymentHistory: []
    });

    await logActivity({
      tenantId: activeTenant.id,
      storeId: activeStore.id,
      storeName: `${activeStore.name} - ${activeStore.branchName}`,
      actorRole: role,
      actorName: currentActorName,
      actionType: 'DEBT_ADD',
      description: `Mencatat ${type === 'piutang' ? 'kasbon pelanggan' : 'utang supplier'} atas nama ${personName} senilai Rp ${amount.toLocaleString('id-ID')} (Jatuh tempo: ${finalDueDate})`,
      metadata: { personName, amount, type, dueDate: finalDueDate }
    });

    setIsAddModalOpen(false);
    setPersonName('');
    setPhone('');
    setAmount(0);
    setDescription('');
    setDueDate('');
    await loadDebts();
    await refreshOverdueDebtsCount();
  };

  // Open WhatsApp Modal & Setup Templates
  const handleOpenWhatsAppModal = (debt: Debt) => {
    setSelectedDebtForWA(debt);
    const storeTitle = activeStore ? `${activeStore.name} (${activeStore.branchName})` : 'Kedai Kami';
    const nominalStr = 'Rp ' + debt.amount.toLocaleString('id-ID');
    const statusInfo = getDueDateStatus(debt.dueDate, debt.status);

    let defaultMsg = '';
    if (statusInfo.type === 'overdue') {
      setWaTemplateType('urgent');
      defaultMsg = `Halo Kak ${debt.personName}, mohon maaf mengganggu waktunya 🙏\n\nKami menginfokan catatan bon belanja di *${storeTitle}* senilai *${nominalStr}* (${debt.description || 'pesanan'}) telah melewati tanggal jatuh tempo (${debt.dueDate}, *telat ${Math.abs(statusInfo.diffDays)} hari*).\n\nMohon bantuannya untuk segera melakukan konfirmasi atau pelunasan ya Kak. Terima kasih banyak atas kerjasamanya! 🙏`;
    } else if (statusInfo.type === 'today') {
      setWaTemplateType('formal');
      defaultMsg = `Selamat siang Kak ${debt.personName} 😊\n\nSekadar mengingatkan catatan transaksi di *${storeTitle}* sebesar *${nominalStr}* (${debt.description || 'pesanan'}) jatuh tempo *HARI INI*. Pembayaran dapat dilakukan langsung di kasir atau via transfer. Terima kasih banyak ya Kak!`;
    } else {
      setWaTemplateType('friendly');
      defaultMsg = `Halo Kak ${debt.personName}, salam hangat dari *${storeTitle}* 😊\n\nSekadar info santai ya Kak, ada catatan bon belanja sebesar *${nominalStr}* (${debt.description || 'menu kedai'}) dengan estimasi tempo tanggal ${debt.dueDate}.\n\nJika sempat bisa mampir ke kedai ya Kak. Terima kasih banyak atas kepercayaannya! 🙏`;
    }
    setWaCustomMessage(defaultMsg);
  };

  const handleSelectWATemplate = (template: 'friendly' | 'formal' | 'urgent') => {
    if (!selectedDebtForWA) return;
    setWaTemplateType(template);
    const storeTitle = activeStore ? `${activeStore.name} (${activeStore.branchName})` : 'Kedai Kami';
    const nominalStr = 'Rp ' + selectedDebtForWA.amount.toLocaleString('id-ID');
    const statusInfo = getDueDateStatus(selectedDebtForWA.dueDate, selectedDebtForWA.status);

    if (template === 'friendly') {
      setWaCustomMessage(`Halo Kak ${selectedDebtForWA.personName}, salam hangat dari *${storeTitle}* 😊\n\nSekadar info santai ya Kak, ada catatan bon belanja sebesar *${nominalStr}* (${selectedDebtForWA.description || 'menu kedai'}).\n\nBisa dibayarkan saat santai atau mampir lagi ke kedai ya Kak. Terima kasih banyak! 🙏`);
    } else if (template === 'formal') {
      setWaCustomMessage(`Selamat siang Kak/Bpk/Ibu ${selectedDebtForWA.personName}.\n\nKami dari administrasi kasir *${storeTitle}* menginfokan catatan transaksi bertempo sebesar *${nominalStr}* dengan tanggal jatuh tempo *${selectedDebtForWA.dueDate}*.\n\nMohon konfirmasinya bila telah melakukan transfer. Terima kasih atas kerjasamanya.`);
    } else if (template === 'urgent') {
      setWaCustomMessage(`Halo Kak ${selectedDebtForWA.personName}, mohon maaf mengganggu waktunya 🙏\n\nCatatan bon belanja di *${storeTitle}* senilai *${nominalStr}* (${selectedDebtForWA.description || 'pesanan'}) tercatat *telah melewati batas tanggal jatuh tempo* (${selectedDebtForWA.dueDate}${statusInfo.diffDays < 0 ? `, telat ${Math.abs(statusInfo.diffDays)} hari` : ''}).\n\nMohon kesediaannya untuk segera menyelesaikan pembayaran. Terima kasih banyak atas pengertiannya.`);
    }
  };

  const handleSendWA = () => {
    if (!selectedDebtForWA || !selectedDebtForWA.phone) {
      alert('Nomor telepon tidak valid!');
      return;
    }
    const cleanPhone = selectedDebtForWA.phone.replace(/[^0-9]/g, '').replace(/^0/, '62');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(waCustomMessage)}`, '_blank');
    setSelectedDebtForWA(null);
  };

  // Open Payment Modal
  const handleOpenPaymentModal = (debt: Debt) => {
    setSelectedDebtForPay(debt);
    setPaymentMode('full');
    setPaymentAmount(debt.amount);
    setPaymentMethod('cash');
    setPaymentNote('');
  };

  // Process Payment / Installment
  const handleProcessPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebtForPay || !activeStore || !activeTenant) return;

    const debt = selectedDebtForPay;
    const payAmount = paymentMode === 'full' ? debt.amount : paymentAmount;

    if (payAmount <= 0 || payAmount > debt.amount) {
      alert(`Nominal pembayaran harus antara Rp 1 sampai Rp ${debt.amount.toLocaleString('id-ID')}`);
      return;
    }

    const now = new Date();
    const isSettled = payAmount >= debt.amount;
    const remainingAmount = debt.amount - payAmount;

    const newPaymentRecord: DebtPayment = {
      amount: payAmount,
      date: now.toISOString(),
      paymentMethod,
      note: paymentNote.trim() || (isSettled ? 'Pelunasan lunas' : `Cicilan kasbon (Sisa Rp ${remainingAmount.toLocaleString('id-ID')})`),
      actorName: currentActorName
    };

    const updatedHistory = [...(debt.paymentHistory || []), newPaymentRecord];

    // Update Debt Record
    await db.debts.update(debt.id, {
      amount: remainingAmount,
      originalAmount: debt.originalAmount || debt.amount,
      status: isSettled ? 'paid' : 'unpaid',
      paidAt: isSettled ? now.toISOString() : undefined,
      paymentHistory: updatedHistory
    });

    // Otomatis masukkan ke riwayat transaksi kas (Buku Kas Masuk / Keluar)
    await db.transactions.add({
      id: 'tx_debt_' + Date.now(),
      tenantId: debt.tenantId,
      storeId: debt.storeId,
      type: debt.type === 'piutang' ? 'in' : 'out',
      amount: payAmount,
      paymentMethod,
      categoryId: debt.type === 'piutang' ? 'cat_in_sales' : 'cat_out_other',
      categoryName: debt.type === 'piutang' 
        ? (isSettled ? 'Pelunasan Bon Pelanggan' : 'Cicilan Bon Pelanggan')
        : (isSettled ? 'Pelunasan Utang Supplier' : 'Cicilan Utang Supplier'),
      description: `${isSettled ? 'Pelunasan' : 'Cicilan'} ${debt.type} - ${debt.personName} (${debt.description || 'kasbon'})`,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().substring(0, 5),
      createdByRole: role,
      createdByName: currentActorName,
      createdAt: now.toISOString(),
    });

    // Audit Log
    await logActivity({
      tenantId: activeTenant.id,
      storeId: activeStore.id,
      storeName: `${activeStore.name} - ${activeStore.branchName}`,
      actorRole: role,
      actorName: currentActorName,
      actionType: isSettled ? 'DEBT_PAY' : 'DEBT_INSTALLMENT',
      description: isSettled 
        ? `Pelunasan LUNAS ${debt.type} Rp ${payAmount.toLocaleString('id-ID')} atas nama ${debt.personName}`
        : `Pembayaran cicilan ${debt.type} Rp ${payAmount.toLocaleString('id-ID')} atas nama ${debt.personName} (Sisa: Rp ${remainingAmount.toLocaleString('id-ID')})`,
      metadata: { debtId: debt.id, payAmount, remainingAmount, paymentMethod }
    });

    confetti({
      particleCount: 35,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#34d399', '#6366f1']
    });

    setSelectedDebtForPay(null);
    await refreshAllData();
    await refreshOverdueDebtsCount();
    await loadDebts();
  };

  // Delete Debt Handler
  const handleDeleteDebt = async (debt: Debt) => {
    if (role === 'cashier') {
      alert('Kasir tidak diizinkan menghapus data kasbon. Silakan hubungi Pemilik.');
      return;
    }
    if (!window.confirm(`Hapus catatan bon "${debt.personName}" sebesar Rp ${debt.amount.toLocaleString('id-ID')}?`)) return;
    await db.debts.delete(debt.id);
    await loadDebts();
    await refreshOverdueDebtsCount();
  };

  const totalUnpaidPiutang = debts
    .filter(d => d.type === 'piutang' && d.status === 'unpaid')
    .reduce((s, d) => s + d.amount, 0);

  const totalUnpaidUtang = debts
    .filter(d => d.type === 'utang' && d.status === 'unpaid')
    .reduce((s, d) => s + d.amount, 0);

  const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

  return (
    <div className="debt-page-container">
      {/* Page Header */}
      <div className="page-header-flex">
        <div>
          <button 
            type="button" 
            className="mobile-back-crumb-btn" 
            onClick={() => setActiveTab('dashboard')}
          >
            <ArrowLeft size={15} />
            <span>Kembali ke Dashboard</span>
          </button>
          <h2>Buku Kasbon & Utang</h2>
          <p className="text-muted text-sm">
            {activeStore?.name} ({activeStore?.branchName}) • Kelola bon pelanggan, tempo supplier & pengingat WA
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Tambah Bon Baru</span>
        </button>
      </div>

      {/* Overdue Warning Alert Banner */}
      {overdueOrTodayList.length > 0 && (
        <div className="debt-alert-banner">
          <div className="alert-banner-left">
            <div className="alert-icon-wrap">
              <AlertTriangle size={22} className="alert-icon-svg" />
            </div>
            <div>
              <div className="alert-banner-title">
                {overdueOrTodayList.length} Catatan Kasbon Memerlukan Perhatian!
              </div>
              <div className="alert-banner-sub">
                Total nominal tertunggak / jatuh tempo: <strong className="text-rose">{formatRupiah(totalOverdueAmount)}</strong>. Kirim pengingat WhatsApp atau catat cicilan.
              </div>
            </div>
          </div>
          <button 
            className="btn btn-sm btn-outline alert-banner-btn"
            onClick={() => {
              setActiveType('all');
              setStatusFilter(statusFilter === 'overdue' ? 'all' : 'overdue');
            }}
          >
            {statusFilter === 'overdue' ? 'Tampilkan Semua' : 'Filter Yang Terlambat'}
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="debt-summary-grid">
        <div className="card">
          <span className="stat-label">Piutang Kedai (Pelanggan Ngutang)</span>
          <div className="stat-value text-amber">{formatRupiah(totalUnpaidPiutang)}</div>
          <span className="text-muted text-xs">Uang Anda yang belum dibayar pembeli</span>
        </div>

        <div className="card">
          <span className="stat-label">Utang Kedai (Ke Supplier Bahan)</span>
          <div className="stat-value text-rose">{formatRupiah(totalUnpaidUtang)}</div>
          <span className="text-muted text-xs">Kewajiban bayar belanja bahan bertempo</span>
        </div>
      </div>

      {/* Filter Toolbar Card */}
      <div className="filter-controls-card">
        {/* Row 1: Search & Type Toggle */}
        <div className="filter-row-top">
          <div className="search-box">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Cari nama penghutang, nomor telepon, atau catatan..."
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

          <div className="btn-group">
            <button
              className={`filter-btn ${activeType === 'all' ? 'active' : ''}`}
              onClick={() => setActiveType('all')}
            >
              Semua Tipe ({debts.length})
            </button>
            <button
              className={`filter-btn ${activeType === 'piutang' ? 'active' : ''}`}
              onClick={() => setActiveType('piutang')}
            >
              Piutang ({debts.filter(d => d.type === 'piutang').length})
            </button>
            <button
              className={`filter-btn ${activeType === 'utang' ? 'active' : ''}`}
              onClick={() => setActiveType('utang')}
            >
              Utang ({debts.filter(d => d.type === 'utang').length})
            </button>
          </div>
        </div>

        {/* Row 2: Status Chips & Sorting */}
        <div className="filter-row-bottom">
          <div className="filter-item-wrap">
            <span className="filter-field-label">Status:</span>
            <div className="btn-group">
              <button
                className={`filter-btn ${statusFilter === 'all' ? 'active' : ''}`}
                onClick={() => setStatusFilter('all')}
              >
                Semua
              </button>
              <button
                className={`filter-btn ${statusFilter === 'overdue' ? 'active' : ''}`}
                onClick={() => setStatusFilter('overdue')}
              >
                ⚠️ Lewat Tempo ({overdueOrTodayList.length})
              </button>
              <button
                className={`filter-btn ${statusFilter === 'unpaid' ? 'active' : ''}`}
                onClick={() => setStatusFilter('unpaid')}
              >
                Belum Lunas ({debts.filter(d => d.status === 'unpaid').length})
              </button>
              <button
                className={`filter-btn ${statusFilter === 'paid' ? 'active' : ''}`}
                onClick={() => setStatusFilter('paid')}
              >
                Lunas ({debts.filter(d => d.status === 'paid').length})
              </button>
            </div>
          </div>

          <div className="filter-select-wrap">
            <label className="filter-field-label">Urutan:</label>
            <select
              className="filter-custom-select"
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
            >
              <option value="dueDate-asc">Jatuh Tempo Terdekat ↑</option>
              <option value="dueDate-desc">Jatuh Tempo Terjauh ↓</option>
              <option value="amount-desc">Nominal Tertinggi (Rp) ↓</option>
              <option value="amount-asc">Nominal Terendah (Rp) ↑</option>
            </select>
          </div>
        </div>
      </div>

      {/* Debt List Cards */}
      <div className="debt-list-grid">
        {filteredDebts.length === 0 ? (
          <div className="card empty-state">
            <BookOpen size={36} className="text-muted" style={{ margin: '0 auto 0.5rem auto' }} />
            <p className="text-muted">Tidak ada catatan bon yang sesuai dengan filter.</p>
          </div>
        ) : (
          filteredDebts.map((debt) => {
            const dueStatus = getDueDateStatus(debt.dueDate, debt.status);
            const isHistoryExpanded = expandedHistoryId === debt.id;
            const hasInstallments = debt.paymentHistory && debt.paymentHistory.length > 0;

            return (
              <div 
                key={debt.id} 
                className={`card debt-item-card ${debt.status === 'paid' ? 'paid-card' : ''} ${dueStatus.type === 'overdue' && debt.status === 'unpaid' ? 'overdue-card-border' : ''}`}
              >
                {/* Header */}
                <div className="debt-card-header">
                  <div>
                    <div className="debt-tags-row">
                      <span className={`badge ${debt.type === 'piutang' ? 'badge-amber' : 'badge-rose'}`}>
                        {debt.type === 'piutang' ? 'Bon Pelanggan' : 'Utang Supplier'}
                      </span>
                      {debt.status === 'unpaid' && (
                        <span className={`badge badge-tempo badge-tempo-${dueStatus.type}`}>
                          {dueStatus.type === 'overdue' ? '⚠️ ' : dueStatus.type === 'today' ? '⏰ ' : '📅 '}
                          {dueStatus.label}
                        </span>
                      )}
                    </div>
                    <h4 className="debt-person-name">{debt.personName}</h4>
                    {debt.phone && (
                      <span className="debt-phone text-muted text-xs">
                        <Phone size={12} /> {debt.phone}
                      </span>
                    )}
                  </div>

                  <div className="debt-amount-wrap">
                    <span className="debt-amount-val">{formatRupiah(debt.amount)}</span>
                    {debt.originalAmount && debt.originalAmount > debt.amount && (
                      <span className="debt-original-val text-muted text-xs">
                        Asli: {formatRupiah(debt.originalAmount)}
                      </span>
                    )}
                    <span className={`badge ${debt.status === 'paid' ? 'badge-emerald' : 'badge-amber'}`}>
                      {debt.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                    </span>
                  </div>
                </div>

                {/* Description */}
                {debt.description && (
                  <p className="debt-desc-text">"{debt.description}"</p>
                )}

                {/* Due Date & Timing Info */}
                <div className="debt-meta-row">
                  <span className="text-muted text-xs debt-date-label">
                    <Calendar size={12} /> Jatuh Tempo: <strong>{debt.dueDate}</strong>
                  </span>
                  {hasInstallments && (
                    <button
                      type="button"
                      className="btn-link-history text-xs"
                      onClick={() => setExpandedHistoryId(isHistoryExpanded ? null : debt.id)}
                    >
                      <History size={12} />
                      <span>{debt.paymentHistory?.length}x Pembayaran</span>
                      {isHistoryExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                  )}
                </div>

                {/* Installment History Dropdown */}
                {isHistoryExpanded && hasInstallments && (
                  <div className="debt-history-box">
                    <div className="history-box-title text-xs">Riwayat Cicilan / Pembayaran:</div>
                    <ul className="history-list">
                      {debt.paymentHistory!.map((p, idx) => (
                        <li key={idx} className="history-item">
                          <div>
                            <span className="history-amount text-emerald">+{formatRupiah(p.amount)}</span>
                            <span className="history-method badge">{p.paymentMethod.toUpperCase()}</span>
                          </div>
                          <span className="history-note text-muted text-xs">{p.note || p.date.split('T')[0]}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Footer Actions */}
                <div className="debt-card-footer">
                  <div className="debt-actions-left">
                    {debt.status === 'unpaid' && debt.type === 'piutang' && debt.phone && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleOpenWhatsAppModal(debt)}
                        title="Kirim Pengingat WhatsApp"
                      >
                        <MessageCircle size={14} className="text-emerald" />
                        <span>Tagih WA</span>
                      </button>
                    )}
                  </div>

                  <div className="debt-actions">
                    {debt.status === 'unpaid' && (
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenPaymentModal(debt)}
                      >
                        <Coins size={14} />
                        <span>Bayar / Cicil</span>
                      </button>
                    )}

                    <button
                      className="btn-icon-danger"
                      onClick={() => handleDeleteDebt(debt)}
                      title="Hapus Catatan Bon"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal 1: Tambah Bon Baru */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Catat Bon / Kasbon Baru</h3>
              <button className="icon-btn" onClick={() => setIsAddModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddDebt}>
              <div className="modal-body">
                <div className="tx-type-toggle">
                  <button
                    type="button"
                    className={`type-btn in-btn ${type === 'piutang' ? 'active' : ''}`}
                    onClick={() => setType('piutang')}
                  >
                    Pelanggan Ngutang (Piutang)
                  </button>
                  <button
                    type="button"
                    className={`type-btn out-btn ${type === 'utang' ? 'active' : ''}`}
                    onClick={() => setType('utang')}
                  >
                    Kedai Ngutang (Ke Supplier)
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">Nama Orang / Supplier</label>
                  <input
                    type="text"
                    className="form-input"
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="Contoh: Pak Budi / Toko Plastik Jaya"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">No. WhatsApp (Untuk Pengingat Otomatis)</label>
                  <input
                    type="text"
                    className="form-input"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Nominal Bon (Rp)</label>
                  <div className="amount-input-container">
                    <span className="currency-prefix">Rp</span>
                    <input
                      type="text"
                      className="amount-input-big"
                      placeholder="0"
                      value={amount > 0 ? amount.toLocaleString('id-ID') : ''}
                      onChange={(e) => {
                        const num = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                        setAmount(num);
                      }}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Tanggal Janji Bayar / Jatuh Tempo</label>
                  <input
                    type="date"
                    className="form-input"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Catatan Bon / Keterangan</label>
                  <input
                    type="text"
                    className="form-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Contoh: 3 porsi ayam bakar, janji transfer sore"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddModalOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  Simpan Catatan Bon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Pengingat WhatsApp dengan 3 Pilihan Template */}
      {selectedDebtForWA && (
        <div className="modal-overlay" onClick={() => setSelectedDebtForWA(null)}>
          <div className="modal-content wa-reminder-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-flex">
                <MessageCircle size={22} className="text-emerald" />
                <div>
                  <h3>Kirim Tagihan WhatsApp</h3>
                  <p className="text-muted text-xs">Pilih gaya pesan pengingat untuk {selectedDebtForWA.personName}</p>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setSelectedDebtForWA(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="wa-recipient-card">
                <div className="recipient-info">
                  <span className="recipient-label">Penerima Tagihan:</span>
                  <strong className="recipient-name">{selectedDebtForWA.personName}</strong>
                  <span className="recipient-phone text-muted text-xs">WA: {selectedDebtForWA.phone}</span>
                </div>
                <div className="recipient-amount text-right">
                  <span className="recipient-label">Nominal Kasbon:</span>
                  <div className="text-emerald font-bold">{formatRupiah(selectedDebtForWA.amount)}</div>
                  <span className="text-muted text-xs">Tempo: {selectedDebtForWA.dueDate}</span>
                </div>
              </div>

              {/* Template Selectors */}
              <div className="wa-templates-group">
                <label className="form-label">Pilih Gaya Pesan:</label>
                <div className="template-cards-grid">
                  <div 
                    className={`template-card ${waTemplateType === 'friendly' ? 'active' : ''}`}
                    onClick={() => handleSelectWATemplate('friendly')}
                  >
                    <div className="template-card-header">
                      <span className="template-title">☕ Ramah & Santai</span>
                      {waTemplateType === 'friendly' && <CheckCircle2 size={14} className="text-emerald" />}
                    </div>
                    <p className="template-card-desc text-xs">Cocok untuk pelanggan tetap & teman nongkrong kedai.</p>
                  </div>

                  <div 
                    className={`template-card ${waTemplateType === 'formal' ? 'active' : ''}`}
                    onClick={() => handleSelectWATemplate('formal')}
                  >
                    <div className="template-card-header">
                      <span className="template-title">📋 Sopan & Formal</span>
                      {waTemplateType === 'formal' && <CheckCircle2 size={14} className="text-emerald" />}
                    </div>
                    <p className="template-card-desc text-xs">Cocok untuk pengingat jadwal jatuh tempo resmi.</p>
                  </div>

                  <div 
                    className={`template-card ${waTemplateType === 'urgent' ? 'active' : ''}`}
                    onClick={() => handleSelectWATemplate('urgent')}
                  >
                    <div className="template-card-header">
                      <span className="template-title">⚠️ Tegas / Menunggak</span>
                      {waTemplateType === 'urgent' && <CheckCircle2 size={14} className="text-rose" />}
                    </div>
                    <p className="template-card-desc text-xs">Cocok untuk kasbon yang sudah telat lewat tempo.</p>
                  </div>
                </div>
              </div>

              {/* Message Textarea */}
              <div className="form-group">
                <div className="textarea-header-flex">
                  <label className="form-label">Isi Pesan WhatsApp (Bisa Diedit):</label>
                  <span className="text-muted text-xs">Format tebal menggunakan *teks*</span>
                </div>
                <textarea
                  className="form-input wa-textarea"
                  rows={5}
                  value={waCustomMessage}
                  onChange={(e) => setWaCustomMessage(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setSelectedDebtForWA(null)}>
                Batal
              </button>
              <button type="button" className="btn btn-primary btn-wa-send" onClick={handleSendWA}>
                <Send size={16} />
                <span>Buka Aplikasi WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 3: Pembayaran & Cicilan Kasbon */}
      {selectedDebtForPay && (
        <div className="modal-overlay" onClick={() => setSelectedDebtForPay(null)}>
          <div className="modal-content payment-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title-flex">
                <Coins size={22} className="text-emerald" />
                <div>
                  <h3>Catat Pembayaran Kasbon</h3>
                  <p className="text-muted text-xs">
                    {selectedDebtForPay.type === 'piutang' ? 'Terima pelunasan/cicilan dari' : 'Bayar ke'} {selectedDebtForPay.personName}
                  </p>
                </div>
              </div>
              <button className="icon-btn" onClick={() => setSelectedDebtForPay(null)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleProcessPayment}>
              <div className="modal-body">
                {/* Outstanding Balance Banner */}
                <div className="pay-balance-banner">
                  <span className="text-muted text-xs">Sisa Tagihan Saat Ini:</span>
                  <div className="pay-balance-val text-emerald">{formatRupiah(selectedDebtForPay.amount)}</div>
                  {selectedDebtForPay.originalAmount && selectedDebtForPay.originalAmount > selectedDebtForPay.amount && (
                    <span className="text-muted text-xs">
                      (Total awal: {formatRupiah(selectedDebtForPay.originalAmount)})
                    </span>
                  )}
                </div>

                {/* Mode: Pelunasan Penuh vs Cicil */}
                <div className="tx-type-toggle">
                  <button
                    type="button"
                    className={`type-btn ${paymentMode === 'full' ? 'active in-btn' : ''}`}
                    onClick={() => {
                      setPaymentMode('full');
                      setPaymentAmount(selectedDebtForPay.amount);
                    }}
                  >
                    Lunasi Penuh ({formatRupiah(selectedDebtForPay.amount)})
                  </button>
                  <button
                    type="button"
                    className={`type-btn ${paymentMode === 'partial' ? 'active out-btn' : ''}`}
                    onClick={() => {
                      setPaymentMode('partial');
                      setPaymentAmount(Math.round(selectedDebtForPay.amount / 2));
                    }}
                  >
                    Bayar Cicilan / Sebagian
                  </button>
                </div>

                {/* Partial Payment Amount Input */}
                {paymentMode === 'partial' && (
                  <div className="form-group">
                    <label className="form-label">Nominal Cicilan Dibayar (Rp)</label>
                    <div className="amount-input-container">
                      <span className="currency-prefix">Rp</span>
                      <input
                        type="text"
                        className="amount-input-big"
                        value={paymentAmount > 0 ? paymentAmount.toLocaleString('id-ID') : ''}
                        onChange={(e) => {
                          const num = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10) || 0;
                          setPaymentAmount(Math.min(num, selectedDebtForPay.amount));
                        }}
                        required
                      />
                    </div>
                    <div className="quick-partial-pills">
                      <button 
                        type="button" 
                        className="btn-quick-pill"
                        onClick={() => setPaymentAmount(Math.round(selectedDebtForPay.amount * 0.25))}
                      >
                        25%
                      </button>
                      <button 
                        type="button" 
                        className="btn-quick-pill"
                        onClick={() => setPaymentAmount(Math.round(selectedDebtForPay.amount * 0.5))}
                      >
                        50%
                      </button>
                      <button 
                        type="button" 
                        className="btn-quick-pill"
                        onClick={() => setPaymentAmount(50000)}
                      >
                        50rb
                      </button>
                      <button 
                        type="button" 
                        className="btn-quick-pill"
                        onClick={() => setPaymentAmount(100000)}
                      >
                        100rb
                      </button>
                    </div>
                    <div className="remaining-calc text-xs">
                      Sisa tagihan setelah pembayaran: <strong>{formatRupiah(Math.max(0, selectedDebtForPay.amount - paymentAmount))}</strong>
                    </div>
                  </div>
                )}

                {/* Payment Method */}
                <div className="form-group">
                  <label className="form-label">Metode Pembayaran</label>
                  <div className="payment-method-selector">
                    <button
                      type="button"
                      className={`method-option-btn ${paymentMethod === 'cash' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <Coins size={16} />
                      <span>Tunai (Kas Laci)</span>
                    </button>
                    <button
                      type="button"
                      className={`method-option-btn ${paymentMethod === 'qris' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('qris')}
                    >
                      <CreditCard size={16} />
                      <span>QRIS Kedai</span>
                    </button>
                    <button
                      type="button"
                      className={`method-option-btn ${paymentMethod === 'transfer' ? 'active' : ''}`}
                      onClick={() => setPaymentMethod('transfer')}
                    >
                      <RotateCcw size={16} />
                      <span>Transfer Bank</span>
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div className="form-group">
                  <label className="form-label">Catatan Tambahan (Opsional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Contoh: Titip uang lewat Mas Joko / transfer BCA"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedDebtForPay(null)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} />
                  <span>Proses {paymentMode === 'full' ? 'Pelunasan Lunas' : 'Pembayaran Cicilan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
