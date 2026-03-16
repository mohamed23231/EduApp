import { ActivityIndicator, Pressable, Text } from 'react-native';

type AuthButtonProps = {
  title: string;
  onPress: () => void;
  variant?: 'black' | 'blue' | 'outlined';
  loading?: boolean;
  disabled?: boolean;
};

export function AuthButton({
  title,
  onPress,
  variant = 'black',
  loading = false,
  disabled = false,
}: AuthButtonProps) {
  const bgClass
    = variant === 'black'
      ? 'bg-gray-900'
      : variant === 'blue'
        ? 'bg-blue-500'
        : 'bg-white border border-gray-300';

  const textClass
    = variant === 'outlined' ? 'text-gray-900' : 'text-white';

  const spinnerColor = variant === 'outlined' ? '#1A1A1A' : '#FFFFFF';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      className={`h-[52px] items-center justify-center rounded-xl ${bgClass} ${disabled ? 'opacity-50' : ''}`}
    >
      {loading
        ? (
            <ActivityIndicator color={spinnerColor} />
          )
        : (
            <Text className={`text-base font-semibold ${textClass}`}>
              {title}
            </Text>
          )}
    </Pressable>
  );
}
