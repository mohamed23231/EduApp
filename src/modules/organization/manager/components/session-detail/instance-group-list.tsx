/**
 * InstanceGroupList — renders grouped session instances by date.
 */

import type { OrgSessionInstance } from '../../types/manager.types';
import { View } from 'react-native';
import { SectionLabel, Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { InstanceCard } from './instance-card';

type TranslateFn = (key: string, opts?: Record<string, unknown>) => string;

type Group = { date: string; instances: OrgSessionInstance[] };

type InstanceGroupListProps = {
  groups: Group[];
  onStart: (instanceId: string) => void;
  onClose: (instanceId: string) => void;
  onViewAttendance: (instanceId: string) => void;
  t: TranslateFn;
};

export function InstanceGroupList({
  groups,
  onStart,
  onClose,
  onViewAttendance,
  t,
}: InstanceGroupListProps) {
  return (
    <>
      <View className="px-4">
        <SectionLabel>{t('manager.sessionDetail.recentInstances', { defaultValue: 'Recent instances' })}</SectionLabel>
      </View>

      {groups.length === 0
        ? (
            <View className="items-center py-8">
              <Text style={{ marginTop: 8, fontSize: 13, color: colors.neutral.inkMuted }}>
                {t('manager.sessionDetail.noInstances', { defaultValue: 'No instances found for the last 30 days.' })}
              </Text>
            </View>
          )
        : (
            <View className="mt-3 gap-4 px-4">
              {groups.map(group => (
                <View key={group.date} className="gap-2">
                  <Text style={{ fontSize: 12, color: colors.neutral.inkMuted, fontWeight: '500' }}>{group.date}</Text>
                  {group.instances.map(instance => (
                    <InstanceCard
                      key={instance.id}
                      instance={instance}
                      onStart={() => onStart(instance.id)}
                      onClose={() => onClose(instance.id)}
                      onViewAttendance={() => onViewAttendance(instance.id)}
                      t={t}
                    />
                  ))}
                </View>
              ))}
            </View>
          )}
    </>
  );
}
