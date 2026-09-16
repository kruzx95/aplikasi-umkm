import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { db } from '../../db/database';
import { logActivity } from '../../db/logger';
import { Category } from '../../types';
import { 
  X, 
  Tag, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  Lock, 
  Sparkles,
  UtensilsCrossed,
  Layers
} from 'lucide-react';
import confetti from 'canvas-confetti';

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#ef4444', // Rose/Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#64748b', // Slate
];

export const CategoryManagerModal: React.FC = () => {
  const { 
    isCategoryModalOpen, 
    setIsCategoryModalOpen, 
    activeStore, 
    activeTenant, 
    role, 
    currentActorName,
    refreshAllData 
  } = useApp();

  const [activeTab, setActiveTab] = useState<'in' | 'out'>('in');
  const [categories, setCategories] = useState<Category[]>([]);
  
  // Form State
  const [newCatName, setNewCatName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('');

  const loadCategories = async () => {
    const all = await db.categories.toArray();
    setCategories(all);
  };

  useEffect(() => {
    if (isCategoryModalOpen) {
      loadCategories();
    }
  }, [isCategoryModalOpen]);

  if (!isCategoryModalOpen) return null;

  const filteredCategories = categories.filter(c => c.type === activeTab);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      alert('Nama kategori tidak boleh kosong!');
      return;
    }

    const newId = `cat_${activeTab}_${Date.now()}`;
    const newCat: Category = {
      id: newId,
      name: newCatName.trim(),
      type: activeTab,
      icon: activeTab === 'in' ? 'TrendingUp' : 'ShoppingBag',
      color: selectedColor,
      isDefault: false,
    };

    await db.categories.add(newCat);

    if (activeTenant && activeStore) {
      await logActivity({
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        storeName: `${activeStore.name} - ${activeStore.branchName}`,
        actorRole: role,
        actorName: currentActorName,
        actionType: 'CATEGORY_ADD',
        description: `Menambahkan kategori baru: "${newCatName.trim()}" (${activeTab === 'in' ? 'Pemasukan' : 'Pengeluaran'})`,
        metadata: { categoryId: newId, name: newCatName.trim(), type: activeTab }
      });
    }

    confetti({
      particleCount: 25,
      spread: 50,
      origin: { y: 0.6 },
      colors: [selectedColor, '#10b981']
    });

    setNewCatName('');
    await loadCategories();
    await refreshAllData();
  };

  const handleStartEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditingName(cat.name);
    setEditingColor(cat.color);
  };

  const handleSaveEdit = async (catId: string) => {
    if (!editingName.trim()) return;
    await db.categories.update(catId, {
      name: editingName.trim(),
      color: editingColor
    });
    setEditingId(null);
    await loadCategories();
    await refreshAllData();
  };

  const handleDeleteCategory = async (cat: Category) => {
    if (cat.isDefault) {
      alert('Kategori bawaan sistem tidak dapat dihapus.');
      return;
    }

    // Check if category is used by transactions
    const usedCount = await db.transactions.where('categoryId').equals(cat.id).count();
    if (usedCount > 0) {
      const confirmForce = window.confirm(
        `Kategori "${cat.name}" saat ini digunakan oleh ${usedCount} transaksi. Yakin tetap ingin menghapusnya? Riwayat transaksi lama akan tetap tersimpan.`
      );
      if (!confirmForce) return;
    } else {
      if (!window.confirm(`Hapus kategori "${cat.name}"?`)) return;
    }

    await db.categories.delete(cat.id);

    if (activeTenant && activeStore) {
      await logActivity({
        tenantId: activeTenant.id,
        storeId: activeStore.id,
        storeName: `${activeStore.name} - ${activeStore.branchName}`,
        actorRole: role,
        actorName: currentActorName,
        actionType: 'CATEGORY_DELETE',
        description: `Menghapus kategori kustom: "${cat.name}"`,
        metadata: { categoryId: cat.id, name: cat.name }
      });
    }

    await loadCategories();
    await refreshAllData();
  };

  return (
    <div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
      <div className="modal-content category-manager-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="cat-modal-title-wrap">
            <div className="cat-icon-badge">
              <Tag size={20} className="text-emerald" />
            </div>
            <div>
              <h3>Kelola Kategori Pos Kas</h3>
              <p className="text-muted text-xs">Atur kategori pemasukan & pengeluaran khas operasional kedai</p>
            </div>
          </div>
          <button className="icon-btn" onClick={() => setIsCategoryModalOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {/* Tab Switcher: Pemasukan vs Pengeluaran */}
          <div className="tx-type-toggle">
            <button
              type="button"
              className={`type-btn in-btn ${activeTab === 'in' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('in');
                setSelectedColor(PRESET_COLORS[0]);
              }}
            >
              Pos Pemasukan ({categories.filter(c => c.type === 'in').length})
            </button>
            <button
              type="button"
              className={`type-btn out-btn ${activeTab === 'out' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('out');
                setSelectedColor(PRESET_COLORS[6]); // default red/rose
              }}
            >
              Pos Pengeluaran ({categories.filter(c => c.type === 'out').length})
            </button>
          </div>

          {/* Add Category Form Card */}
          <div className="cat-add-card">
            <div className="cat-add-title text-xs font-bold text-muted uppercase">
              <Plus size={14} /> Tambah Kategori {activeTab === 'in' ? 'Pemasukan' : 'Pengeluaran'} Baru
            </div>
            <form onSubmit={handleAddCategory} className="cat-add-form">
              <div className="cat-form-row">
                <input
                  type="text"
                  className="form-input cat-input-field"
                  placeholder={activeTab === 'in' ? 'Contoh: Jasa Katering Box / Merchandise Kedai' : 'Contoh: Es Batu Kristal / Gas Elpiji 3kg / Parkir'}
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  required
                />
                <button type="submit" className="btn btn-primary cat-btn-submit">
                  <Plus size={16} />
                  <span>Tambah</span>
                </button>
              </div>

              {/* Color Palette Picker */}
              <div className="cat-color-picker-row">
                <span className="text-muted text-xs">Pilih Warna:</span>
                <div className="color-dots-group">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`color-dot-btn ${selectedColor === c ? 'active' : ''}`}
                      style={{ backgroundColor: c }}
                      onClick={() => setSelectedColor(c)}
                      title={c}
                    />
                  ))}
                </div>
              </div>
            </form>
          </div>

          {/* Category List */}
          <div className="cat-list-wrapper">
            <div className="cat-list-header text-xs font-bold text-muted uppercase">
              Daftar Kategori Aktif ({filteredCategories.length})
            </div>

            <div className="cat-items-list">
              {filteredCategories.map((cat) => {
                const isEditing = editingId === cat.id;

                return (
                  <div key={cat.id} className="cat-item-row">
                    {isEditing ? (
                      <div className="cat-edit-inline-wrap">
                        <input
                          type="text"
                          className="form-input cat-inline-input"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          autoFocus
                        />
                        <div className="cat-edit-colors">
                          {PRESET_COLORS.slice(0, 5).map((col) => (
                            <button
                              key={col}
                              type="button"
                              className={`color-dot-mini ${editingColor === col ? 'active' : ''}`}
                              style={{ backgroundColor: col }}
                              onClick={() => setEditingColor(col)}
                            />
                          ))}
                        </div>
                        <button 
                          type="button" 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleSaveEdit(cat.id)}
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm"
                          onClick={() => setEditingId(null)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="cat-item-info">
                          <span 
                            className="cat-color-circle" 
                            style={{ backgroundColor: cat.color }} 
                          />
                          <span className="cat-item-name">{cat.name}</span>
                          {cat.isDefault ? (
                            <span className="badge badge-system" title="Kategori standar sistem">
                              <Lock size={10} /> Bawaan
                            </span>
                          ) : (
                            <span className="badge badge-custom" title="Kategori kustom buatan kedai">
                              <Sparkles size={10} /> Kustom
                            </span>
                          )}
                        </div>

                        <div className="cat-item-actions">
                          <button
                            type="button"
                            className="icon-btn-edit"
                            onClick={() => handleStartEdit(cat)}
                            title="Ubah Nama Kategori"
                          >
                            <Edit2 size={14} />
                          </button>

                          {cat.isDefault ? (
                            <button
                              type="button"
                              className="icon-btn-disabled"
                              disabled
                              title="Kategori bawaan sistem tidak dapat dihapus"
                            >
                              <Lock size={14} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="icon-btn-danger"
                              onClick={() => handleDeleteCategory(cat)}
                              title="Hapus Kategori"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={() => setIsCategoryModalOpen(false)}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
