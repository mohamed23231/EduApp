/**
 * StudentEditScreen component
 * Form for editing an existing student
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Input, Text } from '@/components/ui';
import { useStudentCrud } from '../hooks';
import { getStudent } from '../services';
import { studentSchema, type StudentFormValues } from '../validators';

export function StudentEditScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();

  const { updateStudent, deleteStudent, isSubmitting } = useStudentCrud();

  const [formData, setFormData] = useState<StudentFormValues>({
    name: '',
    gradeLevel: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadStudent = async () => {
      setIsLoading(true);
      try {
        const student = await getStudent(id as string);
        setFormData({
          name: student.name,
          gradeLevel: student.gradeLevel,
          notes: student.notes,
        });
      }
      catch (error) {
        console.error('Failed to load student:', error);
      }
      finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadStudent();
    }
  }, [id]);

  const handleFieldChange = (field: keyof StudentFormValues) => (value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async () => {
    try {
      studentSchema.parse(formData);
      await updateStudent(id as string, formData);
      router.back();
    }
    catch (error) {
      if (error && typeof error === 'object' && 'issues' in error) {
        const validationErrors: Record<string, string> = {};
        (error as any).issues.forEach((issue: any) => {
          if (issue.path[0]) {
            validationErrors[issue.path[0]] = issue.message;
          }
        });
        setErrors(validationErrors);
      }
      else {
        setErrors({
          form: error instanceof Error ? error.message : t('teacher.common.genericError'),
        });
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      t('teacher.students.deleteConfirmTitle'),
      t('teacher.students.deleteConfirmMessage'),
      [
        {
          text: t('teacher.common.cancel'),
          style: 'cancel',
        },
        {
          text: t('teacher.common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStudent(id as string);
              router.back();
            }
            catch (error) {
              console.error('Failed to delete student:', error);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={['top']} style={styles.container}>
      <KeyboardAvoidingView behavior="padding" style={styles.keyboardAvoidingView}>
        <View style={styles.content}>
          {isLoading ? (
            <View style={styles.centeredContainer}>
              <ActivityIndicator size="large" />
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.backButton}>{t('teacher.common.back')}</Text>
                </TouchableOpacity>
                <Text style={styles.title}>{t('teacher.students.editTitle')}</Text>
              </View>

              <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollContent}>
                <View style={styles.form}>
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{t('teacher.students.form.nameLabel')}</Text>
                    <Input
                      placeholder={t('teacher.students.form.namePlaceholder')}
                      value={formData.name}
                      onChangeText={handleFieldChange('name')}
                      error={errors.name}
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{t('teacher.students.form.gradeLabel')}</Text>
                    <Input
                      placeholder={t('teacher.students.form.gradePlaceholder')}
                      value={formData.gradeLevel}
                      onChangeText={handleFieldChange('gradeLevel')}
                      error={errors.gradeLevel}
                      editable={!isLoading}
                    />
                  </View>

                  <View style={styles.formGroup}>
                    <Text style={styles.label}>{t('teacher.students.form.notesLabel')}</Text>
                    <Input
                      placeholder={t('teacher.students.form.notesLabel')}
                      value={formData.notes}
                      onChangeText={handleFieldChange('notes')}
                      error={errors.notes}
                      multiline
                      numberOfLines={4}
                      editable={!isLoading}
                    />
                  </View>

                  {errors.form && (
                    <Text style={styles.formError}>{errors.form}</Text>
                  )}

                  <View style={styles.buttonRow}>
                    <Button
                      label={isSubmitting ? t('teacher.students.updating') : t('teacher.common.save')}
                      onPress={handleSubmit}
                      loading={isSubmitting}
                      variant="default"
                      style={styles.saveButton}
                    />
                    <Button
                      label={t('teacher.common.delete')}
                      onPress={handleDelete}
                      variant="destructive"
                      style={styles.deleteButton}
                    />
                  </View>
                </View>
              </ScrollView>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    fontSize: 16,
    color: '#3B82F6',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  form: {
    gap: 16,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  formError: {
    fontSize: 14,
    color: '#DC2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  saveButton: {
    flex: 1,
  },
  deleteButton: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
