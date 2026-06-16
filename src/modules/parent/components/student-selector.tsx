import type { Student } from '@/modules/parent/types';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';
import { StudentAvatar } from './student-avatar';

type StudentSelectorProps = {
  students: Student[];
  selectedId: string | null;
  onSelect: (studentId: string) => void;
};

export function StudentSelector({ students, selectedId, onSelect }: StudentSelectorProps) {
  const { t } = useTranslation();
  const flatListRef = useRef<FlatList>(null);

  const selectedIndex = students.findIndex(s => s.id === selectedId);

  const handleLayout = () => {
    if (selectedIndex >= 0 && flatListRef.current) {
      flatListRef.current.scrollToIndex({ index: selectedIndex, animated: false, viewPosition: 0.5 });
    }
  };

  return (
    <FlatList
      ref={flatListRef}
      horizontal
      data={students}
      keyExtractor={item => item.id}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
      onLayout={handleLayout}
      onScrollToIndexFailed={() => { }}
      renderItem={({ item }) => (
        <View style={styles.itemContainer}>
          <StudentAvatar
            name={item.fullName}
            size="md"
            selected={item.id === selectedId}
            onPress={() => onSelect(item.id)}
            accessibilityLabel={t(
              item.id === selectedId ? 'parent.students.avatarSelected' : 'parent.students.avatarNotSelected',
              { name: item.fullName },
            )}
          />
          {item.gradeLevel && (
            <Text style={styles.gradeLabel}>
              {item.gradeLevel}
            </Text>
          )}
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  itemContainer: {
    alignItems: 'center',
    marginEnd: 16,
    padding: 4,
  },
  gradeLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
  },
});
