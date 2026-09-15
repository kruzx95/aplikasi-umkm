import { db } from './database';
import { Category, Tenant, Store, Transaction, Shift, Debt, AuditLog } from '../types';

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

export async function seedInitialDataIfNeeded() {
  const tenantCount = await db.tenants.count();
  if (tenantCount > 0) {
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
      id: 'debt-2',
      tenantId: 'tenant-mas-roy',
      storeId: 'store-roy-ruko',
      personName: 'Toko Plastik Makmur',
      phone: '081333444555',
      type: 'utang',
      amount: 250000,
      dueDate: todayStr,
      status: 'unpaid',
      description: 'Karton cup takeaway 16oz (2 dus), tempo bayar Sabtu',
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
}
