import type { OrganizationDetails } from '../types/manager.types';
import { create } from 'zustand';
import { getItem, removeItem, setItem } from '@/lib/storage';
import { createSelectors } from '@/lib/utils';

const ACTIVE_ORG_KEY = 'manager_active_org_id';

type ManagerState = {
  activeOrgId: string | null;
  orgDetailsById: Record<string, OrganizationDetails>;
  hydrate: () => void;
  setActiveOrgId: (orgId: string | null) => void;
  setOrgDetails: (details: OrganizationDetails) => void;
  clear: () => void;
};

const _useManagerStore = create<ManagerState>(set => ({
  activeOrgId: null,
  orgDetailsById: {},

  hydrate: () => {
    set({
      activeOrgId: getItem<string>(ACTIVE_ORG_KEY),
    });
  },

  setActiveOrgId: (orgId) => {
    if (orgId) {
      void setItem(ACTIVE_ORG_KEY, orgId);
    }
    else {
      void removeItem(ACTIVE_ORG_KEY);
    }
    set({ activeOrgId: orgId });
  },

  setOrgDetails: (details) => {
    set(state => ({
      orgDetailsById: {
        ...state.orgDetailsById,
        [details.id]: details,
      },
    }));
  },

  clear: () => {
    void removeItem(ACTIVE_ORG_KEY);
    set({
      activeOrgId: null,
      orgDetailsById: {},
    });
  },
}));

export const useManagerStore = createSelectors(_useManagerStore);

export const hydrateManagerStore = () => _useManagerStore.getState().hydrate();
