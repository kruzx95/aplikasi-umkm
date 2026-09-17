import React, { createContext, useContext, useState, useEffect } from 'react';
import { db } from '../db/database';
import { seedInitialDataIfNeeded } from '../db/seedData';
import { Tenant, Store, Shift, UserRole } from '../types';

interface AppContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  currentActorName: string;
  setCurrentActorName: (name: string) => void;
  
  tenants: Tenant[];
  activeTenant: Tenant | null;
  setActiveTenant: (tenant: Tenant) => void;
  
  stores: Store[];
  activeStore: Store | null;
  setActiveStore: (store: Store) => void;
  
  activeShift: Shift | null;
  refreshActiveShift: () => Promise<void>;
  
  activeTab: string;
  setActiveTab: (tab: string) => void;
  
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  
  isOnline: boolean;
  refreshAllData: () => Promise<void>;
  
  // Overdue Kasbon Counter
  overdueDebtsCount: number;
  refreshOverdueDebtsCount: () => Promise<void>;

  // Online Food & Settlement Counter
  pendingSettlementCount: number;
  pendingSettlementTotal: number;
  refreshSettlementData: () => Promise<void>;

  // Raw Material Inventory Counter
  lowStockCount: number;
  refreshLowStockCount: () => Promise<void>;

  // Modal Triggers
  isAddTxOpen: boolean;
  setIsAddTxOpen: (open: boolean) => void;
  isShiftModalOpen: boolean;
  setIsShiftModalOpen: (open: boolean) => void;
  isStoreModalOpen: boolean;
  setIsStoreModalOpen: (open: boolean) => void;
  isBackupModalOpen: boolean;
  setIsBackupModalOpen: (open: boolean) => void;
  isCategoryModalOpen: boolean;
  setIsCategoryModalOpen: (open: boolean) => void;
  isRoleModalOpen: boolean;
  setIsRoleModalOpen: (open: boolean) => void;
  isSettlementModalOpen: boolean;
  setIsSettlementModalOpen: (open: boolean) => void;
  isRawMaterialModalOpen: boolean;
  setIsRawMaterialModalOpen: (open: boolean) => void;

  // Impersonation
  isImpersonating: boolean;
  startImpersonation: (tenant: Tenant) => Promise<void>;
  exitImpersonation: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRoleState] = useState<UserRole>('owner');
  const [currentActorName, setCurrentActorName] = useState<string>('Mas Roy (Owner)');
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenantState] = useState<Tenant | null>(null);
  const [stores, setStores] = useState<Store[]>([]);
  const [activeStore, setActiveStoreState] = useState<Store | null>(null);
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  const [overdueDebtsCount, setOverdueDebtsCount] = useState<number>(0);
  const [pendingSettlementCount, setPendingSettlementCount] = useState<number>(0);
  const [pendingSettlementTotal, setPendingSettlementTotal] = useState<number>(0);
  const [lowStockCount, setLowStockCount] = useState<number>(0);
  const [isImpersonating, setIsImpersonating] = useState<boolean>(false);

  // Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSettlementModalOpen, setIsSettlementModalOpen] = useState(false);
  const [isRawMaterialModalOpen, setIsRawMaterialModalOpen] = useState(false);

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Theme effect
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const refreshOverdueDebtsCount = async () => {
    if (!activeStore) {
      setOverdueDebtsCount(0);
      return;
    }
    const today = new Date().toISOString().split('T')[0];
    const count = await db.debts
      .where('storeId')
      .equals(activeStore.id)
      .filter(d => d.status === 'unpaid' && d.dueDate < today)
      .count();
    setOverdueDebtsCount(count);
  };

  const refreshSettlementData = async () => {
    if (!activeStore) {
      setPendingSettlementCount(0);
      setPendingSettlementTotal(0);
      return;
    }
    const pendingTxs = await db.transactions
      .where('storeId')
      .equals(activeStore.id)
      .filter(t => t.type === 'in' && !!t.channel && t.channel !== 'offline' && t.settlementStatus === 'pending')
      .toArray();
    
    setPendingSettlementCount(pendingTxs.length);
    const total = pendingTxs.reduce((sum, t) => sum + (t.netAmount || t.amount || 0), 0);
    setPendingSettlementTotal(total);
  };

  const refreshLowStockCount = async () => {
    if (!activeStore) {
      setLowStockCount(0);
      return;
    }
    const lowCount = await db.raw_materials
      .where('storeId')
      .equals(activeStore.id)
      .filter(rm => rm.currentStock <= rm.minStockAlert)
      .count();
    setLowStockCount(lowCount);
  };

  // Initial seed and load
  const loadData = async () => {
    await seedInitialDataIfNeeded();
    
    const allTenants = await db.tenants.toArray();
    setTenants(allTenants);

    if (allTenants.length > 0) {
      const selectedTenant = allTenants.find(t => t.id === 'tenant-mas-roy') || allTenants[0];
      setActiveTenantState(selectedTenant);

      const tenantStores = await db.stores.where('tenantId').equals(selectedTenant.id).toArray();
      setStores(tenantStores);
      if (tenantStores.length > 0) {
        const defaultStore = tenantStores.find(s => s.id === 'store-roy-ruko') || tenantStores[0];
        setActiveStoreState(defaultStore);
      }
    } else {
      setActiveTenantState(null);
      setStores([]);
      setActiveStoreState(null);
      setRoleState('superadmin');
      setActiveTab('admin-tenants');
    }
  };

  const refreshActiveShift = async () => {
    if (!activeStore) {
      setActiveShift(null);
      return;
    }
    const currentOpenShift = await db.shifts
      .where({ storeId: activeStore.id, status: 'open' })
      .first();
    setActiveShift(currentOpenShift || null);
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (activeStore) {
      refreshActiveShift();
      refreshOverdueDebtsCount();
      refreshSettlementData();
      refreshLowStockCount();
    }
  }, [activeStore]);

  const setActiveTenant = async (tenant: Tenant) => {
    setActiveTenantState(tenant);
    const tenantStores = await db.stores.where('tenantId').equals(tenant.id).toArray();
    setStores(tenantStores);
    if (tenantStores.length > 0) {
      setActiveStoreState(tenantStores[0]);
    } else {
      setActiveStoreState(null);
    }
  };

  const setActiveStore = (store: Store) => {
    setActiveStoreState(store);
  };

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (newRole === 'superadmin') {
      setCurrentActorName('Superadmin Platform (Kruza)');
      setActiveTab('admin-tenants');
    } else if (newRole === 'owner') {
      setCurrentActorName(activeTenant ? activeTenant.ownerName : 'Pemilik Kedai');
      if (activeTab.startsWith('admin-')) {
        setActiveTab('dashboard');
      }
    } else {
      // Cashier
      setCurrentActorName('Bima (Kasir)');
      if (activeTab.startsWith('admin-') || activeTab === 'logs' || activeTab === 'reports' || activeTab === 'dashboard') {
        setActiveTab('transactions');
      }
    }
  };

  const refreshAllData = async () => {
    const allTenants = await db.tenants.toArray();
    setTenants(allTenants);
    if (allTenants.length === 0) {
      setActiveTenantState(null);
      setStores([]);
      setActiveStoreState(null);
      setRoleState('superadmin');
      setActiveTab('admin-tenants');
    } else if (activeTenant) {
      const updatedTenant = await db.tenants.get(activeTenant.id);
      if (updatedTenant) {
        setActiveTenantState(updatedTenant);
        const tenantStores = await db.stores.where('tenantId').equals(activeTenant.id).toArray();
        setStores(tenantStores);
      } else {
        // Active tenant was deleted, fallback to first remaining
        const nextTenant = allTenants[0];
        setActiveTenantState(nextTenant);
        const nextStores = await db.stores.where('tenantId').equals(nextTenant.id).toArray();
        setStores(nextStores);
        setActiveStoreState(nextStores[0] || null);
      }
    }
    await refreshActiveShift();
    await refreshOverdueDebtsCount();
    await refreshSettlementData();
    await refreshLowStockCount();
  };

  const startImpersonation = async (tenant: Tenant) => {
    setIsImpersonating(true);
    setActiveTenantState(tenant);
    const tenantStores = await db.stores.where('tenantId').equals(tenant.id).toArray();
    setStores(tenantStores);
    if (tenantStores.length > 0) {
      setActiveStoreState(tenantStores[0]);
    } else {
      setActiveStoreState(null);
    }
    setRoleState('owner');
    setCurrentActorName(`Superadmin (${tenant.ownerName})`);
    setActiveTab('dashboard');
  };

  const exitImpersonation = () => {
    setIsImpersonating(false);
    setRoleState('superadmin');
    setCurrentActorName('Superadmin Platform (Kruza)');
    setActiveTab('admin-tenants');
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentActorName,
        setCurrentActorName,
        tenants,
        activeTenant,
        setActiveTenant,
        stores,
        activeStore,
        setActiveStore,
        activeShift,
        refreshActiveShift,
        activeTab,
        setActiveTab,
        theme,
        toggleTheme,
        isOnline,
        refreshAllData,
        overdueDebtsCount,
        refreshOverdueDebtsCount,
        pendingSettlementCount,
        pendingSettlementTotal,
        refreshSettlementData,
        lowStockCount,
        refreshLowStockCount,
        isImpersonating,
        startImpersonation,
        exitImpersonation,
        isAddTxOpen,
        setIsAddTxOpen,
        isShiftModalOpen,
        setIsShiftModalOpen,
        isStoreModalOpen,
        setIsStoreModalOpen,
        isBackupModalOpen,
        setIsBackupModalOpen,
        isCategoryModalOpen,
        setIsCategoryModalOpen,
        isRoleModalOpen,
        setIsRoleModalOpen,
        isSettlementModalOpen,
        setIsSettlementModalOpen,
        isRawMaterialModalOpen,
        setIsRawMaterialModalOpen,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
