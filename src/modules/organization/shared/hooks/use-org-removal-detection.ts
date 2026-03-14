import { useEffect, useRef } from 'react';
import { useOrgContextStore } from '../store/org-context-store';
import { useContexts } from './use-contexts';

type Opts = {
  onRemoved: (orgId: string) => void;
};

export function useOrgRemovalDetection({ onRemoved }: Opts) {
  const activeContext = useOrgContextStore.use.activeContext();
  const activeOrgId = useOrgContextStore.use.activeOrgId();
  const setContext = useOrgContextStore.use.setContext();
  const { data } = useContexts();
  const prevOrgsRef = useRef<string[]>([]);

  useEffect(() => {
    if (!data) {
      return;
    }
    const currentOrgIds = data.organizations.map(o => o.organizationId);
    const prev = prevOrgsRef.current;

    if (prev.length > 0 && activeContext === 'org' && activeOrgId) {
      const wasRemoved = prev.includes(activeOrgId) && !currentOrgIds.includes(activeOrgId);
      if (wasRemoved) {
        setContext('personal');
        onRemoved(activeOrgId);
      }
    }
    prevOrgsRef.current = currentOrgIds;
  }, [data, activeContext, activeOrgId, setContext, onRemoved]);
}
