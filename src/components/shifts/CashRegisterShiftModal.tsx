import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { logActivity } from '../../db/logger';
import { Shift } from '../../types';
import { 
  X, 
  CircleDollarSign, 
  CheckCircle2, 
  AlertTriangle, 
  Coins, 
  Calculator, 
  ArrowRight,
  Clock,
  UserCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';

export const CashRegisterShiftModal: React.FC = () => {
  const { 
    isShiftModalOpen, 
    setIsShiftModalOpen, 
    activeStore, 
    activeTenant, 
    role, 
    currentActorName,
    activeShift,
    refreshActiveShift,
    refreshAllData 
  } = useApp();

  // Open Shift Form State
  const [cashierName, setCashierName] = useState(currentActorName);
  const [startCashInput, setStartCashInput] = useState('150000');
  const [shiftNotes, setShiftNotes] = useState('');

  // Close Shift Calculation State
  const [cashIncome, setCashIncome] = useState(0);
  const [cashExpense, setCashExpense] = useState(0);
  const [actualCashInput, setActualCashInput] = useState('');
  const [closeNotes, setCloseNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Denominations calculator toggle
  const [showDenomCalc, setShowDenomCalc] = useState(false);
  const [denoms, setDenoms] = useState<Record<number, number>>({
    100000: 0,
    50000: 0,
    20000: 0,
    10000: 0,
    5000: 0,
    2000: 0,
    1000: 0,
  });

  // Calculate live shift cash transactions
  useEffect(() => {
    const calculateShiftData = async () => {
      if (!activeStore || !activeShift) return;

      const txs = await db.transactions
        .where('storeId')
        .equals(activeStore.id)
        .toArray();

      // Transaksi yang terjadi sejak shift dibuka dan bertipe cash
      const shiftOpenTime = new Date(activeShift.openedAt).getTime();
      const currentShiftTxs = txs.filter(t => {
        const txTime = new Date(t.createdAt).getTime();
        return txTime >= shiftOpenTime && t.paymentMethod === 'cash';
      });

      const inSum = currentShiftTxs.filter(t => t.type === 'in').reduce((s, t) => s + t.amount, 0);
      const outSum = currentShiftTxs.filter(t => t.type === 'out').reduce((s, t) => s + t.amount, 0);

      setCashIncome(inSum);
      setCashExpense(outSum);
    };

    if (isShiftModalOpen && activeShift) {
      calculateShiftData();
    }
  }, [isShiftModalOpen, activeShift, activeStore]);

  if (!isShiftModalOpen) return null;

  const handleClose = () => {
    setIsShiftModalOpen(false);
    setActualCashInput('');
  };

  const expectedCash = activeShift 
    ? activeShift.startCash + cashIncome - cashExpense 
    : 0;

  const actualCash = parseInt(actualCashInput.replace(/[^0-9]/g, ''), 10) || 0;
  const discrepancy = actualCash - expectedCash;

  // Handle open shift
  const handleOpenShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore || !activeTenant) return;

    const startCash = parseInt(startCashInput.replace(/[^0-9]/g, ''), 10) || 0;
    setSubmitting(true);
    try {
      const newShift: Shift = {
        id: 'shift_' + Date.now(),
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        cashierName: cashierName.trim() || currentActorName,
        startCash,
        endCashExpected: 0,
        endCashActual: 0,
        discrepancy: 0,
        openedAt: new Date().toISOString(),
        status: 'open',
        notes: shiftNotes.trim(),
      };

      await db.shifts.add(newShift);

      await logActivity({
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        storeName: `${activeStore.name} - ${activeStore.branchName}`,
        actorRole: role,
        actorName: currentActorName,
        actionType: 'SHIFT_OPEN',
        description: `Membuka shift kasir oleh ${cashierName} dengan modal awal laci Rp ${startCash.toLocaleString('id-ID')}`,
        metadata: { startCash, cashierName }
      });

      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.7 },
      });

      await refreshActiveShift();
      await refreshAllData();
      handleClose();
    } catch (err) {
      console.error(err);
      alert('Gagal membuka shift kasir.');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle close shift
  const handleCloseShift = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift || !activeStore || !activeTenant) return;

    if (!actualCashInput) {
      alert('Silakan masukkan jumlah uang fisik yang ada di laci kasir saat ini!');
      return;
    }

    setSubmitting(true);
    try {
      await db.shifts.update(activeShift.id, {
        endCashExpected: expectedCash,
        endCashActual: actualCash,
        discrepancy,
        closedAt: new Date().toISOString(),
        status: 'closed',
        notes: closeNotes.trim() || activeShift.notes,
      });

      let statusDesc = 'Cocok (Pass)';
      if (discrepancy > 0) statusDesc = `Kelebihan Rp ${discrepancy.toLocaleString('id-ID')}`;
      if (discrepancy < 0) statusDesc = `Kurang/Minus Rp ${Math.abs(discrepancy).toLocaleString('id-ID')}`;

      await logActivity({
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        storeName: `${activeStore.name} - ${activeStore.branchName}`,
        actorRole: role,
        actorName: currentActorName,
        actionType: 'SHIFT_CLOSE',
        description: `Tutup shift kasir ${activeShift.cashierName}. Fisik Laci: Rp ${actualCash.toLocaleString('id-ID')}, Seharusnya: Rp ${expectedCash.toLocaleString('id-ID')} (${statusDesc})`,
        metadata: {
          shiftId: activeShift.id,
          expectedCash,
          actualCash,
          discrepancy,
        }
      });

      if (discrepancy === 0) {
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#f59e0b']
        });
      }

      await refreshActiveShift();
      await refreshAllData();
      handleClose();
    } catch (err) {
      console.error(err);
      alert('Gagal menutup shift kasir.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDenomChange = (val: number, count: number) => {
    const next = { ...denoms, [val]: Math.max(0, count) };
    setDenoms(next);
    const total = Object.entries(next).reduce((sum, [key, cnt]) => sum + (parseInt(key, 10) * cnt), 0);
    setActualCashInput(total.toString());
  };

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-header-title">
            <h3>{activeShift ? 'Tutup Shift & Hitung Uang Laci' : 'Buka Shift Kasir Baru'}</h3>
            <span className="text-muted text-sm">{activeStore?.name} - {activeStore?.branchName}</span>
          </div>
          <button className="icon-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        {!activeShift ? (
          /* FORM BUKA SHIFT BARU */
          <form onSubmit={handleOpenShift}>
            <div className="modal-body">
              <div className="shift-banner-info">
                <CircleDollarSign size={28} className="text-emerald" />
                <p className="text-sm">
                  Masukkan modal awal uang kecil di laci (pecahan 2rb, 5rb, 10rb) untuk uang kembalian pembeli.
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Kasir yang Bertugas</label>
                <input
                  type="text"
                  className="form-input"
                  value={cashierName}
                  onChange={(e) => setCashierName(e.target.value)}
                  placeholder="Contoh: Bima / Bu Tari"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Modal Awal Laci (Uang Kembalian)</label>
                <div className="amount-input-container">
                  <span className="currency-prefix">Rp</span>
                  <input
                    type="text"
                    className="amount-input-big"
                    value={startCashInput ? parseInt(startCashInput.replace(/[^0-9]/g, '') || '0', 10).toLocaleString('id-ID') : ''}
                    onChange={(e) => setStartCashInput(e.target.value)}
                    placeholder="150.000"
                    required
                  />
                </div>
              </div>

              <div className="quick-chips-row">
                <button type="button" className="chip-btn" onClick={() => setStartCashInput('50000')}>Rp 50rb</button>
                <button type="button" className="chip-btn" onClick={() => setStartCashInput('100000')}>Rp 100rb</button>
                <button type="button" className="chip-btn" onClick={() => setStartCashInput('150000')}>Rp 150rb</button>
                <button type="button" className="chip-btn" onClick={() => setStartCashInput('200000')}>Rp 200rb</button>
              </div>

              <div className="form-group">
                <label className="form-label">Catatan Shift (Opsional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={shiftNotes}
                  onChange={(e) => setShiftNotes(e.target.value)}
                  placeholder="Misal: Shift Pagi 08:00 - 16:00"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Batal
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <UserCheck size={18} />
                <span>Buka Shift Sekarang</span>
              </button>
            </div>
          </form>
        ) : (
          /* FORM TUTUP SHIFT & REKAP KAS LACI */
          <form onSubmit={handleCloseShift}>
            <div className="modal-body">
              {/* Shift Overview Box */}
              <div className="shift-summary-box">
                <div className="shift-row">
                  <span className="text-muted">Kasir Bertugas:</span>
                  <strong>{activeShift.cashierName}</strong>
                </div>
                <div className="shift-row">
                  <span className="text-muted">Dibuka Sejak:</span>
                  <span>{new Date(activeShift.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                
                <hr className="divider" />

                <div className="shift-calc-table">
                  <div className="calc-row">
                    <span>1. Modal Awal Kasir:</span>
                    <span>Rp {activeShift.startCash.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="calc-row text-emerald">
                    <span>2. Penjualan Tunai Masuk (+):</span>
                    <span>+Rp {cashIncome.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="calc-row text-rose">
                    <span>3. Belanja Pasar Tunai (-):</span>
                    <span>-Rp {cashExpense.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="calc-row total-expected">
                    <span>Uang Fisik Seharusnya di Laci:</span>
                    <strong>Rp {expectedCash.toLocaleString('id-ID')}</strong>
                  </div>
                </div>
              </div>

              {/* Input Actual Physical Cash */}
              <div className="form-group">
                <div className="flex-between">
                  <label className="form-label">Hitung Uang Fisik Nyata di Laci</label>
                  <button 
                    type="button" 
                    className="link-btn"
                    onClick={() => setShowDenomCalc(!showDenomCalc)}
                  >
                    <Calculator size={14} />
                    <span>{showDenomCalc ? 'Tutup Hitung Lembaran' : 'Bantu Hitung Lembaran'}</span>
                  </button>
                </div>

                {showDenomCalc && (
                  <div className="denom-calc-card">
                    <p className="denom-title">Masukkan jumlah lembar/keping uang di laci:</p>
                    <div className="denom-grid">
                      {[100000, 50000, 20000, 10000, 5000, 2000, 1000].map((nominal) => (
                        <div key={nominal} className="denom-input-item">
                          <span className="denom-lbl">{nominal.toLocaleString('id-ID')} :</span>
                          <input
                            type="number"
                            min="0"
                            className="denom-field"
                            value={denoms[nominal] || ''}
                            placeholder="0"
                            onChange={(e) => handleDenomChange(nominal, parseInt(e.target.value, 10) || 0)}
                          />
                          <span className="text-muted text-xs">lbr</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="amount-input-container">
                  <span className="currency-prefix">Rp</span>
                  <input
                    type="text"
                    className="amount-input-big"
                    value={actualCash > 0 ? actualCash.toLocaleString('id-ID') : ''}
                    onChange={(e) => setActualCashInput(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
              </div>

              {/* Discrepancy Status Card */}
              {actualCashInput && (
                <div className={`discrepancy-card ${discrepancy === 0 ? 'disc-match' : discrepancy > 0 ? 'disc-over' : 'disc-under'}`}>
                  <div className="disc-header">
                    {discrepancy === 0 ? (
                      <CheckCircle2 size={20} className="text-emerald" />
                    ) : (
                      <AlertTriangle size={20} className={discrepancy > 0 ? 'text-amber' : 'text-rose'} />
                    )}
                    <strong>
                      {discrepancy === 0 && 'Kas Laci Cocok Sempurna! (Tidak ada selisih)'}
                      {discrepancy > 0 && `Kelebihan Uang Fisik: +Rp ${discrepancy.toLocaleString('id-ID')}`}
                      {discrepancy < 0 && `Kas Laci Kurang / Minus: -Rp ${Math.abs(discrepancy).toLocaleString('id-ID')}`}
                    </strong>
                  </div>
                  <p className="text-xs text-muted">
                    Hasil perbandingan ini akan dicatat ke dalam Audit Log untuk diverifikasi oleh Pemilik Toko.
                  </p>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Catatan Serah Terima / Shift</label>
                <input
                  type="text"
                  className="form-input"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Misal: Uang fisik pas, diserahkan ke kasir shift sore"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={handleClose}>
                Batal
              </button>
              <button 
                type="submit" 
                className="btn btn-danger" 
                disabled={submitting || !actualCashInput}
              >
                <span>Selesaikan & Tutup Shift Kasir</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
