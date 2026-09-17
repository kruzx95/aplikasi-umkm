import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { logActivity } from '../../db/logger';
import { RawMaterial } from '../../types';
import { 
  Layers, 
  Plus, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  ShoppingCart, 
  Minus, 
  X, 
  Check, 
  Package, 
  ShieldAlert,
  ArrowDown,
  ArrowUp,
  Beef,
  Droplets,
  HelpCircle,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';

const CATEGORY_OPTIONS = [
  'Bahan Utama',
  'Topping',
  'Minyak & Lemak',
  'Kemasan',
  'Bumbu & Saus',
  'Lain-lain'
];

const UNIT_OPTIONS = ['kg', 'butir', 'liter', 'kaleng', 'pack', 'pcs', 'blok', 'sak', 'jerigen'];

export const RawMaterialView: React.FC = () => {
  const { 
    activeStore, 
    activeTenant, 
    role, 
    currentActorName,
    setActiveTab,
    setIsAddTxOpen,
    refreshAllData,
    isRawMaterialModalOpen,
    setIsRawMaterialModalOpen
  } = useApp();

  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showLowOnly, setShowLowOnly] = useState<boolean>(false);

  // Edit / Add Modal States
  const [isFormOpen, setIsFormOpen] = useState<boolean>(false);
  const [editingItem, setEditingItem] = useState<RawMaterial | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Bahan Utama',
    currentStock: 10,
    unit: 'kg',
    minStockAlert: 5,
    costPerUnit: 0,
  });

  // Quick Adjust Modal States
  const [adjustItem, setAdjustItem] = useState<RawMaterial | null>(null);
  const [adjustType, setAdjustType] = useState<'add' | 'reduce'>('reduce');
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustNote, setAdjustNote] = useState<string>('');

  const loadMaterials = async () => {
    if (!activeStore) return;
    const items = await db.raw_materials
      .where('storeId')
      .equals(activeStore.id)
      .toArray();
    setMaterials(items);
  };

  useEffect(() => {
    loadMaterials();
  }, [activeStore]);

  // Filter items
  const filteredMaterials = materials.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          m.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'all' || m.category === selectedCategory;
    const matchesLow = !showLowOnly || (m.currentStock <= m.minStockAlert);
    return matchesSearch && matchesCat && matchesLow;
  });

  // Stats
  const totalItems = materials.length;
  const lowStockItems = materials.filter(m => m.currentStock <= m.minStockAlert && m.currentStock > 0);
  const outOfStockItems = materials.filter(m => m.currentStock <= 0);
  const safeItems = materials.filter(m => m.currentStock > m.minStockAlert);

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Bahan Utama',
      currentStock: 10,
      unit: 'kg',
      minStockAlert: 5,
      costPerUnit: 0,
    });
    setIsFormOpen(true);
  };

  const handleOpenEdit = (m: RawMaterial) => {
    setEditingItem(m);
    setFormData({
      name: m.name,
      category: m.category,
      currentStock: m.currentStock,
      unit: m.unit,
      minStockAlert: m.minStockAlert,
      costPerUnit: m.costPerUnit || 0,
    });
    setIsFormOpen(true);
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeStore || !activeTenant) return;
    if (!formData.name.trim()) {
      alert('Nama bahan wajib diisi!');
      return;
    }

    const now = new Date().toISOString();

    if (editingItem) {
      // Update
      await db.raw_materials.update(editingItem.id, {
        name: formData.name.trim(),
        category: formData.category,
        currentStock: formData.currentStock,
        unit: formData.unit,
        minStockAlert: formData.minStockAlert,
        costPerUnit: formData.costPerUnit,
        updatedAt: now,
      });

      await logActivity({
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        storeName: `${activeStore.name} - ${activeStore.branchName}`,
        actorRole: role,
        actorName: currentActorName,
        actionType: 'RAW_MATERIAL_UPDATE',
        description: `Memperbarui data bahan mentah: ${formData.name}`,
      });
    } else {
      // Create new
      const newId = 'rm_' + Date.now();
      await db.raw_materials.add({
        id: newId,
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        name: formData.name.trim(),
        category: formData.category,
        currentStock: formData.currentStock,
        unit: formData.unit,
        minStockAlert: formData.minStockAlert,
        costPerUnit: formData.costPerUnit,
        updatedAt: now,
      });

      await logActivity({
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        storeName: `${activeStore.name} - ${activeStore.branchName}`,
        actorRole: role,
        actorName: currentActorName,
        actionType: 'RAW_MATERIAL_UPDATE',
        description: `Menambahkan bahan mentah baru: ${formData.name} (${formData.currentStock} ${formData.unit})`,
      });
    }

    setIsFormOpen(false);
    await loadMaterials();
    await refreshAllData();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Yakin ingin menghapus bahan baku "${name}"?`)) return;
    await db.raw_materials.delete(id);
    await loadMaterials();
    await refreshAllData();
  };

  const handleQuickAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustItem || !activeStore || !activeTenant || adjustQty <= 0) return;

    const prevStock = adjustItem.currentStock || 0;
    const newStock = adjustType === 'add' ? prevStock + adjustQty : Math.max(0, prevStock - adjustQty);
    const now = new Date().toISOString();

    await db.raw_materials.update(adjustItem.id, {
      currentStock: newStock,
      lastRestockedAt: adjustType === 'add' ? now : adjustItem.lastRestockedAt,
      updatedAt: now,
    });

    await logActivity({
      tenantId: activeTenant.id,
      storeId: activeStore.id,
      storeName: `${activeStore.name} - ${activeStore.branchName}`,
      actorRole: role,
      actorName: currentActorName,
      actionType: adjustType === 'add' ? 'RAW_MATERIAL_RESTOCK' : 'RAW_MATERIAL_UPDATE',
      description: `${adjustType === 'add' ? 'Menambah' : 'Memakai'} stok ${adjustItem.name} ${adjustType === 'add' ? '+' : '-'}${adjustQty} ${adjustItem.unit} (Sisa: ${newStock} ${adjustItem.unit})${adjustNote ? ' - ' + adjustNote : ''}`,
    });

    setAdjustItem(null);
    setAdjustQty(1);
    setAdjustNote('');
    await loadMaterials();
    await refreshAllData();
  };

  return (
    <div className="inventory-view-container">
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
          <h2 className="page-title">Stok Bahan Baku & Logistik Mentah</h2>
          <p className="page-subtitle">
            Pantau sisa bahan harian kedai, catat belanja pasar, dan cegah stok habis mendadak saat jualan.
          </p>
        </div>

        <div className="header-action-btns">
          <button 
            type="button" 
            className="btn btn-secondary btn-sm"
            onClick={() => setIsAddTxOpen(true)}
            title="Catat pengeluaran belanja pasar & otomatis tambah stok fisik"
          >
            <ShoppingCart size={16} />
            <span>Belanja Pasar (Kas Keluar)</span>
          </button>

          <button 
            type="button" 
            className="btn btn-primary btn-sm"
            onClick={handleOpenAdd}
          >
            <Plus size={16} />
            <span>Tambah Bahan Baru</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="inventory-stats-grid">
        <div className="inv-stat-card">
          <div className="stat-header">
            <span className="stat-label">Total Bahan Terdata</span>
            <div className="stat-icon-wrap bg-blue-subtle">
              <Package size={18} className="text-blue" />
            </div>
          </div>
          <strong className="stat-value">{totalItems} <span className="stat-unit">Item</span></strong>
          <span className="stat-sublabel">Seluruh inventaris kedai</span>
        </div>

        <div className="inv-stat-card">
          <div className="stat-header">
            <span className="stat-label">Stok Aman</span>
            <div className="stat-icon-wrap bg-emerald-subtle">
              <CheckCircle2 size={18} className="text-emerald" />
            </div>
          </div>
          <strong className="stat-value text-emerald">{safeItems.length} <span className="stat-unit">Item</span></strong>
          <span className="stat-sublabel">Di atas batas minimal</span>
        </div>

        <div className={`inv-stat-card ${lowStockItems.length > 0 ? 'card-warning-active' : ''}`}>
          <div className="stat-header">
            <span className="stat-label">Stok Menipis</span>
            <div className="stat-icon-wrap bg-amber-subtle">
              <AlertTriangle size={18} className="text-amber" />
            </div>
          </div>
          <strong className="stat-value text-amber">{lowStockItems.length} <span className="stat-unit">Item</span></strong>
          <span className="stat-sublabel">Perlu segera belanja</span>
        </div>

        <div className={`inv-stat-card ${outOfStockItems.length > 0 ? 'card-danger-active' : ''}`}>
          <div className="stat-header">
            <span className="stat-label">Stok Habis / Kritis</span>
            <div className="stat-icon-wrap bg-rose-subtle">
              <ShieldAlert size={18} className="text-danger" />
            </div>
          </div>
          <strong className="stat-value text-danger">{outOfStockItems.length} <span className="stat-unit">Item</span></strong>
          <span className="stat-sublabel">0 tersisa di kedai</span>
        </div>
      </div>

      {/* Urgent Warning Banner */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="low-stock-alert-banner">
          <div className="alert-banner-icon">
            <AlertTriangle size={20} className="text-amber" />
          </div>
          <div className="alert-banner-text">
            <strong>Peringatan Bahan Menipis ({lowStockItems.length + outOfStockItems.length} item):</strong>
            <span>
              {outOfStockItems.length > 0 && `Segera restock ${outOfStockItems.map(m => m.name).join(', ')} (HABIS)! `}
              {lowStockItems.length > 0 && `Bahan mendekati batas minimal: ${lowStockItems.map(m => `${m.name} (sisa ${m.currentStock} ${m.unit})`).join(', ')}.`}
            </span>
          </div>
          <button 
            className="btn btn-sm btn-amber"
            onClick={() => setShowLowOnly(!showLowOnly)}
          >
            {showLowOnly ? 'Tampilkan Semua Bahan' : 'Filter Yang Menipis Saja'}
          </button>
        </div>
      )}

      {/* Toolbar Filters */}
      <div className="inventory-toolbar">
        <div className="inv-search-wrap">
          <Search size={16} className="text-muted" />
          <input
            type="text"
            className="inv-search-input"
            placeholder="Cari nama bahan (terigu, telur, keju, margarin)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-btn" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="inv-category-chips">
          <button
            type="button"
            className={`inv-cat-chip ${selectedCategory === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            Semua
          </button>
          {CATEGORY_OPTIONS.map(cat => (
            <button
              key={cat}
              type="button"
              className={`inv-cat-chip ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Materials List / Grid */}
      {filteredMaterials.length === 0 ? (
        <div className="empty-inventory-state">
          <Layers size={40} className="text-muted" />
          <h4>Tidak Ada Bahan Mentah yang Cocok</h4>
          <p className="text-muted text-xs">
            {searchQuery ? 'Coba ubah kata kunci pencarian Anda.' : 'Klik "+ Tambah Bahan Baru" untuk mulai mendata inventaris kedai.'}
          </p>
        </div>
      ) : (
        <div className="inventory-cards-grid">
          {filteredMaterials.map(item => {
            const isOutOfStock = item.currentStock <= 0;
            const isLowStock = !isOutOfStock && item.currentStock <= item.minStockAlert;
            const percentage = item.minStockAlert > 0 ? Math.min(100, Math.round((item.currentStock / (item.minStockAlert * 2)) * 100)) : 100;

            return (
              <div 
                key={item.id} 
                className={`material-item-card ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'}`}
              >
                <div className="material-card-header">
                  <span className="material-category-pill">{item.category}</span>
                  <div className="material-actions">
                    <button 
                      className="icon-action-btn"
                      onClick={() => handleOpenEdit(item)}
                      title="Edit Data Bahan"
                    >
                      <Edit size={15} />
                    </button>
                    <button 
                      className="icon-action-btn delete"
                      onClick={() => handleDelete(item.id, item.name)}
                      title="Hapus Bahan"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div className="material-card-body">
                  <h4 className="material-name">{item.name}</h4>

                  <div className="stock-level-indicator">
                    <div className="stock-big-num">
                      <strong className={`stock-val ${isOutOfStock ? 'text-danger' : isLowStock ? 'text-amber' : 'text-emerald'}`}>
                        {item.currentStock}
                      </strong>
                      <span className="stock-unit">{item.unit}</span>
                    </div>

                    <div className="stock-status-badge">
                      {isOutOfStock ? (
                        <span className="badge badge-danger">🔴 Habis (0 {item.unit})</span>
                      ) : isLowStock ? (
                        <span className="badge badge-amber">⚠️ Menipis (Min: {item.minStockAlert} {item.unit})</span>
                      ) : (
                        <span className="badge badge-emerald">🟢 Aman (Min: {item.minStockAlert} {item.unit})</span>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="stock-progress-track">
                    <div 
                      className={`stock-progress-bar ${isOutOfStock ? 'bg-danger' : isLowStock ? 'bg-amber' : 'bg-emerald'}`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>

                  {item.costPerUnit && item.costPerUnit > 0 ? (
                    <div className="cost-per-unit-row">
                      <span className="text-muted text-xs">Estimasi Modal Beli:</span>
                      <strong className="text-xs">Rp {item.costPerUnit.toLocaleString('id-ID')} / {item.unit}</strong>
                    </div>
                  ) : null}
                </div>

                <div className="material-card-footer">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm flex-1"
                    onClick={() => {
                      setAdjustItem(item);
                      setAdjustType('reduce');
                      setAdjustQty(1);
                    }}
                    title="Catat bahan yang terpakai saat operasional"
                  >
                    <Minus size={14} />
                    <span>Pakai Stok</span>
                  </button>

                  <button
                    type="button"
                    className="btn btn-emerald-subtle btn-sm flex-1"
                    onClick={() => {
                      setAdjustItem(item);
                      setAdjustType('add');
                      setAdjustQty(1);
                    }}
                    title="Tambah stok fisik tanpa buka form belanja kas"
                  >
                    <Plus size={14} />
                    <span>+ Restock</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah / Edit Bahan */}
      {isFormOpen && (
        <div className="modal-overlay" onClick={() => setIsFormOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Data Bahan Baku' : 'Tambah Bahan Baku Baru'}</h3>
              <button className="icon-btn" onClick={() => setIsFormOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveForm}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nama Bahan Baku</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Misal: Telur Ayam, Terigu Segitiga, Margarin BlueBand"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Kategori</label>
                  <select
                    className="form-input"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {CATEGORY_OPTIONS.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group-flex">
                  <div className="flex-1">
                    <label className="form-label">Stok Saat Ini</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      value={formData.currentStock}
                      onChange={(e) => setFormData({ ...formData, currentStock: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>

                  <div style={{ width: '120px' }}>
                    <label className="form-label">Satuan</label>
                    <select
                      className="form-input"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      {UNIT_OPTIONS.map(u => (
                        <option key={u} value={u}>{u}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group-flex">
                  <div className="flex-1">
                    <label className="form-label">Batas Peringatan Menipis</label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      className="form-input"
                      value={formData.minStockAlert}
                      onChange={(e) => setFormData({ ...formData, minStockAlert: parseFloat(e.target.value) || 0 })}
                      required
                    />
                    <span className="text-muted text-xs">Peringatan muncul jika stok &le; angka ini</span>
                  </div>

                  <div className="flex-1">
                    <label className="form-label">Harga Beli Rata-rata (Rp)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={formData.costPerUnit}
                      onChange={(e) => setFormData({ ...formData, costPerUnit: parseInt(e.target.value, 10) || 0 })}
                    />
                    <span className="text-muted text-xs">Opsional (per {formData.unit})</span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsFormOpen(false)}>
                  Batal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  <span>{editingItem ? 'Simpan Perubahan' : 'Tambahkan Bahan'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Quick Adjust (Pakai Stok / Tambah Stok) */}
      {adjustItem && (
        <div className="sub-modal-overlay" onClick={() => setAdjustItem(null)}>
          <div className="sub-modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{adjustType === 'add' ? 'Tambah Stok Fisik' : 'Catat Pemakaian Stok'}</h3>
              <button className="icon-btn" onClick={() => setAdjustItem(null)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleQuickAdjustSubmit}>
              <div className="modal-body">
                <div className="adjust-item-info">
                  <strong>{adjustItem.name}</strong>
                  <span className="text-muted text-xs">
                    Sisa stok saat ini: <strong>{adjustItem.currentStock} {adjustItem.unit}</strong>
                  </span>
                </div>

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">
                    Jumlah yang {adjustType === 'add' ? 'Ditambahkan' : 'Terpakai'} ({adjustItem.unit})
                  </label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    className="form-input form-input-lg"
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(parseFloat(e.target.value) || 0)}
                    autoFocus
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Catatan Pemakaian (Opsional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={adjustType === 'add' ? 'Misal: Sisa persediaan kemarin' : 'Misal: Terpakai untuk 20 porsi martabak'}
                    value={adjustNote}
                    onChange={(e) => setAdjustNote(e.target.value)}
                  />
                </div>

                <div className="calc-stat-box highlight-box" style={{ marginTop: '0.5rem' }}>
                  <span className="stat-label">Estimasi Stok Setelah Disimpan:</span>
                  <strong className="stat-val text-emerald">
                    {adjustType === 'add' ? (adjustItem.currentStock + adjustQty) : Math.max(0, adjustItem.currentStock - adjustQty)} {adjustItem.unit}
                  </strong>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setAdjustItem(null)}>
                  Batal
                </button>
                <button type="submit" className={`btn ${adjustType === 'add' ? 'btn-primary' : 'btn-danger'}`}>
                  <Check size={16} />
                  <span>Simpan {adjustType === 'add' ? 'Restock' : 'Pemakaian'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
