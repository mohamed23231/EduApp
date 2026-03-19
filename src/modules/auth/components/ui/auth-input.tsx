import type { TextInputProps } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, TextInput, View } from 'react-native';

type AuthInputProps = TextInputProps & {
  label: string;
  error?: string;
  isPassword?: boolean;
};

export function AuthInput({ label, error, isPassword, ...inputProps }: AuthInputProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [focused, setFocused] = useState(false);
  const [visible, setVisible] = useState(false);

  const borderClass = focused
    ? 'border-blue-500 border-2'
    : error
      ? 'border-red-500'
      : 'border-gray-300';

  return (
    <View className="gap-1.5">
      <Text className="ms-1 text-xs font-medium text-gray-500" style={{ textAlign: isRTL ? 'right' : 'left' }}>{label}</Text>
      <View
        className={`h-[52px] flex-row items-center rounded-lg border ${borderClass} bg-white px-4`}
      >
        <TextInput
          className="flex-1 text-[15px] text-gray-900"
          placeholderTextColor="#9CA3AF"
          secureTextEntry={isPassword && !visible}
          textAlign={isRTL ? 'right' : 'left'}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...inputProps}
        />
        {isPassword && (
          <Pressable
            onPress={() => setVisible(!visible)}
            className="ps-3"
            hitSlop={8}
          >
            <Ionicons
              name={visible ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="#6B7280"
            />
          </Pressable>
        )}
      </View>
      {error
        ? (
            <Text className="ms-1 text-xs text-red-500" style={{ textAlign: isRTL ? 'right' : 'left' }}>{error}</Text>
          )
        : null}
    </View>
  );
}
