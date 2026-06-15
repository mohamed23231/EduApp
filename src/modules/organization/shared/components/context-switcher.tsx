import type { OrgContextEntry } from '../services/contexts-api.service';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from 'react-native';
import { Pressable, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';
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
      <View className="rounded-t-r5 px-6 pt-5 pb-10" style={{ backgroundColor: colors.neutral.card }}>
        <View className="mb-1 items-center">
          <View className="h-1 w-12 rounded-full" style={{ backgroundColor: colors.neutral.rule }} />
        </View>
        <Text className="font-inter mt-3 mb-4 text-xl font-semibold" style={{ color: colors.neutral.ink }}>
          {t('contextSwitcher.title')}
        </Text>
        {!isManager && (
          <Pressable
            className="mb-2 rounded-2xl p-4"
            style={{ backgroundColor: activeContext === 'personal' ? colors.brand.primaryGlow : colors.neutral.cardWarm }}
            onPress={handlePersonal}
            accessibilityLabel={t('contextSwitcher.selectPersonal')}
            accessibilityRole="button"
            accessibilityState={{ selected: activeContext === 'personal' }}
          >
            <Text className="font-inter text-base font-semibold" style={{ color: activeContext === 'personal' ? colors.brand.primaryInk : colors.neutral.inkSoft }}>
              {t('contextSwitcher.personal')}
            </Text>
            <Text className="font-inter mt-0.5 text-sm" style={{ color: colors.neutral.inkMuted }}>
              {t('contextSwitcher.personalDesc')}
            </Text>
          </Pressable>
        )}
        {orgs.map((org) => {
          const isSelected = activeContext === 'org' && activeOrgId === org.organizationId;
          return (
            <Pressable
              key={org.organizationId}
              className="mb-2 rounded-2xl p-4"
              style={{ backgroundColor: isSelected ? colors.brand.primaryGlow : colors.neutral.cardWarm }}
              onPress={() => handleOrg(org.organizationId)}
              accessibilityLabel={t('contextSwitcher.selectOrg', { name: org.name })}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
            >
              <Text className="font-inter text-base font-semibold" style={{ color: isSelected ? colors.brand.primaryInk : colors.neutral.inkSoft }}>
                {org.name}
              </Text>
              <Text className="font-inter mt-0.5 text-sm" style={{ color: colors.neutral.inkMuted }}>
                {org.role === 'OWNER'
                  ? t('contextSwitcher.roleManager')
                  : t('contextSwitcher.roleTeacher')}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}
