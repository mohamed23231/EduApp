import type { Student } from '../../types';
import * as React from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { Icon, Monogram } from '@/components/ui';
import colors from '@/components/ui/colors';
import { UnlinkedBadge } from '../student/unlinked-badge';

/**
 * Horizontal pill row of linked children. Selected pill flips to ink fill;
 * unselected pills are paper cards. Trailing dashed circle is the "+ add child"
 * affordance. Unlinked children render with an amber tint + "Unlinked" pill
 * (Parent States Pass — child-unlinked read-only treatment).
 */

export type ChildSwitcherProps = {
  students: Student[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAddChild: () => void;
  /** Already-translated "Unlinked" pill label. */
  unlinkedLabel?: string;
};

export function ChildSwitcher({ students, selectedId, onSelect, onAddChild, unlinkedLabel }: ChildSwitcherProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 4 }}
    >
      {students.map((student) => {
        const isSelected = student.id === selectedId;
        const isUnlinked = student.linkStatus === 'unlinked';
        const firstName = student.fullName.split(' ')[0];
        const grade = student.gradeLevel;
        return (
          <Pressable
            key={student.id}
            onPress={() => onSelect(student.id)}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            testID={`child-pill-${student.id}`}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              paddingStart: 6,
              paddingEnd: 14,
              paddingVertical: 6,
              borderRadius: 999,
              opacity: !isSelected && isUnlinked ? 0.75 : 1,
              backgroundColor: isSelected
                ? colors.neutral.ink
                : isUnlinked
                  ? colors.semantic.excusedSoft
                  : pressed
                    ? colors.neutral.cardWarm
                    : colors.neutral.card,
              borderWidth: 1.5,
              borderColor: isSelected
                ? colors.neutral.ink
                : isUnlinked
                  ? colors.semantic.excused
                  : colors.neutral.rule,
            })}
          >
            <Monogram name={student.fullName} size={32} ring={isSelected} />
            <View>
              <Text
                style={{
                  color: isSelected ? colors.neutral.white : colors.neutral.ink,
                  fontSize: 13,
                  fontWeight: '700',
                  letterSpacing: -0.1,
                }}
                numberOfLines={1}
              >
                {firstName}
              </Text>
              {isUnlinked && unlinkedLabel
                ? (
                    <View style={{ marginTop: 2 }}>
                      <UnlinkedBadge label={unlinkedLabel} />
                    </View>
                  )
                : grade
                  ? (
                      <Text
                        style={{
                          color: isSelected ? colors.neutral.dim : colors.neutral.inkMuted,
                          fontSize: 10,
                          fontWeight: '500',
                          marginTop: 1,
                        }}
                        numberOfLines={1}
                      >
                        {grade}
                      </Text>
                    )
                  : null}
            </View>
          </Pressable>
        );
      })}
      <Pressable
        onPress={onAddChild}
        accessibilityRole="button"
        testID="add-child-button"
        style={({ pressed }) => ({
          width: 44,
          height: 44,
          borderRadius: 999,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: pressed ? colors.neutral.cardWarm : colors.neutral.card,
          borderWidth: 1.5,
          borderStyle: 'dashed',
          borderColor: colors.neutral.rule,
        })}
      >
        <Icon name="plus" size={16} color={colors.neutral.inkMuted} />
      </Pressable>
    </ScrollView>
  );
}
