import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { logActivity } from '../../db/logger';
import { Debt } from '../../types';
import { 
  BookOpen, 
  Plus, 
  CheckCircle2, 
  Clock, 
  MessageCircle, 
  Phone, 
  User, 
  Trash2, 
  AlertCircle,
  X,
  Coins
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const DebtListView: React.FC = () => {
  const { 
    activeStore, 
    activeTenant, 
    role, 
    currentActorName, 
    refreshAllData 
  } = useApp();

  const [debts, setDebts] = useState<Debt[]>([]);
  const [activeType, setActiveType] = useState<'all' | 'piutang' | 'utang'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // New Debt Form
  const [personName, setPersonName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState<'piutang' | 'utang'>('piutang');
  const [amount, setAmount] = useState<number>(0);
  const [amountInput, setAmountInput] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');

  const loadDebts = async () => {
    if (!activeStore) return;
    const items = await db.debts
      .where('storeId')
      .equals(activeStore.id)
      .reverse()
      .sortBy('createdAt');
    setDebts(items);
  };

  useEffect(() => {
    loadDebts();
  }, [activeStore]);

  const handleAddDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore || !activeTenant || amount <= 0 || !personName.trim()) {
      alert('Lengkapi nama dan nominal dengan benar!');
      return;
    }

    const newId = 'debt_' + Date.now();
    await db.debts.add({
      id: newId,
      tenantId: activeTenant.id,
      storeId: activeStore.id,
      personName: personName.trim(),
      phone: phone.trim(),
      type,
      amount,
      dueDate: dueDate || new Date().toISOString().split('T')[0],
      status: 'unpaid',
      description: description.trim(),
      createdAt: new Date().toISOString(),
    });

    await logActivity({
      tenantId: activeTenant.id,
      storeId: activeStore.id,
      storeName: `${activeStore.name} - ${activeStore.branchName}`,
      actorRole: role,
      actorName: currentActorName,
      actionType: 'DEBT_ADD',
      description: `Mencatat ${type === 'piutang' ? 'bon/kasbon pelanggan' : 'utang supplier'} atas nama ${personName} senilai Rp ${amount.toLocaleString('id-ID')}`,
      metadata: { personName, amount, type }
    });

    setIsAddModalOpen(false);
    setPersonName('');
    setPhone('');
    setAmount(0);
    setAmountInput('');
    setDescription('');
    await loadDebts();
  };

  const handleMarkPaid = async (debt: Debt) => {
    const confirm = window.confirm(`Tandai ${debt.type === 'piutang' ? 'bon pelanggan' : 'utang'} dari "${debt.personName}" sebesar Rp ${debt.amount.toLocaleString('id-ID')} sebagai LUNAS?`);
    if (!confirm) return;

    await db.debts.update(debt.id, {
      status: 'paid',
      paidAt: new Date().toISOString(),
    });

    // Otomatis masukkan ke transaksi kas masuk/keluar
    const now = new Date();
    await db.transactions.add({
      id: 'tx_debt_' + Date.now(),
      tenantId: debt.tenantId,
      storeId: debt.storeId,
      type: debt.type === 'piutang' ? 'in' : 'out',
      amount: debt.amount,
      paymentMethod: 'cash',
      categoryId: debt.type === 'piutang' ? 'cat_in_sales' : 'cat_out_other',
      categoryName: debt.type === 'piutang' ? 'Pelunasan Bon Pelanggan' : 'Pelunasan Utang Supplier',
      description: `Pelunasan ${debt.type} - ${debt.personName} (${debt.description})`,
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().substring(0, 5),
      createdByRole: role,
      createdByName: currentActorName,
      createdAt: now.toISOString(),
    });

    await logActivity({
      tenantId: activeTenant?.id,
      storeId: activeStore?.id,
      storeName: `${activeStore?.name} - ${activeStore?.branchName}`,
      actorRole: role,
      actorName: currentActorName,
      actionType: 'DEBT_PAY',
      description: `Pelunasan LUNAS ${debt.type} sebesar Rp ${debt.amount.toLocaleString('id-ID')} oleh ${debt.personName}`,
      metadata: { debtId: debt.id, amount: debt.amount }
    });

    confetti({
      particleCount: 30,
      spread: 60,
      origin: { y: 0.7 },
      colors: ['#10b981', '#34d399']
    });

    await refreshAllData();
    await loadDebts();
  };

  const handleDeleteDebt = async (debt: Debt) => {
    if (role === 'cashier') {
      alert('Kasir tidak diizinkan menghapus data kasbon. Silakan hubungi Pemilik.');
      return;
    }
    if (!window.confirm('Hapus catatan bon ini?')) return;
    await db.debts.delete(debt.id);
    await loadDebts();
  };

  const sendWhatsAppReminder = (debt: Debt) => {
    if (!debt.phone) {
      alert('Nomor WhatsApp belum dicantumkan pada catatan bon ini.');
      return;
    }
    const cleanPhone = debt.phone.replace(/[^0-9]/g, '').replace(/^0/, '62');
    const msg = `Halo Kak ${debt.personName}, sekadar mengingatkan catatan bon belanja di *${activeStore?.name}* sebesar *Rp ${debt.amount.toLocaleString('id-ID')}* (${debt.description}). Terima kasih banyak ya Kak! 🙏`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const filteredDebts = debts.filter(d => activeType === 'all' || d.type === activeType);
  const totalUnpaidPiutang = debts.filter(d => d.type === 'piutang' && d.status === 'unpaid').reduce((s, d) => s + d.amount, 0);
  const totalUnpaidUtang = debts.filter(d => d.type === 'utang' && d.status === 'unpaid').reduce((s, d) => s + d.amount, 0);

  const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

  return (
    <div className="debt-page-container">
      {/* Header */}
      <div className="page-header-flex">
        <div>
          <h2>Buku Kasbon & Utang</h2>
          <p className="text-muted text-sm">
            {activeStore?.branchName} • Kelola bon pelanggan dan tagihan supplier
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>
          <Plus size={18} />
          <span>Tambah Bon Baru</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="debt-summary-grid">
        <div className="card">
          <span className="stat-label">Piutang Kedai (Pelanggan Ngutang)</span>
          <div className="stat-value text-amber">{formatRupiah(totalUnpaidPiutang)}</div>
          <span className="text-muted text-xs">Uang Anda yang belum dibayar pembeli</span>
        </div>

        <div className="card">
          <span className="stat-label">Utang Kedai (Ke Supplier/Pihak Luar)</span>
          <div className="stat-value text-rose">{formatRupiah(totalUnpaidUtang)}</div>
          <span className="text-muted text-xs">Kewajiban bayar belanja bahan bertempo</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="btn-group">
        <button
          className={`filter-btn ${activeType === 'all' ? 'active' : ''}`}
          onClick={() => setActiveType('all')}
        >
          Semua ({debts.length})
        </button>
        <button
          className={`filter-btn ${activeType === 'piutang' ? 'active' : ''}`}
          onClick={() => setActiveType('piutang')}
        >
          Piutang Pelanggan ({debts.filter(d => d.type === 'piutang').length})
        </button>
        <button
          className={`filter-btn ${activeType === 'utang' ? 'active' : ''}`}
          onClick={() => setActiveType('utang')}
        >
          Utang Supplier ({debts.filter(d => d.type === 'utang').length})
        </button>
      </div>

      {/* Debt List */}
      <div className="debt-list-grid">
        {filteredDebts.length === 0 ? (
          <div className="card empty-state">
            <BookOpen size={36} className="text-muted" style={{ margin: '0 auto 0.5rem auto' }} />
            <p className="text-muted">Belum ada catatan bon atau kasbon.</p>
          </div>
        ) : (
          filteredDebts.map((debt) => (
            <div key={debt.id} className={`card debt-item-card ${debt.status === 'paid' ? 'paid-card' : ''}`}>
              <div className="debt-card-header">
                <div>
                  <span className={`badge ${debt.type === 'piutang' ? 'badge-amber' : 'badge-rose'}`}>
                    {debt.type === 'piutang' ? 'Bon Pelanggan' : 'Utang Supplier'}
                  </span>
                  <h4 className="debt-person-name">{debt.personName}</h4>
                  {debt.phone && (
                    <span className="debt-phone text-muted text-xs">
                      <Phone size={11} /> {debt.phone}
                    </span>
                  )}
                </div>

                <div className="debt-amount-wrap">
                  <span className="debt-amount-val">{formatRupiah(debt.amount)}</span>
                  <span className={`badge ${debt.status === 'paid' ? 'badge-emerald' : 'badge-amber'}`}>
                    {debt.status === 'paid' ? 'Lunas' : 'Belum Lunas'}
                  </span>
                </div>
              </div>

              {debt.description && (
                <p className="debt-desc-text">"{debt.description}"</p>
              )}

              <div className="debt-card-footer">
                <span className="text-muted text-xs">
                  Jatuh Tempo: {debt.dueDate}
                </span>

                <div className="debt-actions">
                  {debt.status === 'unpaid' && debt.type === 'piutang' && debt.phone && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => sendWhatsAppReminder(debt)}
                      title="Kirim Pesan Tagihan WA"
                    >
                      <MessageCircle size={14} className="text-emerald" />
                      <span>Tagih WA</span>
                    </button>
                  )}

                  {debt.status === 'unpaid' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleMarkPaid(debt)}
                    >
                      <CheckCircle2 size={14} />
                      <span>Tandai Lunas</span>
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
          ))
        )}
      </div>

      {/* Modal Tambah Bon */}
      {isAddModalOpen && (
        <div className="modal-overlay" onClick={() => setIsAddModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Catat Bon Baru</h3>
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
                  <label className="form-label">Nominal Bon</label>
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
                  <label className="form-label">Catatan Bon</label>
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
    </div>
  );
};
