import type { OrgStudent } from '../../types/manager.types';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Button, Input, Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { useUpdateStudent } from '../../hooks';
import { useManagerStore } from '../../store/manager-store';

type Props = { student: OrgStudent };

export function StudentEditSection({ student }: Props) {
  const { t } = useTranslation();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const updateMutation = useUpdateStudent(activeOrgId);

  const [parentRelationship, setParentRelationship] = useState(student.parentRelationship ?? '');
  const [tone, setTone] = useState(student.tone ?? '');
  const [isAtRiskManualFlag, setIsAtRiskManualFlag] = useState(student.isAtRiskManualFlag ?? false);
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    try {
      await updateMutation.mutateAsync({
        studentId: student.id,
        input: { parentRelationship: parentRelationship || undefined, tone: tone || undefined, isAtRiskManualFlag },
      });
      setMessage(t('manager.students.editSection.saved', { defaultValue: 'Saved.' }));
    }
    catch (error) {
      setMessage(getApiErrorMessage(error, t('manager.students.editSection.saveError', { defaultValue: 'Unable to save.' })));
    }
  };

  return (
    <View className="mx-4 mt-6 rounded-2xl p-4" style={{ backgroundColor: colors.neutral.card, borderWidth: 1, borderColor: colors.neutral.rule }}>
      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.neutral.inkMuted, textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 }}>
        {t('manager.students.editSection.title', { defaultValue: 'Student profile' })}
      </Text>

      <Input
        label={t('manager.students.editSection.parentRelationship', { defaultValue: 'Relationship to student' })}
        value={parentRelationship}
        onChangeText={setParentRelationship}
      />

      <Input
        label={t('manager.students.editSection.tone', { defaultValue: 'Communication tone' })}
        value={tone}
        onChangeText={setTone}
        multiline
        numberOfLines={2}
      />

      {/* At-risk toggle row */}
      <Pressable
        onPress={() => setIsAtRiskManualFlag(v => !v)}
        className="mt-2 flex-row items-center justify-between rounded-xl p-3"
        style={({ pressed }) => ({ backgroundColor: pressed ? colors.neutral.cardWarm : colors.neutral.paper })}
      >
        <Text style={{ fontSize: 15, color: colors.neutral.ink }}>
          {t('manager.students.editSection.atRiskToggle', { defaultValue: 'Mark as at-risk manually' })}
        </Text>
        <View
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            backgroundColor: isAtRiskManualFlag ? colors.semantic.absent : colors.neutral.rule,
            alignItems: isAtRiskManualFlag ? 'flex-end' : 'flex-start',
            paddingHorizontal: 2,
            justifyContent: 'center',
          }}
        >
          <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#FFFFFF' }} />
        </View>
      </Pressable>

      {message
        ? (
            <Text style={{ marginTop: 8, fontSize: 13, color: colors.neutral.inkMuted }}>{message}</Text>
          )
        : null}

      <Button
        style={{ marginTop: 12 }}
        label={t('manager.students.editSection.save', { defaultValue: 'Save changes' })}
        onPress={submit}
        loading={updateMutation.isPending}
      />
    </View>
  );
}
