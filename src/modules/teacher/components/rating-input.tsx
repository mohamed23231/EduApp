/**
 * RatingInput component
 * Horizontal stepper with +/- buttons for 0–10 integer rating.
 * RTL-aware, 44x44pt minimum touch targets, disabled state support.
 * Validates: Requirements 10.2, 10.3, 10.4, 10.5, 10.6, 10.7
 */

import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { I18nManager, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/components/ui';

type RatingInputProps = {
  value: number | null;
  onChange: (rating: number | null) => void;
  disabled?: boolean;
};

export function RatingInput({ value, onChange, disabled = false }: RatingInputProps) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const handleDecrement = () => {
    if (disabled)
      return;
    if (value === null) {
      onChange(10);
    }
    else if (value > 0) {
      onChange(value - 1);
    }
    else {
      onChange(null);
    }
  };

  const handleIncrement = () => {
    if (disabled)
      return;
    if (value === null) {
      onChange(0);
    }
    else if (value < 10) {
      onChange(value + 1);
    }
  };

  const decrementButton = (
    <Pressable
      style={[styles.stepButton, disabled && styles.stepButtonDisabled]}
      onPress={handleDecrement}
      disabled={disabled}
      accessibilityLabel="Decrease rating"
      accessibilityRole="button"
    >
      <Ionicons name="remove" size={20} color={disabled ? '#D1D5DB' : '#6B7280'} />
    </Pressable>
  );

  const incrementButton = (
    <Pressable
      style={[styles.stepButton, disabled && styles.stepButtonDisabled]}
      onPress={handleIncrement}
      disabled={disabled || value === 10}
      accessibilityLabel="Increase rating"
      accessibilityRole="button"
    >
      <Ionicons name="add" size={20} color={disabled || value === 10 ? '#D1D5DB' : '#6B7280'} />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{t('teacher.attendance.rating')}</Text>
      <View style={[styles.stepper, isRTL && styles.stepperRTL]}>
        {isRTL ? incrementButton : decrementButton}
        <View style={styles.valueContainer}>
          <Text style={[styles.valueText, value === null && styles.placeholderText]}>
            {value === null
              ? t('teacher.attendance.noRating')
              : t('teacher.attendance.ratingLabel', { value })}
          </Text>
        </View>
        {isRTL ? decrementButton : incrementButton}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 6,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepperRTL: {
    flexDirection: 'row-reverse',
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonDisabled: {
    opacity: 0.5,
  },
  valueContainer: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontWeight: '400',
  },
});
