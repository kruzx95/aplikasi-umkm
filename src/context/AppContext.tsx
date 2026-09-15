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
  
  // Modal Triggers
  isAddTxOpen: boolean;
  setIsAddTxOpen: (open: boolean) => void;
  isShiftModalOpen: boolean;
  setIsShiftModalOpen: (open: boolean) => void;
  isStoreModalOpen: boolean;
  setIsStoreModalOpen: (open: boolean) => void;
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

  // Modals
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

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
    if (activeTenant) {
      const updatedTenant = await db.tenants.get(activeTenant.id);
      if (updatedTenant) setActiveTenantState(updatedTenant);

      const tenantStores = await db.stores.where('tenantId').equals(activeTenant.id).toArray();
      setStores(tenantStores);
    }
    await refreshActiveShift();
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
        isAddTxOpen,
        setIsAddTxOpen,
        isShiftModalOpen,
        setIsShiftModalOpen,
        isStoreModalOpen,
        setIsStoreModalOpen,
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
