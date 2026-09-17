import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Store, Tenant, Transaction } from '../types';

export interface ReportSummary {
  totalIncome: number;
  cashIncome: number;
  qrisIncome: number;
  totalExpense: number;
  netProfit: number;
  profitMargin: number;
  totalGrossIncome?: number;
  totalCommissions?: number;
  channelStats?: {
    offline: { label: string; count: number; gross: number; commission: number; net: number };
    gofood: { label: string; count: number; gross: number; commission: number; net: number };
    shopeefood: { label: string; count: number; gross: number; commission: number; net: number };
    grabfood: { label: string; count: number; gross: number; commission: number; net: number };
  };
  totalPendingSettlement?: number;
}

export function generatePdfReport(
  store: Store | null,
  tenant: Tenant | null,
  period: 'today' | '7days' | 'month',
  transactions: Transaction[],
  summary: ReportSummary
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 210mm
  const margin = 14;
  const contentWidth = pageWidth - margin * 2; // 182mm

  const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');
  
  const periodLabel = period === 'today' 
    ? 'Harian (Hari Ini)' 
    : period === '7days' 
    ? '7 Hari Terakhir' 
    : 'Bulanan (Bulan Ini)';

  const todayFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  // 1. Top Decorative Brand Accent Line
  doc.setFillColor(16, 185, 129); // Emerald 500
  doc.rect(0, 0, pageWidth, 5, 'F');

  // 2. Header Information
  let currentY = 16;

  // Title & Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(15, 23, 42); // Slate 900
  doc.text(store?.name || 'KasKedai F&B', margin, currentY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139); // Slate 500
  doc.text(`${store?.branchName || 'Cabang Utama'} • ${tenant?.businessName || ''}`, margin, currentY + 5);
  doc.text(`${store?.address || ''} | Telp: ${store?.phone || '-'}`, margin, currentY + 9);

  // Right-aligned Document Metadata Box
  const metaBoxX = pageWidth - margin - 65;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(metaBoxX, 10, 65, 18, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(16, 185, 129);
  doc.text('LAPORAN KEUANGAN RESMI', metaBoxX + 4, 15);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Periode: ${periodLabel}`, metaBoxX + 4, 19.5);
  doc.text(`Dicetak: ${todayFormatted}`, metaBoxX + 4, 24);

  // Horizontal separator rule
  currentY = 28;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.5);
  doc.line(margin, currentY, pageWidth - margin, currentY);

  // 3. Executive KPI Summary Cards
  currentY = 33;
  const cardW = (contentWidth - 8) / 3; // 3 columns with 4mm gap
  const cardH = 22;

  // Card 1: Total Omset (Green)
  doc.setFillColor(240, 253, 244); // Emerald 50
  doc.setDrawColor(167, 243, 208); // Emerald 200
  doc.roundedRect(margin, currentY, cardW, cardH, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(5, 150, 105);
  doc.text('TOTAL OMSET (MASUK)', margin + 3.5, currentY + 5.5);

  doc.setFontSize(12);
  doc.setTextColor(4, 120, 87);
  doc.text(formatRupiah(summary.totalIncome), margin + 3.5, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Tunai: ${formatRupiah(summary.cashIncome)} | QRIS: ${formatRupiah(summary.qrisIncome)}`, margin + 3.5, currentY + 18);

  // Card 2: Total Belanja / Pengeluaran (Red)
  const card2X = margin + cardW + 4;
  doc.setFillColor(255, 241, 242); // Rose 50
  doc.setDrawColor(254, 205, 211); // Rose 200
  doc.roundedRect(card2X, currentY, cardW, cardH, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(225, 29, 72);
  doc.text('TOTAL BELANJA & BEBAN', card2X + 3.5, currentY + 5.5);

  doc.setFontSize(12);
  doc.setTextColor(190, 18, 60);
  doc.text(formatRupiah(summary.totalExpense), card2X + 3.5, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`${transactions.filter(t => t.type === 'out').length} transaksi operasional`, card2X + 3.5, currentY + 18);

  // Card 3: Laba Bersih (Blue)
  const card3X = card2X + cardW + 4;
  doc.setFillColor(240, 249, 255); // Sky 50
  doc.setDrawColor(186, 230, 253); // Sky 200
  doc.roundedRect(card3X, currentY, cardW, cardH, 2.5, 2.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(2, 132, 199);
  doc.text('ESTIMASI LABA BERSIH', card3X + 3.5, currentY + 5.5);

  doc.setFontSize(12);
  doc.setTextColor(summary.netProfit >= 0 ? 3 : 190, summary.netProfit >= 0 ? 105 : 18, summary.netProfit >= 0 ? 161 : 60);
  doc.text(formatRupiah(summary.netProfit), card3X + 3.5, currentY + 12);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text(`Margin Keuntungan: ${summary.profitMargin}%`, card3X + 3.5, currentY + 18);

  // 4a. Multi-Channel Sales Breakdown (Offline vs GoFood vs ShopeeFood vs GrabFood)
  currentY = 60;
  if (summary.channelStats) {
    const activeChannels = Object.entries(summary.channelStats).filter(([_, st]) => st.count > 0);
    if (activeChannels.length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.setTextColor(30, 41, 59);
      doc.text('Rekapitulasi Penjualan Multi-Kanal & Ojek Online', margin, currentY);

      const chRows = activeChannels.map(([_, st], idx) => [
        (idx + 1).toString(),
        st.label,
        `${st.count} nota`,
        formatRupiah(st.gross),
        st.commission > 0 ? `-${formatRupiah(st.commission)}` : 'Rp 0',
        formatRupiah(st.net)
      ]);

      // Add Total summary row
      chRows.push([
        '',
        'TOTAL OMSET / PENDAPATAN',
        `${activeChannels.reduce((sum, [_, st]) => sum + st.count, 0)} nota`,
        formatRupiah(summary.totalGrossIncome || summary.totalIncome),
        summary.totalCommissions ? `-${formatRupiah(summary.totalCommissions)}` : 'Rp 0',
        formatRupiah(summary.totalIncome)
      ]);

      autoTable(doc, {
        startY: currentY + 3,
        head: [['No', 'Kanal Penjualan', 'Volume', 'Omset Kotor', 'Potongan Komisi', 'Pendapatan Bersih']],
        body: chRows,
        theme: 'grid',
        styles: {
          fontSize: 7.5,
          cellPadding: 2,
          textColor: [51, 65, 85],
          lineColor: [226, 232, 240],
        },
        headStyles: {
          fillColor: [30, 41, 59], // Slate 800
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 8, halign: 'center' },
          1: { cellWidth: 'auto', fontStyle: 'bold' },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 30, halign: 'right' },
          4: { cellWidth: 30, halign: 'right' },
          5: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
        },
        didParseCell: function(data) {
          if (data.row.index === chRows.length - 1) {
            data.cell.styles.fillColor = [241, 245, 249];
            data.cell.styles.fontStyle = 'bold';
            if (data.column.index === 5) {
              data.cell.styles.textColor = [5, 150, 105];
            }
          }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 8;
    }
  }

  // 4b. Breakdown by Category (Table Ringkas)
  const expenseByCategory = transactions
    .filter(t => t.type === 'out')
    .reduce((acc, t) => {
      acc[t.categoryName] = (acc[t.categoryName] || 0) + t.amount;
      return acc;
    }, {} as Record<string, number>);

  const sortedCategories = Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]);

  if (sortedCategories.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);
    doc.text('Rincian Pos Belanja & Pengeluaran Kedai', margin, currentY);

    const catRows = sortedCategories.map(([cat, amt], idx) => {
      const pct = summary.totalExpense > 0 ? Math.round((amt / summary.totalExpense) * 100) : 0;
      return [
        (idx + 1).toString(),
        cat,
        formatRupiah(amt),
        `${pct}%`
      ];
    });

    autoTable(doc, {
      startY: currentY + 3,
      head: [['No', 'Kategori Pos Pengeluaran', 'Nominal (Rp)', 'Porsi (%)']],
      body: catRows,
      theme: 'grid',
      styles: {
        fontSize: 8,
        cellPadding: 2.5,
        textColor: [51, 65, 85],
        lineColor: [226, 232, 240],
      },
      headStyles: {
        fillColor: [71, 85, 105],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 38, halign: 'right' },
        3: { cellWidth: 24, halign: 'center' },
      },
      margin: { left: margin, right: margin }
    });

    // Update currentY after table
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // 5. Detailed Transactions Table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text('Daftar Rincian Seluruh Transaksi', margin, currentY);

  const getChannelLabel = (ch?: string) => {
    switch (ch) {
      case 'gofood': return 'GoFood';
      case 'shopeefood': return 'Shopee';
      case 'grabfood': return 'GrabFood';
      default: return 'Kasir';
    }
  };

  const txRows = transactions.map((t, idx) => [
    (idx + 1).toString(),
    `${t.date}\n${t.time}`,
    t.type === 'in' ? 'Masuk' : 'Keluar',
    t.type === 'in' ? getChannelLabel(t.channel) : '-',
    t.categoryName,
    t.externalOrderId ? `${t.description || ''} (${t.externalOrderId})` : (t.description || '-'),
    t.paymentMethod.toUpperCase(),
    formatRupiah(t.amount),
    t.createdByName
  ]);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['No', 'Waktu', 'Tipe', 'Kanal', 'Kategori', 'Keterangan', 'Metode', 'Nominal', 'Pencatat']],
    body: txRows,
    theme: 'striped',
    styles: {
      fontSize: 7.5,
      cellPadding: 2.2,
      textColor: [51, 65, 85],
      lineColor: [241, 245, 249],
      valign: 'middle'
    },
    headStyles: {
      fillColor: [16, 185, 129], // Emerald 500
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      1: { cellWidth: 16, halign: 'center' },
      2: { cellWidth: 13, halign: 'center' },
      3: { cellWidth: 16, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 28 },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 14, halign: 'center' },
      7: { cellWidth: 24, halign: 'right' },
      8: { cellWidth: 20 },
    },
    didParseCell: function(data) {
      // Highlight type column
      if (data.section === 'body' && data.column.index === 2) {
        if (data.cell.raw === 'Masuk') {
          data.cell.styles.textColor = [5, 150, 105]; // Emerald
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [225, 29, 72]; // Rose
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: margin, right: margin }
  });

  // 6. Signatures & Verification Footer
  let finalY = (doc as any).lastAutoTable.finalY + 12;

  // If near bottom of page, add new page for signature
  if (finalY > doc.internal.pageSize.getHeight() - 35) {
    doc.addPage();
    finalY = 20;
  }

  // Two signature columns: Maker (Kasir) & Approver (Owner)
  const signColWidth = 55;
  const signLeftX = margin + 10;
  const signRightX = pageWidth - margin - signColWidth - 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Dibuat & Disiapkan oleh,', signLeftX, finalY);
  doc.text('Mengetahui / Menyetujui,', signRightX, finalY);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('( Kasir / Staf Operasional )', signLeftX, finalY + 18);
  doc.text(`( ${tenant?.ownerName || 'Pemilik Kedai'} )`, signRightX, finalY + 18);

  // 7. Page numbering & footer branding on all pages
  const totalPages = doc.internal.pages.length - 1;
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(148, 163, 184); // Slate 400
    doc.text(
      `KasKedai PWA (Local-First Offline) • Dicetak pada ${todayFormatted} • Halaman ${i} dari ${totalPages}`,
      margin,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  // Save PDF file
  const fileName = `Laporan_KasKedai_${store?.name.replace(/\s+/g, '_')}_${period}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
