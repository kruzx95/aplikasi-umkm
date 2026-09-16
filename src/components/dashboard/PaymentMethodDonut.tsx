import React, { useState } from 'react';
import { PieChart, Coins, QrCode, Building2, HelpCircle } from 'lucide-react';
import { Transaction } from '../../types';

interface PaymentMethodDonutProps {
  todayTransactions: Transaction[];
  weekTransactions: Transaction[];
}

export const PaymentMethodDonut: React.FC<PaymentMethodDonutProps> = ({
  todayTransactions,
  weekTransactions
}) => {
  const [period, setPeriod] = useState<'today' | 'week'>('today');

  const activeTxs = period === 'today' ? todayTransactions : weekTransactions;
  const incomeTxs = activeTxs.filter(t => t.type === 'in');

  // Breakdown by method
  const cashAmount = incomeTxs
    .filter(t => t.paymentMethod === 'cash')
    .reduce((sum, t) => sum + t.amount, 0);

  const qrisAmount = incomeTxs
    .filter(t => t.paymentMethod === 'qris')
    .reduce((sum, t) => sum + t.amount, 0);

  const transferAmount = incomeTxs
    .filter(t => t.paymentMethod === 'transfer')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalIncome = cashAmount + qrisAmount + transferAmount;

  const cashPct = totalIncome > 0 ? Math.round((cashAmount / totalIncome) * 100) : 0;
  const qrisPct = totalIncome > 0 ? Math.round((qrisAmount / totalIncome) * 100) : 0;
  // Make sure total percentages round to 100 if there is data
  const transferPct = totalIncome > 0 ? Math.max(0, 100 - cashPct - qrisPct) : 0;

  const cashCount = incomeTxs.filter(t => t.paymentMethod === 'cash').length;
  const qrisCount = incomeTxs.filter(t => t.paymentMethod === 'qris').length;
  const transferCount = incomeTxs.filter(t => t.paymentMethod === 'transfer').length;

  const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');
  const formatCompact = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'jt';
    if (num >= 1000) return Math.round(num / 1000) + 'rb';
    return num.toString();
  };

  // Donut SVG Math
  const radius = 56;
  const circumference = 2 * Math.PI * radius; // ~351.858

  // Slices
  const cashStroke = (cashPct / 100) * circumference;
  const qrisStroke = (qrisPct / 100) * circumference;
  const transferStroke = (transferPct / 100) * circumference;

  const cashOffset = 0;
  const qrisOffset = -cashStroke;
  const transferOffset = -(cashStroke + qrisStroke);

  return (
    <div className="card payment-donut-card">
      {/* Header */}
      <div className="donut-header">
        <div className="donut-header-title">
          <div className="icon-badge icon-badge-purple">
            <PieChart size={18} />
          </div>
          <div>
            <h3 className="donut-title">Metode Pembayaran</h3>
            <p className="donut-subtitle">Saluran Penerimaan Kas Kedai</p>
          </div>
        </div>

        {/* Period Selector (Rounded 10px button group) */}
        <div className="period-toggle-group">
          <button
            type="button"
            className={`period-toggle-btn ${period === 'today' ? 'active' : ''}`}
            onClick={() => setPeriod('today')}
          >
            Hari Ini
          </button>
          <button
            type="button"
            className={`period-toggle-btn ${period === 'week' ? 'active' : ''}`}
            onClick={() => setPeriod('week')}
          >
            7 Hari
          </button>
        </div>
      </div>

      {/* Main Donut & Legend Container */}
      <div className="donut-body">
        {/* SVG Donut Visual */}
        <div className="donut-svg-wrapper">
          <svg viewBox="0 0 160 160" className="donut-svg">
            <defs>
              <linearGradient id="cashGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="qrisGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#6366f1" />
                <stop offset="100%" stopColor="#4f46e5" />
              </linearGradient>
              <linearGradient id="transferGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="100%" stopColor="#7c3aed" />
              </linearGradient>
            </defs>

            {/* Background Ring */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              fill="transparent"
              stroke="var(--border-subtle)"
              strokeWidth="18"
            />

            {/* If there are transactions, draw slices */}
            {totalIncome > 0 ? (
              <g transform="rotate(-90 80 80)">
                {/* Cash Segment */}
                {cashAmount > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke="url(#cashGrad)"
                    strokeWidth="18"
                    strokeDasharray={`${cashStroke} ${circumference}`}
                    strokeDashoffset={cashOffset}
                    className="donut-segment"
                  />
                )}

                {/* QRIS Segment */}
                {qrisAmount > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke="url(#qrisGrad)"
                    strokeWidth="18"
                    strokeDasharray={`${qrisStroke} ${circumference}`}
                    strokeDashoffset={qrisOffset}
                    className="donut-segment"
                  />
                )}

                {/* Transfer Segment */}
                {transferAmount > 0 && (
                  <circle
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke="url(#transferGrad)"
                    strokeWidth="18"
                    strokeDasharray={`${transferStroke} ${circumference}`}
                    strokeDashoffset={transferOffset}
                    className="donut-segment"
                  />
                )}
              </g>
            ) : null}

            {/* Center Label Text */}
            <text
              x="80"
              y="74"
              textAnchor="middle"
              fontSize="9"
              fontWeight="700"
              fill="var(--text-muted)"
              letterSpacing="0.05em"
              fontFamily="system-ui, sans-serif"
            >
              TOTAL OMSET
            </text>
            <text
              x="80"
              y="93"
              textAnchor="middle"
              fontSize="12.5"
              fontWeight="800"
              fill="var(--text-primary)"
              fontFamily="system-ui, sans-serif"
            >
              {formatCompact(totalIncome)}
            </text>
          </svg>
        </div>

        {/* Legend List */}
        <div className="donut-legend-list">
          {/* Method 1: Cash */}
          <div className="donut-legend-item">
            <div className="legend-item-left">
              <div className="legend-item-icon bg-emerald-light text-emerald">
                <Coins size={14} />
              </div>
              <div className="legend-item-text">
                <div className="legend-item-label">
                  <strong>Tunai (Laci)</strong>
                  <span className="badge-pct badge-pct-emerald">{cashPct}%</span>
                </div>
                <span className="legend-item-desc">Uang fisik di kasir ({cashCount} trx)</span>
              </div>
            </div>
            <div className="legend-item-amount text-emerald">
              {formatRupiah(cashAmount)}
            </div>
          </div>

          {/* Method 2: QRIS */}
          <div className="donut-legend-item">
            <div className="legend-item-left">
              <div className="legend-item-icon bg-indigo-light text-indigo">
                <QrCode size={14} />
              </div>
              <div className="legend-item-text">
                <div className="legend-item-label">
                  <strong>QRIS Digital</strong>
                  <span className="badge-pct badge-pct-indigo">{qrisPct}%</span>
                </div>
                <span className="legend-item-desc">DANA/GoPay/BCA ({qrisCount} trx)</span>
              </div>
            </div>
            <div className="legend-item-amount text-indigo">
              {formatRupiah(qrisAmount)}
            </div>
          </div>

          {/* Method 3: Transfer Bank */}
          <div className="donut-legend-item">
            <div className="legend-item-left">
              <div className="legend-item-icon bg-purple-light text-purple">
                <Building2 size={14} />
              </div>
              <div className="legend-item-text">
                <div className="legend-item-label">
                  <strong>Transfer Bank</strong>
                  <span className="badge-pct badge-pct-purple">{transferPct}%</span>
                </div>
                <span className="legend-item-desc">Pesanan katering ({transferCount} trx)</span>
              </div>
            </div>
            <div className="legend-item-amount text-purple">
              {formatRupiah(transferAmount)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
