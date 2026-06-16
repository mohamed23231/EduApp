import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { OrgStudent } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { memo, useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { Button, Modal, Text } from '@/components/ui';
import colors from '@/components/ui/colors';

type OrgStudentSelectSheetProps = {
  ref?: React.RefObject<BottomSheetModal | null>;
  students: OrgStudent[];
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
};

const StudentPickerRow = memo(({
  student,
  isSelected,
  onToggle,
}: {
  student: OrgStudent;
  isSelected: boolean;
  onToggle: (id: string) => void;
}) => {
  const handlePress = useCallback(() => onToggle(student.id), [onToggle, student.id]);
  return (
    <Pressable
      onPress={handlePress}
      className="flex-row items-center gap-3 rounded-xl border p-3"
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.neutral.cardWarm : colors.neutral.card,
        borderColor: colors.neutral.rule,
      })}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
    >
      <View
        className="size-6 shrink-0 items-center justify-center rounded-md border-2"
        style={{
          borderColor: isSelected ? colors.brand.primary : colors.neutral.rule,
          backgroundColor: isSelected ? colors.brand.primary : 'transparent',
        }}
      >
        {isSelected ? <Ionicons name="checkmark" size={14} color={colors.neutral.white} /> : null}
      </View>
      <View className="flex-1">
        <Text className="text-body-lg font-semibold" style={{ color: colors.neutral.ink }}>{student.name}</Text>
        {student.gradeLevel
          ? <Text className="mt-px text-xs" style={{ color: colors.neutral.inkMuted }}>{student.gradeLevel}</Text>
          : null}
      </View>
    </Pressable>
  );
});

function SelectionCountRow({
  count,
  total,
  onSelectAll,
  onClear,
}: {
  count: number;
  total: number;
  onSelectAll: () => void;
  onClear: () => void;
}) {
  const { t } = useTranslation();
  return (
    <View className="mb-2 flex-row items-center justify-between px-1">
      <Text className="text-body font-medium" style={{ color: colors.neutral.inkMuted }}>
        {t('manager.sessions.selectedCount', { defaultValue: '{{count}} selected', count })}
      </Text>
      <View className="flex-row items-center gap-4">
        {count < total
          ? (
              <Pressable onPress={onSelectAll}>
                <Text className="text-body font-semibold" style={{ color: colors.neutral.ink }}>
                  {t('manager.sessions.selectAll', { defaultValue: 'Select all' })}
                </Text>
              </Pressable>
            )
          : null}
        {count > 0
          ? (
              <Pressable onPress={onClear}>
                <Text className="text-body font-semibold" style={{ color: colors.semantic.absent }}>
                  {t('manager.sessions.clearAll', { defaultValue: 'Clear all' })}
                </Text>
              </Pressable>
            )
          : null}
      </View>
    </View>
  );
}

export function OrgStudentSelectSheet({
  ref,
  students,
  selectedIds,
  onConfirm,
}: OrgStudentSelectSheetProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<string[]>(selectedIds);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q)
      return students;
    return students.filter(s => s.name.toLowerCase().includes(q));
  }, [students, query]);

  const selectedSet = useMemo(() => new Set(draft), [draft]);

  const toggle = useCallback((id: string) => {
    setDraft(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
    );
  }, []);

  const handleConfirm = useCallback(() => {
    onConfirm(draft);
    ref?.current?.dismiss();
  }, [draft, onConfirm, ref]);

  const renderItem = useCallback(
    ({ item }: { item: OrgStudent }) => (
      <StudentPickerRow
        student={item}
        isSelected={selectedSet.has(item.id)}
        onToggle={toggle}
      />
    ),
    [selectedSet, toggle],
  );

  return (
    <Modal
      ref={ref}
      snapPoints={['80%']}
      title={t('manager.sessions.fields.students', { defaultValue: 'Assigned students' })}
    >
      <View className="flex-1 px-4">
        <View
          className="mb-2.5 h-[42px] flex-row items-center gap-2 rounded-xl border px-3"
          style={{ backgroundColor: colors.neutral.paper, borderColor: colors.neutral.rule }}
        >
          <Ionicons name="search-outline" size={16} color={colors.neutral.inkMuted} />
          <TextInput
            className="flex-1 text-body-lg"
            style={{ color: colors.neutral.ink }}
            placeholder={t('manager.students.search', { defaultValue: 'Search students...' })}
            placeholderTextColor={colors.neutral.inkMuted}
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
        </View>

        <SelectionCountRow
          count={draft.length}
          total={students.length}
          onSelectAll={() => setDraft(students.map(s => s.id))}
          onClear={() => setDraft([])}
        />

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          extraData={selectedSet}
          className="flex-1"
          contentContainerClassName="gap-1.5 pb-4"
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={(
            <View className="items-center py-8">
              <Text className="text-sm" style={{ color: colors.neutral.inkMuted }}>
                {t('manager.students.empty', { defaultValue: 'No students found.' })}
              </Text>
            </View>
          )}
        />

        <View className="border-t py-4" style={{ borderTopColor: colors.neutral.rule }}>
          <Button
            label={t('manager.sessions.confirmStudents', { defaultValue: 'Confirm ({{count}})', count: draft.length })}
            onPress={handleConfirm}
            variant="default"
            className="w-full"
          />
        </View>
      </View>
    </Modal>
  );
}
