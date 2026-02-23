/**
 * DayOfWeekPicker component
 * Multi-select day picker (1=Mon through 7=Sun)
 * Validates: Requirements 5.1, 5.2, 5.3, 5.4, 7.2, 7.3, 9.2, 14.1, 15.1, 15.5
 */

import { useTranslation } from 'react-i18next';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui';

type DayOfWeekPickerProps = {
  selectedDays: number[];
  onDaysChange: (days: number[]) => void;
};

const DAYS = [
  { value: 1, label: 'Mon', labelAr: 'الاثنين' },
  { value: 2, label: 'Tue', labelAr: 'الثلاثاء' },
  { value: 3, label: 'Wed', labelAr: 'الأربعاء' },
  { value: 4, label: 'Thu', labelAr: 'الخميس' },
  { value: 5, label: 'Fri', labelAr: 'الجمعة' },
  { value: 6, label: 'Sat', labelAr: 'السبت' },
  { value: 7, label: 'Sun', labelAr: 'الأحد' },
];

export function DayOfWeekPicker({ selectedDays, onDaysChange }: DayOfWeekPickerProps) {
  const { t, i18n } = useTranslation();

  const handleToggle = (day: number) => {
    const newSelectedDays = selectedDays.includes(day)
      ? selectedDays.filter(d => d !== day)
      : [...selectedDays, day];
    onDaysChange(newSelectedDays);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('teacher.sessions.selectDays')}</Text>

      <View style={styles.daysContainer}>
        {DAYS.map(day => {
          const isSelected = selectedDays.includes(day.value);
          const isRTL = i18n.language === 'ar';

          return (
            <TouchableOpacity
              key={day.value}
              style={[
                styles.dayButton,
                isSelected && styles.dayButtonSelected,
                isRTL && styles.dayButtonRTL,
              ]}
              onPress={() => handleToggle(day.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.dayButtonText,
                  isSelected && styles.dayButtonTextSelected,
                ]}
              >
                {isRTL ? day.labelAr : day.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  daysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dayButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    minWidth: 50,
    alignItems: 'center',
  },
  dayButtonSelected: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  dayButtonRTL: {
    flexDirection: 'row-reverse',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  dayButtonTextSelected: {
    color: '#FFFFFF',
  },
});
