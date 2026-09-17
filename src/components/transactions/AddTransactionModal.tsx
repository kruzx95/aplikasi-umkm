import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { logActivity } from '../../db/logger';
import { Category, PaymentMethod, TransactionType, SalesChannel, RawMaterial } from '../../types';
import { 
  X, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Coins, 
  CreditCard, 
  Check, 
  Smartphone,
  Layers,
  Percent,
  Tag,
  Store,
  Info
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
  const [channel, setChannel] = useState<SalesChannel>('offline');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [amount, setAmount] = useState<number>(0);
  const [amountInput, setAmountInput] = useState<string>('');
  const [commissionRate, setCommissionRate] = useState<number>(20); // Default 20% utk GoFood/ShopeeFood
  const [orderId, setOrderId] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Link Bahan Baku Mentah State (Khusus Pengeluaran Belanja)
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [linkRawMaterial, setLinkRawMaterial] = useState<boolean>(false);
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState<string>('');
  const [qtyToAdd, setQtyToAdd] = useState<number>(1);

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

  // Load raw materials when store is active
  useEffect(() => {
    const loadRawMaterials = async () => {
      if (!activeStore) return;
      const materials = await db.raw_materials.where('storeId').equals(activeStore.id).toArray();
      setRawMaterials(materials);
      if (materials.length > 0 && !selectedRawMaterialId) {
        setSelectedRawMaterialId(materials[0].id);
      }
    };
    if (isAddTxOpen) {
      loadRawMaterials();
    }
  }, [isAddTxOpen, activeStore]);

  // Auto suggest linking raw material when category contains 'bahan' or 'minyak' or 'kemasan'
  useEffect(() => {
    if (type === 'out') {
      const selectedCat = categories.find(c => c.id === categoryId);
      if (selectedCat && (
        selectedCat.id.includes('bahan') || 
        selectedCat.id.includes('minyak') || 
        selectedCat.id.includes('kemasan') ||
        selectedCat.name.toLowerCase().includes('bahan')
      )) {
        setLinkRawMaterial(true);
      }
    } else {
      setLinkRawMaterial(false);
    }
  }, [categoryId, type, categories]);

  if (!isAddTxOpen) return null;

  // Kalkulasi Otomatis Komisi Online Food
  const isOnlineChannel = channel !== 'offline';
  const commissionAmount = isOnlineChannel ? Math.round((amount * commissionRate) / 100) : 0;
  const netIncomeAmount = isOnlineChannel ? amount - commissionAmount : amount;

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
    setOrderId('');
    setChannel('offline');
    setPaymentMethod('cash');
    setLinkRawMaterial(false);
    setQtyToAdd(1);
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

      // Penyesuaian jika online food
      const finalAmount = isOnlineChannel ? netIncomeAmount : amount;
      const finalPaymentMethod: PaymentMethod = isOnlineChannel ? 'transfer' : paymentMethod;
      const finalSettlementStatus = isOnlineChannel ? 'pending' : 'settled';

      let autoDesc = description.trim();
      if (!autoDesc) {
        if (isOnlineChannel) {
          const channelName = channel === 'gofood' ? 'GoFood' : channel === 'shopeefood' ? 'ShopeeFood' : 'GrabFood';
          autoDesc = `${channelName} Pesan Antar ${orderId ? '| ' + orderId : ''}`.trim();
        } else {
          autoDesc = categoryName;
        }
      }

      await db.transactions.add({
        id: newTxId,
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        type,
        amount: finalAmount, // Uang riil yang masuk ke kas/buku kas
        paymentMethod: finalPaymentMethod,
        categoryId: categoryId || 'cat_other',
        categoryName,
        description: autoDesc,
        date: dateStr,
        time: timeStr,
        createdByRole: role,
        createdByName: currentActorName,
        shiftId: activeShift?.id,
        createdAt: now.toISOString(),
        channel,
        grossAmount: isOnlineChannel ? amount : undefined,
        commissionRate: isOnlineChannel ? commissionRate : undefined,
        commissionAmount: isOnlineChannel ? commissionAmount : undefined,
        netAmount: isOnlineChannel ? netIncomeAmount : undefined,
        settlementStatus: finalSettlementStatus,
        externalOrderId: orderId.trim() || undefined,
        rawMaterialId: linkRawMaterial && selectedRawMaterialId ? selectedRawMaterialId : undefined,
        rawMaterialQtyAdded: linkRawMaterial && qtyToAdd > 0 ? qtyToAdd : undefined,
      });

      // Update Stok Bahan Baku jika ditautkan saat belanja kas keluar
      if (type === 'out' && linkRawMaterial && selectedRawMaterialId && qtyToAdd > 0) {
        const targetMat = await db.raw_materials.get(selectedRawMaterialId);
        if (targetMat) {
          const updatedStock = (targetMat.currentStock || 0) + qtyToAdd;
          await db.raw_materials.update(selectedRawMaterialId, {
            currentStock: updatedStock,
            lastRestockedAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });

          await logActivity({
            tenantId: activeTenant.id,
            storeId: activeStore.id,
            storeName: `${activeStore.name} - ${activeStore.branchName}`,
            actorRole: role,
            actorName: currentActorName,
            actionType: 'RAW_MATERIAL_RESTOCK',
            description: `Restock bahan ${targetMat.name} +${qtyToAdd} ${targetMat.unit} via belanja kas keluar Rp ${amount.toLocaleString('id-ID')}`,
            metadata: {
              rawMaterialId: selectedRawMaterialId,
              addedQty: qtyToAdd,
              previousStock: targetMat.currentStock,
              newStock: updatedStock,
            }
          });
        }
      }

      // Log ke Audit Log
      await logActivity({
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        storeName: `${activeStore.name} - ${activeStore.branchName}`,
        actorRole: role,
        actorName: currentActorName,
        actionType: isOnlineChannel ? 'ONLINE_FOOD_ADD' : 'TRANSACTION_ADD',
        description: isOnlineChannel 
          ? `Mencatat pesanan ${channel.toUpperCase()} kotor Rp ${amount.toLocaleString('id-ID')} (Potongan komisi ${commissionRate}%: -Rp ${commissionAmount.toLocaleString('id-ID')}, Bersih: Rp ${netIncomeAmount.toLocaleString('id-ID')}) - ${orderId || 'Tanpa No Order'}`
          : `Mencatat ${type === 'in' ? 'pemasukan' : 'pengeluaran'} Rp ${amount.toLocaleString('id-ID')} (${paymentMethod.toUpperCase()}) - ${autoDesc}`,
        metadata: {
          txId: newTxId,
          type,
          channel,
          amount: finalAmount,
          grossAmount: isOnlineChannel ? amount : undefined,
          commissionAmount: isOnlineChannel ? commissionAmount : undefined,
          paymentMethod: finalPaymentMethod,
          categoryName,
        }
      });

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

  const selectedMaterialObj = rawMaterials.find(m => m.id === selectedRawMaterialId);

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <h3>Catat Transaksi Kas</h3>
            <span className="text-muted text-sm">{activeStore?.name} • {activeStore?.branchName}</span>
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
                onClick={() => {
                  setType('in');
                }}
              >
                <ArrowDownLeft size={18} />
                <span>+ Uang Masuk (Omset)</span>
              </button>

              <button
                type="button"
                className={`type-btn out-btn ${type === 'out' ? 'active' : ''}`}
                onClick={() => {
                  setType('out');
                  setChannel('offline');
                }}
              >
                <ArrowUpRight size={18} />
                <span>- Uang Keluar (Belanja)</span>
              </button>
            </div>

            {/* 2. Channel Selection (Khusus Pemasukan) */}
            {type === 'in' && (
              <div className="form-group">
                <label className="form-label">Kanal / Sumber Penjualan</label>
                <div className="channel-selector-grid">
                  <button
                    type="button"
                    className={`channel-card ${channel === 'offline' ? 'active offline' : ''}`}
                    onClick={() => setChannel('offline')}
                  >
                    <div className="channel-icon-wrap">
                      <Store size={18} />
                    </div>
                    <div className="channel-info">
                      <strong>Kasir Offline</strong>
                      <span>Dine In / Kas Fisik</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`channel-card ${channel === 'gofood' ? 'active gofood' : ''}`}
                    onClick={() => {
                      setChannel('gofood');
                      setCommissionRate(20);
                    }}
                  >
                    <div className="channel-icon-wrap bg-gofood">
                      <Smartphone size={18} />
                    </div>
                    <div className="channel-info">
                      <strong>GoFood</strong>
                      <span>Komisi 20%</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`channel-card ${channel === 'shopeefood' ? 'active shopeefood' : ''}`}
                    onClick={() => {
                      setChannel('shopeefood');
                      setCommissionRate(20);
                    }}
                  >
                    <div className="channel-icon-wrap bg-shopeefood">
                      <Smartphone size={18} />
                    </div>
                    <div className="channel-info">
                      <strong>ShopeeFood</strong>
                      <span>Komisi 20%</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    className={`channel-card ${channel === 'grabfood' ? 'active grabfood' : ''}`}
                    onClick={() => {
                      setChannel('grabfood');
                      setCommissionRate(20);
                    }}
                  >
                    <div className="channel-icon-wrap bg-grabfood">
                      <Smartphone size={18} />
                    </div>
                    <div className="channel-info">
                      <strong>GrabFood</strong>
                      <span>Komisi 20%</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 3. Amount Input */}
            <div className="amount-section-wrap">
              <label className="form-label">
                {isOnlineChannel ? 'Penjualan Kotor Aplikasi (Gross Sales)' : 'Nominal Transaksi'}
              </label>
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
            </div>

            {/* 4. Smart Commission Calculator Card (Khusus Online Food) */}
            {isOnlineChannel && (
              <div className="online-food-calc-card">
                <div className="calc-header">
                  <div className="calc-title">
                    <Percent size={16} className="text-amber" />
                    <span>Rincian Pembagian & Komisi Platform</span>
                  </div>
                  <div className="commission-rate-picker">
                    <label className="text-xs text-muted">Komisi:</label>
                    <div className="rate-chips">
                      {[15, 20, 25].map(rate => (
                        <button
                          key={rate}
                          type="button"
                          className={`rate-chip ${commissionRate === rate ? 'active' : ''}`}
                          onClick={() => setCommissionRate(rate)}
                        >
                          {rate}%
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="calc-breakdown-grid">
                  <div className="calc-stat-box">
                    <span className="stat-label">Penjualan Kotor</span>
                    <strong className="stat-val">Rp {amount.toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="calc-stat-box text-danger">
                    <span className="stat-label">Biaya Komisi ({commissionRate}%)</span>
                    <strong className="stat-val">-Rp {commissionAmount.toLocaleString('id-ID')}</strong>
                  </div>
                  <div className="calc-stat-box text-emerald highlight-box">
                    <span className="stat-label">Pendapatan Bersih Kedai</span>
                    <strong className="stat-val">=Rp {netIncomeAmount.toLocaleString('id-ID')}</strong>
                  </div>
                </div>

                <div className="calc-pending-badge">
                  <Info size={14} />
                  <span>Pendapatan bersih <strong>Rp {netIncomeAmount.toLocaleString('id-ID')}</strong> akan ditampung di <strong>Saldo Menunggu Pencairan</strong> ke rekening bank.</span>
                </div>

                {/* External Order ID */}
                <div className="form-group" style={{ marginTop: '0.75rem', marginBottom: 0 }}>
                  <label className="form-label text-xs">Nomor Pesanan / Struk Aplikasi (Opsional)</label>
                  <input
                    type="text"
                    className="form-input form-input-sm"
                    placeholder="Contoh: F-3358527824 atau SPF-88910"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* 5. Payment Method (Khusus Offline) */}
            {channel === 'offline' && (
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
                      <span className="pm-title">QRIS / Bank</span>
                      <span className="pm-desc">Rekening Toko</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* 6. Link to Raw Material (Khusus Pengeluaran Kas Belanja) */}
            {type === 'out' && (
              <div className="raw-material-link-section">
                <label className="toggle-material-label">
                  <input
                    type="checkbox"
                    checked={linkRawMaterial}
                    onChange={(e) => setLinkRawMaterial(e.target.checked)}
                  />
                  <Layers size={16} className="text-emerald" />
                  <span>Tautkan ke Stok Bahan Baku (Otomatis Tambah Stok)</span>
                </label>

                {linkRawMaterial && (
                  <div className="material-link-inputs">
                    <div className="form-group-flex">
                      <div className="flex-1">
                        <label className="form-label text-xs">Pilih Bahan Baku yang Dibelanjakan</label>
                        <select
                          className="form-input form-input-sm"
                          value={selectedRawMaterialId}
                          onChange={(e) => setSelectedRawMaterialId(e.target.value)}
                        >
                          {rawMaterials.map(mat => (
                            <option key={mat.id} value={mat.id}>
                              {mat.name} (Sisa: {mat.currentStock} {mat.unit})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div style={{ width: '110px' }}>
                        <label className="form-label text-xs">Tambah ({selectedMaterialObj?.unit || 'unit'})</label>
                        <input
                          type="number"
                          min="0.1"
                          step="any"
                          className="form-input form-input-sm"
                          value={qtyToAdd}
                          onChange={(e) => setQtyToAdd(parseFloat(e.target.value) || 0)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted" style={{ marginTop: '0.35rem' }}>
                      💡 Belanja Rp {amount.toLocaleString('id-ID')} akan menambah stok <strong>{selectedMaterialObj?.name}</strong> sebesar <strong>+{qtyToAdd} {selectedMaterialObj?.unit}</strong>.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* 7. Category Selection */}
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

            {/* 8. Note / Description */}
            <div className="form-group">
              <label className="form-label">Catatan Tambahan (Opsional)</label>
              <input
                type="text"
                className="form-input"
                placeholder={type === 'in' ? 'Misal: 2 Martabak Manis Keju Coklat' : 'Misal: Beli bahan pasar pagi'}
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
              <span>Simpan {type === 'in' ? (isOnlineChannel ? `Pesanan ${channel.toUpperCase()}` : 'Pemasukan') : 'Pengeluaran'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

