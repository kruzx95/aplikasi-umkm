import { db } from './database';
import { Category, Tenant, Store, Transaction, Shift, Debt, AuditLog, RawMaterial } from '../types';

export const DEFAULT_CATEGORIES: Category[] = [

  // Pemasukan
  { id: 'cat_in_sales', name: 'Penjualan Menu Makanan & Minuman', type: 'in', icon: 'UtensilsCrossed', color: '#10b981', isDefault: true },
  { id: 'cat_in_konsinyasi', name: 'Titip Jual / Konsinyasi', type: 'in', icon: 'ShoppingBag', color: '#059669', isDefault: true },
  { id: 'cat_in_modal', name: 'Suntikan Modal Usaha', type: 'in', icon: 'Wallet', color: '#047857', isDefault: true },
  { id: 'cat_in_other', name: 'Pemasukan Lain-lain', type: 'in', icon: 'Coins', color: '#34d399', isDefault: true },

  // Pengeluaran F&B Khas Kedai
  { id: 'cat_out_bahan', name: 'Bahan Baku (Pasar/Daging/Sayur/Bumbu)', type: 'out', icon: 'Beef', color: '#ef4444', isDefault: true },
  { id: 'cat_out_minyak', name: 'Minyak Goreng & Saus/Kecap', type: 'out', icon: 'Droplets', color: '#f97316', isDefault: true },
  { id: 'cat_out_kemasan', name: 'Kemasan (Cup/Box/Plastik/Sedotan)', type: 'out', icon: 'Package', color: '#f59e0b', isDefault: true },
  { id: 'cat_out_gas_air', name: 'Gas Elpiji & Galon Air Minum', type: 'out', icon: 'Flame', color: '#e11d48', isDefault: true },
  { id: 'cat_out_gaji', name: 'Uang Makan / Gaji Harian Karyawan', type: 'out', icon: 'Users', color: '#8b5cf6', isDefault: true },
  { id: 'cat_out_sewa', name: 'Sewa Tempat / Lapak / Kebersihan', type: 'out', icon: 'Store', color: '#6366f1', isDefault: true },
  { id: 'cat_out_listrik', name: 'Token Listrik Kedai', type: 'out', icon: 'Zap', color: '#0ea5e9', isDefault: true },
  { id: 'cat_out_other', name: 'Pengeluaran Lain-lain', type: 'out', icon: 'MoreHorizontal', color: '#64748b', isDefault: true },
];

export const SAMPLE_RAW_MATERIALS: RawMaterial[] = [
  {
    id: 'rm-terigu',
    tenantId: 'tenant-mas-roy',
    storeId: 'store-roy-ruko',
    name: 'Terigu Protein Sedang (Segitiga Biru)',
    category: 'Bahan Utama',
    currentStock: 25,
    unit: 'kg',
    minStockAlert: 10,
    costPerUnit: 12500,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rm-telur',
    tenantId: 'tenant-mas-roy',
    storeId: 'store-roy-ruko',
    name: 'Telur Ayam Negeri Segar',
    category: 'Bahan Utama',
    currentStock: 4, // Status: Menipis! (min: 8)
    unit: 'kg',
    minStockAlert: 8,
    costPerUnit: 28000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rm-margarin',
    tenantId: 'tenant-mas-roy',
    storeId: 'store-roy-ruko',
    name: 'Margarin Serbaguna BlueBand',
    category: 'Minyak & Lemak',
    currentStock: 12,
    unit: 'kg',
    minStockAlert: 5,
    costPerUnit: 34000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rm-keju',
    tenantId: 'tenant-mas-roy',
    storeId: 'store-roy-ruko',
    name: 'Keju Cheddar Olahan Prochiz Gold',
    category: 'Topping',
    currentStock: 1, // Status: Kritis / Habis! (min: 3)
    unit: 'blok',
    minStockAlert: 3,
    costPerUnit: 22000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rm-cokelat',
    tenantId: 'tenant-mas-roy',
    storeId: 'store-roy-ruko',
    name: 'Cokelat Butir / Meses Hagelslag',
    category: 'Topping',
    currentStock: 6,
    unit: 'kg',
    minStockAlert: 2,
    costPerUnit: 38000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rm-susu',
    tenantId: 'tenant-mas-roy',
    storeId: 'store-roy-ruko',
    name: 'Susu Kental Manis Carnation',
    category: 'Topping',
    currentStock: 18,
    unit: 'kaleng',
    minStockAlert: 6,
    costPerUnit: 13000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rm-minyak',
    tenantId: 'tenant-mas-roy',
    storeId: 'store-roy-ruko',
    name: 'Minyak Goreng Sawit',
    category: 'Minyak & Lemak',
    currentStock: 10,
    unit: 'liter',
    minStockAlert: 5,
    costPerUnit: 16000,
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'rm-dus',
    tenantId: 'tenant-mas-roy',
    storeId: 'store-roy-ruko',
    name: 'Dus Kemasan Martabak Sablon',
    category: 'Kemasan',
    currentStock: 120,
    unit: 'pcs',
    minStockAlert: 50,
    costPerUnit: 1200,
    updatedAt: new Date().toISOString(),
  },
];

export const SAMPLE_ONLINE_FOOD_TXS: Transaction[] = [
  {
    id: 'tx-gf-01',
    tenantId: 'tenant-mas-roy',
    storeId: 'store-roy-ruko',
    type: 'in',
    amount: 52400,
    paymentMethod: 'transfer',
    categoryId: 'cat_in_sales',
    categoryName: 'Penjualan Menu Makanan & Minuman',
    description: 'GoFood Pesan Antar | F-3358527824',
    date: new Date().toISOString().split('T')[0],
    time: '20:40',
    createdByRole: 'cashier',
    createdByName: 'Bima (Kasir Pagi)',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    channel: 'gofood',
    grossAmount: 65500,
    commissionRate: 20,
    commissionAmount: 13100,
    netAmount: 52400,
    settlementStatus: 'pending',
    externalOrderId: 'F-3358527824',
  },
  {
    id: 'tx-gf-02',
    tenantId: 'tenant-mas-roy',
    storeId: 'store-roy-ruko',
    type: 'in',
    amount: 132000,
    paymentMethod: 'transfer',
    categoryId: 'cat_in_sales',
    categoryName: 'Penjualan Menu Makanan & Minuman',
    description: 'GoFood Pesan Antar | F-3358535744',
    date: new Date().toISOString().split('T')[0],
    time: '20:27',
    createdByRole: 'cashier',
    createdByName: 'Bima (Kasir Pagi)',
    createdAt: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    channel: 'gofood',
    grossAmount: 165000,
    commissionRate: 20,
    commissionAmount: 33000,
    netAmount: 132000,
    settlementStatus: 'pending',
    externalOrderId: 'F-3358535744',
  },
  {
    id: 'tx-gf-03',
    tenantId: 'tenant-mas-roy',
    storeId: 'store-roy-ruko',
    type: 'in',
    amount: 72400,
    paymentMethod: 'transfer',
    categoryId: 'cat_in_sales',
    categoryName: 'Penjualan Menu Makanan & Minuman',
    description: 'GoFood Pesan Antar | F-3358506298',
    date: new Date().toISOString().split('T')[0],
    time: '20:22',
    createdByRole: 'cashier',
    createdByName: 'Bima (Kasir Pagi)',
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    channel: 'gofood',
    grossAmount: 90500,
    commissionRate: 20,
    commissionAmount: 18100,
    netAmount: 72400,
    settlementStatus: 'pending',
    externalOrderId: 'F-3358506298',
  },
  {
    id: 'tx-gf-04',
    tenantId: 'tenant-mas-roy',
    storeId: 'store-roy-ruko',
    type: 'in',
    amount: 40400,
    paymentMethod: 'transfer',
    categoryId: 'cat_in_sales',
    categoryName: 'Penjualan Menu Makanan & Minuman',
    description: 'GoFood Pesan Antar | F-3358503251',
    date: new Date().toISOString().split('T')[0],
    time: '20:16',
    createdByRole: 'cashier',
    createdByName: 'Bima (Kasir Pagi)',
    createdAt: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    channel: 'gofood',
    grossAmount: 50500,
    commissionRate: 20,
    commissionAmount: 10100,
    netAmount: 40400,
    settlementStatus: 'pending',
    externalOrderId: 'F-3358503251',
  },
  {
    id: 'tx-spf-01',
    tenantId: 'tenant-mas-roy',
    storeId: 'store-roy-ruko',
    type: 'in',
    amount: 68000,
    paymentMethod: 'transfer',
    categoryId: 'cat_in_sales',
    categoryName: 'Penjualan Menu Makanan & Minuman',
    description: 'ShopeeFood Order | SPF-7829104',
    date: new Date().toISOString().split('T')[0],
    time: '19:45',
    createdByRole: 'cashier',
    createdByName: 'Bima (Kasir Pagi)',
    createdAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    channel: 'shopeefood',
    grossAmount: 85000,
    commissionRate: 20,
    commissionAmount: 17000,
    netAmount: 68000,
    settlementStatus: 'pending',
    externalOrderId: 'SPF-7829104',
  }
];

export async function seedRawMaterialsIfNeeded() {
  try {
    const count = await db.raw_materials.count();
    if (count === 0) {
      await db.raw_materials.bulkPut(SAMPLE_RAW_MATERIALS);
    }
  } catch (err) {
    console.warn('seedRawMaterialsIfNeeded warning:', err);
  }
}

export async function seedOnlineFoodTxsIfNeeded() {
  try {
    const existingGf = await db.transactions.get('tx-gf-01');
    if (!existingGf) {
      await db.transactions.bulkPut(SAMPLE_ONLINE_FOOD_TXS);
    }
  } catch (err) {
    console.warn('seedOnlineFoodTxsIfNeeded warning:', err);
  }
}

export async function seedInitialDataIfNeeded() {
  const isFreshMode = localStorage.getItem('kaskedai_fresh_mode');
  if (isFreshMode === 'true') {
    // Pastikan kategori bawaan F&B tetap terpasang jika kosong
    const catCount = await db.categories.count();
    if (catCount === 0) {
      await db.categories.bulkPut(DEFAULT_CATEGORIES);
    }
    return;
  }

  const tenantCount = await db.tenants.count();
  if (tenantCount > 0) {
    await seedHistoricalTransactionsIfNeeded();
    await seedRawMaterialsIfNeeded();
    await seedOnlineFoodTxsIfNeeded();
    return; // Data sudah ada
  }

  // 1. Seed Categories
  await db.categories.bulkPut(DEFAULT_CATEGORIES);

  // 2. Seed Tenants
  const sampleTenants: Tenant[] = [
    {
      id: 'tenant-mas-roy',
      businessName: 'Kedai Kopi & Toast Mas Roy',
      ownerName: 'Mas Roy Prasetyo',
      email: 'roy.prasetyo@kedaimasroy.com',
      phone: '081234567890',
      subscriptionPlan: 'pro',
      subscriptionStatus: 'active',
      validUntil: '2026-12-31T23:59:59Z',
      createdAt: '2026-01-10T08:00:00Z',
    },
    {
      id: 'tenant-bu-tari',
      businessName: 'Ayam Geprek Sambal Bawang Bu Tari',
      ownerName: 'Ibu Lestari',
      email: 'lestari.geprek@gmail.com',
      phone: '081987654321',
      subscriptionPlan: 'starter',
      subscriptionStatus: 'trial',
      validUntil: '2026-09-28T23:59:59Z', // 13 hari tersisa
      createdAt: '2026-09-14T10:00:00Z',
    }
  ];
  await db.tenants.bulkPut(sampleTenants);

  // 3. Seed Stores
  const sampleStores: Store[] = [
    {
      id: 'store-roy-ruko',
      tenantId: 'tenant-mas-roy',
      name: 'Kedai Mas Roy',
      branchName: 'Cabang Ruko Veteran (Utama)',
      address: 'Jl. Veteran No. 42, Malang',
      phone: '081234567890',
      currency: 'Rp',
      isActive: true,
      createdAt: '2026-01-10T08:30:00Z',
    },
    {
      id: 'store-roy-mall',
      tenantId: 'tenant-mas-roy',
      name: 'Kedai Mas Roy',
      branchName: 'Cabang Foodcourt Matos',
      address: 'Foodcourt Lt. 3 Unit FC-12',
      phone: '081234567891',
      currency: 'Rp',
      isActive: true,
      createdAt: '2026-03-01T09:00:00Z',
    },
    {
      id: 'store-bu-tari',
      tenantId: 'tenant-bu-tari',
      name: 'Ayam Geprek Bu Tari',
      branchName: 'Outlet Pujasera Merbabu',
      address: 'Jl. Merbabu No. 15, Malang',
      phone: '081987654321',
      currency: 'Rp',
      isActive: true,
      createdAt: '2026-09-14T10:30:00Z',
    }
  ];
  await db.stores.bulkPut(sampleStores);

  const todayStr = new Date().toISOString().split('T')[0];

  // 4. Seed Shifts
  const sampleShift: Shift = {
    id: 'shift-today-1',
    tenantId: 'tenant-mas-roy',
    storeId: 'store-roy-ruko',
    cashierName: 'Bima (Kasir Pagi)',
    startCash: 150000, // Modal kembalian awal
    endCashExpected: 0,
    endCashActual: 0,
    discrepancy: 0,
    openedAt: new Date().toISOString(),
    status: 'open',
    notes: 'Shift pagi lancar, kembalian pecahan 2rb dan 5rb cukup.',
  };
  await db.shifts.put(sampleShift);

  // 5. Seed Transactions
  const sampleTransactions: Transaction[] = [
    {
      id: 'tx-1',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'out',
      amount: 145000,
      paymentMethod: 'cash',
      categoryId: 'cat_out_bahan',
      categoryName: 'Bahan Baku (Pasar/Daging/Sayur/Bumbu)',
      description: 'Belanja roti tawar bandung 10 loaf & selai srikaya pasar',
      date: todayStr,
      time: '07:15',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      shiftId: 'shift-today-1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-2',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'out',
      amount: 44000,
      paymentMethod: 'cash',
      categoryId: 'cat_out_gas_air',
      categoryName: 'Gas Elpiji & Galon Air Minum',
      description: 'Isi ulang 2 galon air mineral & 1 tabung gas 3kg',
      date: todayStr,
      time: '08:00',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      shiftId: 'shift-today-1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-3',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 185000,
      paymentMethod: 'cash',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Pesanan sarapan 7 porsi Kopi Susu & Toast Coklat Keju',
      date: todayStr,
      time: '08:45',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      shiftId: 'shift-today-1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-4',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 320000,
      paymentMethod: 'qris',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Pembayaran QRIS meja 1 s.d 4 rombongan kantor',
      date: todayStr,
      time: '09:30',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      shiftId: 'shift-today-1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-5',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 210000,
      paymentMethod: 'cash',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Penjualan take-away 8 cup Kopi Gula Aren',
      date: todayStr,
      time: '11:15',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      shiftId: 'shift-today-1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-6',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'out',
      amount: 50000,
      paymentMethod: 'cash',
      categoryId: 'cat_out_gaji',
      categoryName: 'Uang Makan / Gaji Harian Karyawan',
      description: 'Uang makan siang 2 orang staf shift',
      date: todayStr,
      time: '12:00',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      shiftId: 'shift-today-1',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'tx-7',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 450000,
      paymentMethod: 'qris',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Pembayaran QRIS order siang & take away',
      date: todayStr,
      time: '12:45',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      shiftId: 'shift-today-1',
      createdAt: new Date().toISOString(),
    }
  ];
  await db.transactions.bulkPut(sampleTransactions);

  // 6. Seed Debts (Kasbon / Bon Supplier)
  const dOverdue = new Date();
  dOverdue.setDate(dOverdue.getDate() - 3);
  const overdueStr = dOverdue.toISOString().split('T')[0];

  const dUpcoming = new Date();
  dUpcoming.setDate(dUpcoming.getDate() + 4);
  const upcomingStr = dUpcoming.toISOString().split('T')[0];

  const sampleDebts: Debt[] = [
    {
      id: 'debt-1',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      personName: 'Pak Hadi (Langganan Kantor BPN)',
      phone: '081299887766',
      type: 'piutang',
      amount: 85000,
      dueDate: todayStr,
      status: 'unpaid',
      description: 'Bon 4 porsi toast telur & kopi pagi, janji transfer sore',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'debt-overdue-1',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      personName: 'Bu Ratna (Catering Arisan Dharma Wanita)',
      phone: '081388776655',
      type: 'piutang',
      amount: 175000,
      originalAmount: 225000,
      dueDate: overdueStr,
      status: 'unpaid',
      description: 'Pesanan snack box roti bakar 15 porsi, sisa tagihan belum lunas',
      createdAt: dOverdue.toISOString(),
      paymentHistory: [
        {
          amount: 50000,
          date: overdueStr,
          paymentMethod: 'cash',
          note: 'DP awal 50rb',
          actorName: 'Bima (Kasir Pagi)'
        }
      ]
    },
    {
      id: 'debt-2',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      personName: 'Toko Plastik Makmur',
      phone: '081333444555',
      type: 'utang',
      amount: 250000,
      dueDate: todayStr,
      status: 'unpaid',
      description: 'Karton cup takeaway 16oz (2 dus), tempo bayar hari ini',
      createdAt: new Date().toISOString(),
    },
    {
      id: 'debt-upcoming-1',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      personName: 'Supplier Susu Segar Segoro',
      phone: '081555667788',
      type: 'utang',
      amount: 320000,
      dueDate: upcomingStr,
      status: 'unpaid',
      description: 'Pengiriman 2 jerigen susu UHT & fresh milk mingguan',
      createdAt: new Date().toISOString(),
    }
  ];
  await db.debts.bulkPut(sampleDebts);

  // 7. Seed Audit Logs
  const sampleAuditLogs: AuditLog[] = [
    {
      id: 'log-seed-1',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      storeName: 'Kedai Mas Roy - Cabang Ruko',
      actorRole: 'owner',
      actorName: 'Mas Roy Prasetyo',
      actionType: 'STORE_UPDATE',
      description: 'Memperbarui profil toko dan menetapkan modal laci awal Rp 150.000',
      timestamp: new Date(Date.now() - 3600000 * 6).toISOString(),
    },
    {
      id: 'log-seed-2',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      storeName: 'Kedai Mas Roy - Cabang Ruko',
      actorRole: 'cashier',
      actorName: 'Bima (Kasir Pagi)',
      actionType: 'SHIFT_OPEN',
      description: 'Membuka shift pagi dengan uang kas laci awal Rp 150.000',
      timestamp: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
    {
      id: 'log-seed-3',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      storeName: 'Kedai Mas Roy - Cabang Ruko',
      actorRole: 'cashier',
      actorName: 'Bima (Kasir Pagi)',
      actionType: 'TRANSACTION_ADD',
      description: 'Mencatat pengeluaran belanja bahan baku pasar Rp 145.000 (Tunai)',
      timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'log-seed-4',
      actorRole: 'superadmin',
      actorName: 'Superadmin Platform',
      actionType: 'SUBSCRIPTION_UPDATE',
      description: 'Mengaktifkan lisensi Paket Pro untuk tenant Kedai Mas Roy hingga akhir tahun',
      metadata: { tenantId: 'tenant-mas-roy', plan: 'pro' },
      timestamp: new Date(Date.now() - 3600000 * 24).toISOString(),
    }
  ];
  await db.audit_logs.bulkPut(sampleAuditLogs);

  // 8. Ensure 7 days of realistic history
  await seedHistoricalTransactionsIfNeeded();
  await seedRawMaterialsIfNeeded();
  await seedOnlineFoodTxsIfNeeded();
}

export async function seedHistoricalTransactionsIfNeeded() {
  const existing = await db.transactions.where('id').equals('tx-hist-d1-1').first();
  if (existing) return;

  const getRelativeDateStr = (daysAgo: number) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return d.toISOString().split('T')[0];
  };

  const histTxs: Transaction[] = [
    // 1 Day Ago (Yesterday)
    {
      id: 'tx-hist-d1-1',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 480000,
      paymentMethod: 'cash',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Penjualan Kopi Susu & Roti Bakar Sore',
      date: getRelativeDateStr(1),
      time: '16:30',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 1 + 3600000 * 16).toISOString(),
    },
    {
      id: 'tx-hist-d1-2',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 720000,
      paymentMethod: 'qris',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Penjualan Meja 1 s/d 5 Rombongan Siang',
      date: getRelativeDateStr(1),
      time: '13:15',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 1 + 3600000 * 13).toISOString(),
    },
    {
      id: 'tx-hist-d1-3',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'out',
      amount: 165000,
      paymentMethod: 'cash',
      categoryId: 'cat_out_bahan',
      categoryName: 'Bahan Baku (Pasar/Daging/Sayur/Bumbu)',
      description: 'Belanja Daging Ayam & Bumbu Pasar Pagi',
      date: getRelativeDateStr(1),
      time: '07:30',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 1 + 3600000 * 7).toISOString(),
    },

    // 2 Days Ago
    {
      id: 'tx-hist-d2-1',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 850000,
      paymentMethod: 'qris',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Paket Katering Snack Box Kantor BPN',
      date: getRelativeDateStr(2),
      time: '10:00',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 2 + 3600000 * 10).toISOString(),
    },
    {
      id: 'tx-hist-d2-2',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 540000,
      paymentMethod: 'cash',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Penjualan Minuman Dingin & Snack Sore',
      date: getRelativeDateStr(2),
      time: '15:20',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 2 + 3600000 * 15).toISOString(),
    },
    {
      id: 'tx-hist-d2-3',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 250000,
      paymentMethod: 'transfer',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Transfer DP Pesanan Rapat Komunitas',
      date: getRelativeDateStr(2),
      time: '17:00',
      createdByRole: 'owner',
      createdByName: 'Mas Roy (Owner)',
      createdAt: new Date(Date.now() - 86400000 * 2 + 3600000 * 17).toISOString(),
    },
    {
      id: 'tx-hist-d2-4',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'out',
      amount: 220000,
      paymentMethod: 'cash',
      categoryId: 'cat_out_bahan',
      categoryName: 'Bahan Baku (Pasar/Daging/Sayur/Bumbu)',
      description: 'Belanja Telur 2 Krat & Roti Bandung',
      date: getRelativeDateStr(2),
      time: '07:15',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 2 + 3600000 * 7).toISOString(),
    },

    // 3 Days Ago (Weekend)
    {
      id: 'tx-hist-d3-1',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 1150000,
      paymentMethod: 'cash',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Penjualan Rame Weekend Meja Luar & Dalam',
      date: getRelativeDateStr(3),
      time: '19:30',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 3 + 3600000 * 19).toISOString(),
    },
    {
      id: 'tx-hist-d3-2',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 880000,
      paymentMethod: 'qris',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Pembayaran QRIS Pengunjung Malam Minggu',
      date: getRelativeDateStr(3),
      time: '20:45',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 3 + 3600000 * 20).toISOString(),
    },
    {
      id: 'tx-hist-d3-3',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'out',
      amount: 280000,
      paymentMethod: 'cash',
      categoryId: 'cat_out_bahan',
      categoryName: 'Bahan Baku (Pasar/Daging/Sayur/Bumbu)',
      description: 'Restock Daging Sapi & Sayuran Segar',
      date: getRelativeDateStr(3),
      time: '07:00',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 3 + 3600000 * 7).toISOString(),
    },

    // 4 Days Ago
    {
      id: 'tx-hist-d4-1',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 620000,
      paymentMethod: 'qris',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Penjualan Meja 2 & 4 Komunitas Sepeda',
      date: getRelativeDateStr(4),
      time: '14:20',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 4 + 3600000 * 14).toISOString(),
    },
    {
      id: 'tx-hist-d4-2',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 430000,
      paymentMethod: 'cash',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Penjualan Kopi Aren & Camilan',
      date: getRelativeDateStr(4),
      time: '16:00',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 4 + 3600000 * 16).toISOString(),
    },
    {
      id: 'tx-hist-d4-3',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'out',
      amount: 190000,
      paymentMethod: 'cash',
      categoryId: 'cat_out_minyak',
      categoryName: 'Minyak Goreng & Saus/Kecap',
      description: 'Belanja Minyak Goreng 2 Jerigen & Keju Cheddar',
      date: getRelativeDateStr(4),
      time: '07:45',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 4 + 3600000 * 7).toISOString(),
    },

    // 5 Days Ago
    {
      id: 'tx-hist-d5-1',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 510000,
      paymentMethod: 'cash',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Penjualan Sarapan Pagi & Es Kopi',
      date: getRelativeDateStr(5),
      time: '09:15',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 5 + 3600000 * 9).toISOString(),
    },
    {
      id: 'tx-hist-d5-2',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 490000,
      paymentMethod: 'qris',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Penjualan Makan Siang Pegawai',
      date: getRelativeDateStr(5),
      time: '12:30',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 5 + 3600000 * 12).toISOString(),
    },
    {
      id: 'tx-hist-d5-3',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'out',
      amount: 135000,
      paymentMethod: 'cash',
      categoryId: 'cat_out_bahan',
      categoryName: 'Bahan Baku (Pasar/Daging/Sayur/Bumbu)',
      description: 'Belanja Buah Segar & Sirup Kental Manis',
      date: getRelativeDateStr(5),
      time: '08:00',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 5 + 3600000 * 8).toISOString(),
    },

    // 6 Days Ago
    {
      id: 'tx-hist-d6-1',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 420000,
      paymentMethod: 'cash',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Penjualan Kopi Pagi & Roti Bakar Bandung',
      date: getRelativeDateStr(6),
      time: '08:30',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 6 + 3600000 * 8).toISOString(),
    },
    {
      id: 'tx-hist-d6-2',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'in',
      amount: 580000,
      paymentMethod: 'qris',
      categoryId: 'cat_in_sales',
      categoryName: 'Penjualan Menu Makanan & Minuman',
      description: 'Pesanan QRIS Makan Siang Meja 3 & 5',
      date: getRelativeDateStr(6),
      time: '13:00',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 6 + 3600000 * 13).toISOString(),
    },
    {
      id: 'tx-hist-d6-3',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      type: 'out',
      amount: 150000,
      paymentMethod: 'cash',
      categoryId: 'cat_out_bahan',
      categoryName: 'Bahan Baku (Pasar/Daging/Sayur/Bumbu)',
      description: 'Bahan Baku Dasar & Es Kristal 3 Sak',
      date: getRelativeDateStr(6),
      time: '07:15',
      createdByRole: 'cashier',
      createdByName: 'Bima (Kasir Pagi)',
      createdAt: new Date(Date.now() - 86400000 * 6 + 3600000 * 7).toISOString(),
    }
  ];

  await db.transactions.bulkPut(histTxs);
}

/**
 * Mengosongkan seluruh database agar aplikasi kembali bersih (Fresh State)
 * Kategori standar F&B tetap dipertahankan agar pencatatan transaksi langsung siap pakai.
 */
export async function resetDatabaseToFresh() {
  localStorage.setItem('kaskedai_fresh_mode', 'true');
  await db.transactions.clear();
  await db.debts.clear();
  await db.shifts.clear();
  await db.stores.clear();
  await db.tenants.clear();
  await db.audit_logs.clear();
  await db.categories.clear();
  await db.raw_materials.clear();
  await db.settlements.clear();
  await db.categories.bulkPut(DEFAULT_CATEGORIES);
}

/**
 * Mengembalikan data demo (Kedai Mas Roy & Bu Tari) beserta transaksi contoh
 */
export async function restoreDemoSeedData() {
  localStorage.removeItem('kaskedai_fresh_mode');
  await db.transactions.clear();
  await db.debts.clear();
  await db.shifts.clear();
  await db.stores.clear();
  await db.tenants.clear();
  await db.audit_logs.clear();
  await db.categories.clear();
  await db.raw_materials.clear();
  await db.settlements.clear();
  await seedInitialDataIfNeeded();
}



