import type { Student } from '@/modules/parent/types';
import { useRef } from 'react';
import { FlatList, View } from 'react-native';
import { Text } from '@/components/ui';
import { StudentAvatar } from './student-avatar';

type StudentSelectorProps = {
  students: Student[];
  selectedId: string | null;
  onSelect: (studentId: string) => void;
};

export function StudentSelector({ students, selectedId, onSelect }: StudentSelectorProps) {
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
      contentContainerClassName="px-4 py-3"
      onLayout={handleLayout}
      onScrollToIndexFailed={() => { }}
      renderItem={({ item }) => (
        <View className="me-4 items-center p-1">
          <StudentAvatar
            name={item.fullName}
            size="md"
            selected={item.id === selectedId}
            onPress={() => onSelect(item.id)}
          />
          {item.gradeLevel && (
            <Text className="mt-1 text-[11px] text-gray-500">
              {item.gradeLevel}
            </Text>
          )}
        </View>
      )}
    />
  );
}
