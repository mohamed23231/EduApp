import * as React from 'react';
import { Pressable, Text, View } from 'react-native';

import colors from '@/components/ui/colors';

type ErrorStateProps = {
  title?: string;
  body?: string;
  action?: { label: string; onPress: () => void };
  testID?: string;
};

export function ErrorState({
  title = 'Something went wrong',
  body,
  action,
  testID,
}: ErrorStateProps) {
  return (
    <View
      testID={testID}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 32,
        paddingHorizontal: 24,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 24,
          backgroundColor: `${colors.semantic.absent}1A`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <Text
          style={{
            fontSize: 22,
            color: colors.semantic.absent,
          }}
        >
          ⚠
        </Text>
      </View>

      <Text
        style={{
          fontSize: 18,
          fontWeight: '700',
          color: colors.neutral.ink,
          textAlign: 'center',
          marginBottom: 8,
        }}
      >
        {title}
      </Text>

      {body
        ? (
            <Text
              style={{
                fontSize: 14,
                fontWeight: '400',
                color: colors.neutral.inkMuted,
                textAlign: 'center',
                lineHeight: 20,
                marginStart: 16,
                marginEnd: 16,
              }}
            >
              {body}
            </Text>
          )
        : null}

      {action
        ? (
            <Pressable
              testID={testID ? `${testID}-action` : undefined}
              onPress={action.onPress}
              style={{
                marginTop: 20,
                backgroundColor: colors.brand.primary,
                borderRadius: colors.radii.r1,
                paddingHorizontal: 24,
                paddingVertical: 12,
              }}
            >
              <Text
                style={{
                  color: colors.brand.primaryInk,
                  fontWeight: '600',
                  fontSize: 14,
                }}
              >
                {action.label}
              </Text>
            </Pressable>
          )
        : null}
    </View>
  );
}
