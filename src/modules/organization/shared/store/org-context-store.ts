import { create } from 'zustand';
import { getItem, removeItem, setItem } from '@/lib/storage';
import { createSelectors } from '@/lib/utils';

const ACTIVE_CONTEXT_KEY = 'org_active_context';
const ACTIVE_ORG_ID_KEY = 'org_active_org_id';

type OrgEntry = {
  membershipId: string;
  organizationId: string;
  role: 'OWNER' | 'TEACHER';
  name: string;
  slug: string;
};

type OrgContextState = {
  activeContext: 'personal' | 'org';
  activeOrgId: string | null;
  orgs: OrgEntry[];
  setContext: (context: 'personal' | 'org', orgId?: string) => void;
  setOrgs: (orgs: OrgEntry[]) => void;
  hydrate: () => void;
  clear: () => void;
};

const _useOrgContextStore = create<OrgContextState>(set => ({
  activeContext: 'personal',
  activeOrgId: null,
  orgs: [],
  setContext: (context, orgId) => {
    void setItem(ACTIVE_CONTEXT_KEY, context);
    void setItem(ACTIVE_ORG_ID_KEY, orgId ?? null);
    set({ activeContext: context, activeOrgId: orgId ?? null });
  },
  setOrgs: orgs => set({ orgs }),
  hydrate: () => {
    const activeContext = getItem<'personal' | 'org'>(ACTIVE_CONTEXT_KEY) ?? 'personal';
    const activeOrgId = getItem<string | null>(ACTIVE_ORG_ID_KEY) ?? null;
    set({ activeContext, activeOrgId });
  },
  clear: () => {
    removeItem(ACTIVE_CONTEXT_KEY);
    removeItem(ACTIVE_ORG_ID_KEY);
    set({ activeContext: 'personal', activeOrgId: null, orgs: [] });
  },
}));

export const useOrgContextStore = createSelectors(_useOrgContextStore);
export const hydrateOrgContextStore = () => _useOrgContextStore.getState().hydrate();
