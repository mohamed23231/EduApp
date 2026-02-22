import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Button, Text } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { useStudents } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';

export function ParentDashboardScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { data: students, isLoading, error, refetch } = useStudents();

  if (isLoading) {
    return (
      <View style={styles.centeredScreen} testID="loading-indicator">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (error) {
    const errorMessage = extractErrorMessage(error, t);
    return (
      <View style={styles.centeredScreen}>
        <Text style={styles.errorText}>
          {errorMessage}
        </Text>
        <Button
          label={t('parent.common.retry')}
          onPress={() => refetch()}
        />
      </View>
    );
  }

  if (!students || students.length === 0) {
    return (
      <View style={styles.centeredScreen}>
        <Text style={styles.emptyTitle}>
          {t('parent.dashboard.emptyTitle')}
        </Text>
        <Text style={styles.emptyDescription}>
          {t('parent.dashboard.emptyMessage')}
        </Text>
        <Button
          label={t('parent.dashboard.linkStudentCta')}
          onPress={() => router.push('/(parent)/students/link')}
        />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('parent.dashboard.title')}</Text>
        <Button
          label={t('parent.dashboard.linkStudentCta')}
          onPress={() => router.push('/(parent)/students/link')}
          fullWidth={false}
          size="sm"
        />
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>{t('parent.dashboard.title')}</Text>
        <Text style={styles.summaryCount}>{students.length}</Text>
      </View>

      <Text style={styles.sectionTitle}>{t('parent.studentList.title')}</Text>

      <FlatList
        data={students}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <Pressable
            style={styles.studentRow}
            onPress={() => router.push(AppRoute.parent.studentDetails(item.id))}
            accessibilityRole="button"
            testID={`student-row-${item.id}`}
          >
            <View>
              <Text style={styles.studentName}>{item.fullName}</Text>
              <Text style={styles.studentSubtext}>{item.schoolName ?? item.grade ?? 'N/A'}</Text>
            </View>
            <Text style={styles.chevron}>{'>'}</Text>
          </Pressable>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  centeredScreen: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyDescription: {
    color: '#4B5563',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  emptyTitle: {
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 12,
    paddingHorizontal: 16,
    paddingTop: 18,
  },
  headerTitle: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '800',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  screen: {
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  sectionTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  studentSubtext: {
    color: '#6B7280',
    fontSize: 13,
    marginTop: 4,
  },
  studentName: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  studentRow: {
    alignItems: 'center',
    borderBottomColor: '#E5E7EB',
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 64,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    borderRadius: 14,
    borderWidth: 1,
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  summaryCount: {
    color: '#1D4ED8',
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
  },
  summaryLabel: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  chevron: {
    color: '#9CA3AF',
    fontSize: 20,
    fontWeight: '600',
  },
});
