/**
 * BatchRatingSheet component
 * Allows teachers to apply a rating to all unmarked students at once.
 * Critical UX improvement: 100 students × 1 click = 1 click (vs 1000 clicks)
 */

import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, View } from 'react-native';
import { Modal, Text } from '@/components/ui';

// Order: 10 first (best), then descending to 0
const RATING_OPTIONS = [10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0] as const;

type BatchRatingSheetProps = {
  ref?: React.RefObject<BottomSheetModal | null>;
  unmarkedCount: number;
  onApply: (rating: number) => void;
};

export function BatchRatingSheet({
  ref,
  unmarkedCount,
  onApply,
}: BatchRatingSheetProps) {
  const { t } = useTranslation();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);

  const handleApply = useCallback(() => {
    if (selectedRating !== null) {
      onApply(selectedRating);
      ref?.current?.dismiss();
      setSelectedRating(null);
    }
  }, [selectedRating, onApply, ref]);

  return (
    <Modal ref={ref} snapPoints={['58%']} title={t('teacher.attendance.batchRating')}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="flash" size={24} color="#F59E0B" />
          <Text style={styles.description}>
            {t('teacher.attendance.batchRatingDescription', { count: unmarkedCount })}
          </Text>
        </View>

        <View style={styles.ratingGrid}>
          {RATING_OPTIONS.map(rating => (
            <Pressable
              key={rating}
              style={[
                styles.ratingOption,
                selectedRating === rating && styles.ratingOptionSelected,
              ]}
              onPress={() => setSelectedRating(rating)}
            >
              <Text
                style={[
                  styles.ratingText,
                  selectedRating === rating && styles.ratingTextSelected,
                ]}
              >
                {rating}
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[
            styles.applyButton,
            selectedRating === null && styles.applyButtonDisabled,
          ]}
          onPress={handleApply}
          disabled={selectedRating === null}
        >
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={selectedRating === null ? '#9CA3AF' : '#FFFFFF'}
          />
          <Text
            style={[
              styles.applyButtonText,
              selectedRating === null && styles.applyButtonTextDisabled,
            ]}
          >
            {selectedRating !== null
              ? t('teacher.attendance.applyToAll', {
                  rating: selectedRating,
                  count: unmarkedCount,
                })
              : t('teacher.attendance.selectRatingFirst')}
          </Text>
        </Pressable>

        <View style={styles.tipContainer}>
          <Ionicons name="bulb-outline" size={16} color="#6B7280" />
          <Text style={styles.tipText}>
            {t('teacher.attendance.batchRatingTip')}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  applyButton: {
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    flexDirection: 'row',
    gap: 8,
    height: 52,
    justifyContent: 'center',
    marginBottom: 16,
  },
  applyButtonDisabled: {
    backgroundColor: '#E5E7EB',
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  applyButtonTextDisabled: {
    color: '#9CA3AF',
  },
  container: {
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  description: {
    color: '#6B7280',
    flex: 1,
    fontSize: 14,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  ratingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 20,
  },
  ratingOption: {
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderColor: '#E5E7EB',
    borderRadius: 12,
    borderWidth: 2,
    height: 52,
    justifyContent: 'center',
    width: 52,
  },
  ratingOptionSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: '#3B82F6',
  },
  ratingText: {
    color: '#6B7280',
    fontSize: 18,
    fontWeight: '600',
  },
  ratingTextSelected: {
    color: '#3B82F6',
  },
  tipContainer: {
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    flexDirection: 'row',
    gap: 8,
    padding: 12,
  },
  tipText: {
    color: '#92400E',
    flex: 1,
    fontSize: 13,
  },
});
