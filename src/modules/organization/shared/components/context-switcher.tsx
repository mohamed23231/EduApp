import type { OrgContextEntry } from '../services/contexts-api.service';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from 'react-native';
import { Pressable, Text, View } from '@/components/ui';
import { useOrgContextStore } from '../store/org-context-store';

type Props = {
  visible: boolean;
  userRole: string | null;
  orgs: OrgContextEntry[];
  onClose: () => void;
  onSelectOrg: (orgId: string) => void;
  onSelectPersonal: () => void;
};

export function ContextSwitcher({ visible, userRole, orgs, onClose, onSelectOrg, onSelectPersonal }: Props) {
  const { t } = useTranslation();
  const activeContext = useOrgContextStore.use.activeContext();
  const activeOrgId = useOrgContextStore.use.activeOrgId();
  const setContext = useOrgContextStore.use.setContext();

  const handlePersonal = useCallback(() => {
    setContext('personal');
    onSelectPersonal();
    onClose();
  }, [setContext, onSelectPersonal, onClose]);

  const handleOrg = useCallback((orgId: string) => {
    setContext('org', orgId);
    onSelectOrg(orgId);
    onClose();
  }, [setContext, onSelectOrg, onClose]);

  const isManager = userRole === 'MANAGER';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose} />
      <View className="rounded-t-[32px] bg-white px-6 pt-5 pb-10">
        <View className="mb-1 items-center">
          <View className="h-1 w-12 rounded-full bg-slate-200" />
        </View>
        <Text className="font-inter mt-3 mb-4 text-xl font-semibold text-slate-900">
          {t('contextSwitcher.title')}
        </Text>
        {!isManager && (
          <Pressable
            className={`mb-2 rounded-2xl p-4 ${activeContext === 'personal' ? 'bg-indigo-50' : 'bg-slate-50'}`}
            onPress={handlePersonal}
          >
            <Text className={`font-inter text-base font-semibold ${activeContext === 'personal' ? 'text-indigo-700' : 'text-slate-800'}`}>
              {t('contextSwitcher.personal')}
            </Text>
            <Text className="font-inter mt-0.5 text-sm text-slate-500">
              {t('contextSwitcher.personalDesc')}
            </Text>
          </Pressable>
        )}
        {orgs.map(org => (
          <Pressable
            key={org.organizationId}
            className={`mb-2 rounded-2xl p-4 ${activeContext === 'org' && activeOrgId === org.organizationId ? 'bg-emerald-50' : 'bg-slate-50'}`}
            onPress={() => handleOrg(org.organizationId)}
          >
            <Text className={`font-inter text-base font-semibold ${activeContext === 'org' && activeOrgId === org.organizationId ? 'text-emerald-700' : 'text-slate-800'}`}>
              {org.name}
            </Text>
            <Text className="font-inter mt-0.5 text-sm text-slate-500">
              {org.role === 'OWNER'
                ? t('contextSwitcher.roleManager')
                : t('contextSwitcher.roleTeacher')}
            </Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}
