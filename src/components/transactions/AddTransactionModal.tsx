import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { logActivity } from '../../db/logger';
import { Category, PaymentMethod, TransactionType } from '../../types';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Coins, 
  CreditCard, 
  Check, 
  Sparkles,
  Utensils,
  Package,
  Droplets,
  Flame,
  Users,
  Store,
  Zap,
  ShoppingBag,
  Wallet,
  Tag
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const AddTransactionModal: React.FC = () => {
  const { 
    isAddTxOpen, 
    setIsAddTxOpen, 
    activeStore, 
    activeTenant, 
    role, 
    currentActorName,
    activeShift,
    refreshAllData,
    setIsCategoryModalOpen
  } = useApp();

  const [type, setType] = useState<TransactionType>('in');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amount, setAmount] = useState<number>(0);
  const [amountInput, setAmountInput] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadCategories = async () => {
      const cats = await db.categories.where('type').equals(type).toArray();
      setCategories(cats);
      if (cats.length > 0) {
        setCategoryId(cats[0].id);
      }
    };
    loadCategories();
  }, [type]);

  if (!isAddTxOpen) return null;

  const handleQuickAdd = (val: number) => {
    const newAmount = (amount || 0) + val;
    setAmount(newAmount);
    setAmountInput(newAmount.toString());
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = parseInt(rawVal, 10) || 0;
    setAmount(num);
    setAmountInput(num > 0 ? num.toString() : '');
  };

  const handleClose = () => {
    setIsAddTxOpen(false);
    setAmount(0);
    setAmountInput('');
    setDescription('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore || !activeTenant) {
      alert('Toko atau bisnis belum dipilih!');
      return;
    }

    if (amount <= 0) {
      alert('Silakan masukkan nominal transaksi yang valid!');
      return;
    }

    setSubmitting(true);
    try {
      const selectedCategory = categories.find(c => c.id === categoryId);
      const categoryName = selectedCategory ? selectedCategory.name : 'Lain-lain';

      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toTimeString().substring(0, 5);

      const newTxId = 'tx_' + Date.now();
      await db.transactions.add({
        id: newTxId,
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        type,
        amount,
        paymentMethod,
        categoryId: categoryId || 'cat_other',
        categoryName,
        description: description.trim() || categoryName,
        date: dateStr,
        time: timeStr,
        createdByRole: role,
        createdByName: currentActorName,
        shiftId: activeShift?.id,
        createdAt: now.toISOString(),
      });

      // Log to Audit Log (Anti-fraud)
      await logActivity({
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        storeName: `${activeStore.name} - ${activeStore.branchName}`,
        actorRole: role,
        actorName: currentActorName,
        actionType: 'TRANSACTION_ADD',
        description: `Mencatat ${type === 'in' ? 'pemasukan' : 'pengeluaran'} sebesar Rp ${amount.toLocaleString('id-ID')} (${paymentMethod.toUpperCase()}) - ${description || categoryName}`,
        metadata: {
          txId: newTxId,
          type,
          amount,
          paymentMethod,
          categoryName,
        }
      });

      // Quick mini confetti for positive feedback
      confetti({
        particleCount: 25,
        spread: 40,
        origin: { y: 0.8 },
        colors: type === 'in' ? ['#10b981', '#34d399', '#f59e0b'] : ['#f43f5e', '#fb7185', '#cbd5e1'],
      });

      await refreshAllData();
      handleClose();
    } catch (err) {
      console.error(err);
      alert('Terjadi kesalahan saat menyimpan transaksi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <h3>Catat Transaksi Kas</h3>
            <span className="text-muted text-sm">{activeStore?.branchName}</span>
          </div>
          <button className="icon-btn" onClick={handleClose} aria-label="Tutup Modal">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* 1. Type Switcher: Pemasukan vs Pengeluaran */}
            <div className="tx-type-toggle">
              <button
                type="button"
                className={`type-btn in-btn ${type === 'in' ? 'active' : ''}`}
                onClick={() => setType('in')}
              >
                <ArrowDownLeft size={18} />
                <span>+ Uang Masuk (Omset)</span>
              </button>

              <button
                type="button"
                className={`type-btn out-btn ${type === 'out' ? 'active' : ''}`}
                onClick={() => setType('out')}
              >
                <ArrowUpRight size={18} />
                <span>- Uang Keluar (Belanja)</span>
              </button>
            </div>

            {/* 2. Amount Input with tactile chips */}
            <div className="amount-input-container">
              <span className="currency-prefix">Rp</span>
              <input
                type="text"
                className="amount-input-big"
                placeholder="0"
                value={amount > 0 ? amount.toLocaleString('id-ID') : ''}
                onChange={handleAmountChange}
                autoFocus
              />
              {amount > 0 && (
                <button
                  type="button"
                  className="clear-amount-btn"
                  onClick={() => {
                    setAmount(0);
                    setAmountInput('');
                  }}
                  title="Hapus nominal"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Quick Amount Chips */}
            <div className="quick-chips-row">
              <button type="button" className="chip-btn" onClick={() => handleQuickAdd(5000)}>+5rb</button>
              <button type="button" className="chip-btn" onClick={() => handleQuickAdd(10000)}>+10rb</button>
              <button type="button" className="chip-btn" onClick={() => handleQuickAdd(20000)}>+20rb</button>
              <button type="button" className="chip-btn" onClick={() => handleQuickAdd(50000)}>+50rb</button>
              <button type="button" className="chip-btn" onClick={() => handleQuickAdd(100000)}>+100rb</button>
            </div>

            {/* 3. Payment Method: Tunai vs QRIS */}
            <div className="form-group">
              <label className="form-label">Metode Pembayaran</label>
              <div className="payment-method-selector">
                <button
                  type="button"
                  className={`pm-btn ${paymentMethod === 'cash' ? 'active cash' : ''}`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <Coins size={18} />
                  <div>
                    <span className="pm-title">Uang Tunai</span>
                    <span className="pm-desc">Masuk Laci Kasir</span>
                  </div>
                </button>

                <button
                  type="button"
                  className={`pm-btn ${paymentMethod === 'qris' ? 'active qris' : ''}`}
                  onClick={() => setPaymentMethod('qris')}
                >
                  <CreditCard size={18} />
                  <div>
                    <span className="pm-title">QRIS / Transfer</span>
                    <span className="pm-desc">Masuk Rekening Bank</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 4. Category Selection */}
            <div className="form-group">
              <div className="cat-section-header-flex">
                <label className="form-label" style={{ marginBottom: 0 }}>
                  Kategori {type === 'in' ? 'Pemasukan' : 'Pengeluaran'}
                </label>
                {role === 'owner' && (
                  <button
                    type="button"
                    className="btn-manage-cat-link text-xs"
                    onClick={() => setIsCategoryModalOpen(true)}
                  >
                    <Tag size={12} />
                    <span>+ Kelola Kategori</span>
                  </button>
                )}
              </div>
              <div className="categories-chips-grid">
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    className={`cat-chip ${categoryId === cat.id ? 'active' : ''}`}
                    onClick={() => setCategoryId(cat.id)}
                    style={{
                      borderColor: categoryId === cat.id ? cat.color : undefined,
                      backgroundColor: categoryId === cat.id ? `${cat.color}22` : undefined,
                      color: categoryId === cat.id ? cat.color : undefined,
                    }}
                  >
                    <span className="cat-dot" style={{ backgroundColor: cat.color }}></span>
                    <span className="cat-name">{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Note / Description */}
            <div className="form-group">
              <label className="form-label">Catatan Transaksi (Opsional)</label>
              <input
                type="text"
                className="form-input"
                placeholder={type === 'in' ? 'Misal: 10 porsi Mie Ayam + 5 Es Teh' : 'Misal: Beli telur 2 krat di Pasar Besar'}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={handleClose}>
              Batal
            </button>
            <button 
              type="submit" 
              className={`btn ${type === 'in' ? 'btn-primary' : 'btn-danger'} flex-1`}
              disabled={submitting || amount <= 0}
            >
              <Check size={18} />
              <span>Simpan {type === 'in' ? 'Pemasukan' : 'Pengeluaran'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
