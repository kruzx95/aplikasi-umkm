import React, { useState } from 'react';
import { BarChart3, TrendingUp, TrendingDown, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { Transaction } from '../../types';

interface TrendChart7DaysProps {
  transactions: Transaction[]; // transactions from the last 7 days
}

export const TrendChart7Days: React.FC<TrendChart7DaysProps> = ({ transactions }) => {
  // Generate date list for the last 7 days (index 0 = 6 days ago, index 6 = today)
  const daysData = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dateStr = d.toISOString().split('T')[0];
    
    // Indonesia day name
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dayName = i === 6 ? 'Hari Ini' : dayNames[d.getDay()];
    
    const dayFullStr = d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short'
    });

    const dayTxs = transactions.filter(t => t.date === dateStr);
    const income = dayTxs.filter(t => t.type === 'in').reduce((sum, t) => sum + t.amount, 0);
    const expense = dayTxs.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0);
    const profit = income - expense;

    return {
      dateStr,
      dayName,
      dayFullStr,
      shortDate: `${d.getDate()}/${d.getMonth() + 1}`,
      income,
      expense,
      profit,
      txCount: dayTxs.length
    };
  });

  // Default active selected day is today (index 6)
  const [selectedIdx, setSelectedIdx] = useState<number>(6);
  const activeDay = daysData[selectedIdx] || daysData[6];

  // Totals for the 7 days
  const total7DaysIncome = daysData.reduce((sum, d) => sum + d.income, 0);
  const total7DaysExpense = daysData.reduce((sum, d) => sum + d.expense, 0);
  const total7DaysProfit = total7DaysIncome - total7DaysExpense;
  const avgDailyIncome = Math.round(total7DaysIncome / 7);

  // Chart scaling
  const maxVal = Math.max(
    ...daysData.map(d => Math.max(d.income, d.expense)),
    100000 // minimum ceiling
  );

  const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');
  const formatCompact = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'jt';
    if (num >= 1000) return Math.round(num / 1000) + 'rb';
    return num.toString();
  };

  // SVG dimensions
  const svgWidth = 620;
  const svgHeight = 220;
  const chartTop = 20;
  const chartBottom = 165;
  const chartHeight = chartBottom - chartTop; // 145px
  const chartLeft = 30;
  const chartRight = 590;
  const chartWidth = chartRight - chartLeft;
  const colWidth = chartWidth / 7;

  return (
    <div className="card trend-chart-card">
      {/* Header */}
      <div className="trend-chart-header">
        <div className="trend-header-info">
          <div className="icon-badge icon-badge-emerald">
            <BarChart3 size={18} />
          </div>
          <div>
            <h3 className="trend-title">Tren Arus Kas 7 Hari</h3>
            <p className="trend-subtitle">Omset vs Belanja Harian Kedai</p>
          </div>
        </div>

        <div className="trend-summary-pills">
          <div className="trend-pill">
            <span className="pill-label">Total 7 Hari:</span>
            <strong className="pill-value text-emerald">{formatCompact(total7DaysIncome)}</strong>
          </div>
          <div className="trend-pill">
            <span className="pill-label">Rata-rata/hari:</span>
            <strong className="pill-value">{formatCompact(avgDailyIncome)}</strong>
          </div>
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="trend-legend">
        <div className="legend-item">
          <span className="legend-dot dot-emerald"></span>
          <span>Omset Masuk</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot dot-rose"></span>
          <span>Pengeluaran Belanja</span>
        </div>
        <div className="legend-tip">
          <span>Ketuk kolom untuk rincian harian</span>
        </div>
      </div>

      {/* SVG Chart Graphic */}
      <div className="svg-chart-container">
        <svg 
          viewBox={`0 0 ${svgWidth} ${svgHeight}`} 
          className="trend-svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="barEmeraldGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="100%" stopColor="#059669" />
            </linearGradient>
            <linearGradient id="barRoseGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fb7185" />
              <stop offset="100%" stopColor="#e11d48" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines */}
          {[0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = chartBottom - ratio * chartHeight;
            return (
              <g key={idx}>
                <line
                  x1={chartLeft}
                  y1={y}
                  x2={chartRight}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                />
                <text
                  x={chartLeft - 5}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9"
                  fill="var(--text-muted)"
                  fontFamily="system-ui, sans-serif"
                >
                  {formatCompact(maxVal * ratio)}
                </text>
              </g>
            );
          })}

          {/* Baseline */}
          <line
            x1={chartLeft}
            y1={chartBottom}
            x2={chartRight}
            y2={chartBottom}
            stroke="var(--border-strong)"
            strokeWidth="1.5"
          />

          {/* Columns & Bars */}
          {daysData.map((d, idx) => {
            const colCenterX = chartLeft + idx * colWidth + colWidth / 2;
            const barWidth = 14;
            const isSelected = selectedIdx === idx;

            // Bar heights
            const incomeH = maxVal > 0 ? (d.income / maxVal) * chartHeight : 0;
            const expenseH = maxVal > 0 ? (d.expense / maxVal) * chartHeight : 0;

            const incomeY = chartBottom - incomeH;
            const expenseY = chartBottom - expenseH;

            return (
              <g 
                key={d.dateStr} 
                className="chart-col-group"
                onClick={() => setSelectedIdx(idx)}
                style={{ cursor: 'pointer' }}
              >
                {/* Column Clickable Highlight Area */}
                <rect
                  x={colCenterX - colWidth / 2 + 3}
                  y={chartTop}
                  width={colWidth - 6}
                  height={chartHeight + 40}
                  rx="8"
                  fill={isSelected ? 'rgba(16, 185, 129, 0.1)' : 'transparent'}
                  className="col-hover-rect"
                />

                {/* Omset Bar (Green) */}
                {incomeH > 0 && (
                  <rect
                    x={colCenterX - barWidth - 2}
                    y={incomeY}
                    width={barWidth}
                    height={incomeH}
                    rx="4"
                    fill="url(#barEmeraldGrad)"
                    className="chart-bar"
                  />
                )}

                {/* Expense Bar (Rose) */}
                {expenseH > 0 && (
                  <rect
                    x={colCenterX + 2}
                    y={expenseY}
                    width={barWidth}
                    height={expenseH}
                    rx="4"
                    fill="url(#barRoseGrad)"
                    className="chart-bar"
                  />
                )}

                {/* Day Label */}
                <text
                  x={colCenterX}
                  y={chartBottom + 18}
                  textAnchor="middle"
                  fontSize={isSelected ? '11' : '10'}
                  fontWeight={isSelected ? '700' : '600'}
                  fill={isSelected ? 'var(--primary-700)' : 'var(--text-primary)'}
                  fontFamily="system-ui, sans-serif"
                >
                  {d.dayName}
                </text>

                {/* Short Date Label */}
                <text
                  x={colCenterX}
                  y={chartBottom + 31}
                  textAnchor="middle"
                  fontSize="8.5"
                  fill="var(--text-muted)"
                  fontFamily="system-ui, sans-serif"
                >
                  {d.shortDate}
                </text>

                {/* Active Indicator dot */}
                {isSelected && (
                  <circle
                    cx={colCenterX}
                    cy={chartBottom + 41}
                    r="2.5"
                    fill="var(--primary-600)"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Day Detail Card */}
      <div className="active-day-detail-panel">
        <div className="day-detail-header">
          <span className="day-detail-title">
            Rincian {activeDay.dayFullStr} {selectedIdx === 6 && <span className="today-badge">Hari Ini</span>}
          </span>
          <span className="day-detail-txcount">{activeDay.txCount} transaksi tercatat</span>
        </div>

        <div className="day-detail-grid">
          <div className="day-detail-stat">
            <span className="stat-label-mini">
              <TrendingUp size={12} className="text-emerald" /> Omset Masuk
            </span>
            <span className="stat-num-mini text-emerald">{formatRupiah(activeDay.income)}</span>
          </div>

          <div className="day-detail-stat">
            <span className="stat-label-mini">
              <TrendingDown size={12} className="text-rose" /> Belanja Keluar
            </span>
            <span className="stat-num-mini text-rose">{formatRupiah(activeDay.expense)}</span>
          </div>

          <div className="day-detail-stat">
            <span className="stat-label-mini">
              <ArrowUpRight size={12} className="text-blue" /> Untung Bersih
            </span>
            <span className={`stat-num-mini ${activeDay.profit >= 0 ? 'text-emerald' : 'text-rose'}`}>
              {formatRupiah(activeDay.profit)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
