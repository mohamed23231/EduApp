/**
 * StudentListHeader + StudentSearchBar — title/add and search controls.
 * Extracted from student-list-screen.
 */

import { Ionicons } from '@expo/vector-icons';
import { I18nManager, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Text } from '@/components/ui';

type StudentListHeaderProps = {
  totalCount: number;
  onAdd: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
};

export function StudentListHeader({ totalCount, onAdd, t }: StudentListHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <Text style={styles.title}>{t('teacher.students.title')}</Text>
        <Text style={styles.subtitle}>
          {t('teacher.students.totalCount', { count: totalCount })}
        </Text>
      </View>
      <Pressable
        onPress={onAdd}
        style={({ pressed }) => [styles.addBtn, pressed && styles.addBtnPressed]}
        accessibilityRole="button"
        accessibilityLabel={t('teacher.students.createButton')}
      >
        <Ionicons name="add" size={22} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

type StudentSearchBarProps = {
  value: string;
  onChange: (text: string) => void;
  t: (key: string) => string;
};

export function StudentSearchBar({ value, onChange, t }: StudentSearchBarProps) {
  return (
    <View style={styles.searchBar}>
      <Ionicons name="search-outline" size={16} color="#9CA3AF" />
      <TextInput
        style={styles.searchInput}
        placeholder={t('teacher.students.searchPlaceholder')}
        placeholderTextColor="#9CA3AF"
        value={value}
        onChangeText={onChange}
        returnKeyType="search"
        clearButtonMode="while-editing"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: { flex: 1 },
  title: { fontSize: 22, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#9CA3AF', marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  addBtnPressed: { backgroundColor: '#2563EB', transform: [{ scale: 0.95 }] },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 10,
    paddingHorizontal: 14,
    height: 44,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
    textAlign: I18nManager.isRTL ? 'right' : 'left',
    writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
  },
});
