import * as React from 'react';
import { Text, View } from 'react-native';
import { Monogram, useMonogramTone } from '@/components/ui';
import colors from '@/components/ui/colors';

export type ProfileHeaderProps = {
  displayName: string;
  identifier: string;
  userId: string;
};

export function ProfileHeader({ displayName, identifier, userId }: ProfileHeaderProps) {
  const tone = useMonogramTone(userId || displayName);
  return (
    <View style={{ paddingTop: 24, paddingHorizontal: 20, paddingBottom: 20, alignItems: 'center' }}>
      <Monogram name={displayName || '?'} tone={tone} size={80} ring />
      <Text
        style={{
          color: colors.neutral.ink,
          fontSize: 20,
          fontWeight: '700',
          letterSpacing: -0.3,
          marginTop: 14,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {displayName}
      </Text>
      <Text
        style={{
          color: colors.neutral.inkMuted,
          fontSize: 13,
          fontWeight: '500',
          marginTop: 4,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {identifier}
      </Text>
    </View>
  );
}
