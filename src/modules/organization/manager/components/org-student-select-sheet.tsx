import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import type { OrgStudent } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Button, Modal, Text } from '@/components/ui';

type OrgStudentSelectSheetProps = {
  ref?: React.RefObject<BottomSheetModal | null>;
  students: OrgStudent[];
  selectedIds: string[];
  onConfirm: (ids: string[]) => void;
};

function StudentPickerRow({
  student,
  isSelected,
  onToggle,
}: {
  student: OrgStudent;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <Pressable
      onPress={onToggle}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isSelected }}
    >
      <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
        {isSelected
          ? <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          : null}
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{student.name}</Text>
        {student.gradeLevel
          ? <Text style={styles.grade}>{student.gradeLevel}</Text>
          : null}
      </View>
    </Pressable>
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
        isSelected={draft.includes(item.id)}
        onToggle={() => toggle(item.id)}
      />
    ),
    [draft, toggle],
  );

  return (
    <Modal
      ref={ref}
      snapPoints={['80%']}
      title={t('manager.sessions.fields.students', { defaultValue: 'Assigned students' })}
    >
      <View style={styles.container}>
        <View style={styles.search}>
          <Ionicons name="search-outline" size={16} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('manager.students.search', { defaultValue: 'Search students...' })}
            placeholderTextColor="#9CA3AF"
            value={query}
            onChangeText={setQuery}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
        </View>

        <View style={styles.countRow}>
          <Text style={styles.countText}>
            {t('manager.sessions.selectedCount', { defaultValue: '{{count}} selected', count: draft.length })}
          </Text>
          <View style={styles.countActions}>
            {draft.length < students.length
              ? (
                  <Pressable onPress={() => setDraft(students.map(s => s.id))}>
                    <Text style={styles.selectAllText}>
                      {t('manager.sessions.selectAll', { defaultValue: 'Select all' })}
                    </Text>
                  </Pressable>
                )
              : null}
            {draft.length > 0
              ? (
                  <Pressable onPress={() => setDraft([])}>
                    <Text style={styles.clearText}>
                      {t('manager.sessions.clearAll', { defaultValue: 'Clear all' })}
                    </Text>
                  </Pressable>
                )
              : null}
          </View>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={(
            <View style={styles.empty}>
              <Text style={styles.emptyText}>
                {t('manager.students.empty', { defaultValue: 'No students found.' })}
              </Text>
            </View>
          )}
        />

        <View style={styles.footer}>
          <Button
            label={t('manager.sessions.confirmStudents', { defaultValue: 'Confirm ({{count}})', count: draft.length })}
            onPress={handleConfirm}
            variant="default"
            style={styles.confirmBtn}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    height: 42,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  countRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  countText: { fontSize: 13, color: '#6B7280', fontWeight: '500' },
  selectAllText: { fontSize: 13, color: '#3B82F6', fontWeight: '600' },
  clearText: { fontSize: 13, color: '#EF4444', fontWeight: '600' },
  countActions: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  list: { flex: 1 },
  listContent: { gap: 6, paddingBottom: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  rowPressed: { backgroundColor: '#EFF6FF' },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxActive: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '600', color: '#111827' },
  grade: { fontSize: 12, color: '#6B7280', marginTop: 1 },
  empty: { alignItems: 'center', paddingVertical: 32 },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
  footer: { paddingVertical: 16, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  confirmBtn: { width: '100%' },
});
