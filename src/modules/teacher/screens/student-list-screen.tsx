/**
 * StudentListScreen component
 * Paginated student list with search
 */

import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Text } from '@/components/ui';
import { useStudents } from '../hooks';

export function StudentListScreen() {
  const { t } = useTranslation();
  const router = useRouter();

  const {
    students,
    isLoading,
    error,
    search,
    setSearch,
    loadMore,
    refetch,
  } = useStudents();

  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchText);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchText, setSearch]);

  const handleAddStudent = () => {
    router.push('/students/create' as any);
  };

  const renderStudentItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.studentItem}
      onPress={() => router.push(`/students/${item.id}/edit` as any)}
    >
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.name}</Text>
        {item.gradeLevel && (
          <Text style={styles.studentGrade}>{item.gradeLevel}</Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={24} color="#6B7280" />
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.centeredContainer}>
      <Text style={styles.emptyText}>{t('teacher.students.emptyMessage')}</Text>
      <Button
        label={t('teacher.students.createButton')}
        onPress={handleAddStudent}
        style={{ marginTop: 16 }}
      />
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.centeredContainer}>
      <Text style={styles.errorText}>{error}</Text>
      <Button
        label={t('teacher.common.retry')}
        onPress={refetch}
        style={{ marginTop: 12 }}
      />
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{t('teacher.students.title')}</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddStudent}
        >
          <Ionicons name="add-circle" size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Input
          placeholder={t('teacher.students.searchPlaceholder')}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      {isLoading && students.length === 0 ? (
        <View style={styles.centeredContainer}>
          <ActivityIndicator size="large" />
        </View>
      ) : error ? (
        renderErrorState()
      ) : students.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={students}
          renderItem={renderStudentItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={() => (
            isLoading && students.length > 0 && (
              <View style={styles.listFooter}>
                <ActivityIndicator size="small" />
              </View>
            )
          )}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  addButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  listFooter: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  studentGrade: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 4,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#DC2626',
    textAlign: 'center',
  },
});
