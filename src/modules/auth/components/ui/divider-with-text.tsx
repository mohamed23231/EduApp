import { Text, View } from 'react-native';

type DividerWithTextProps = {
  text: string;
};

export function DividerWithText({ text }: DividerWithTextProps) {
  return (
    <View className="my-5 flex-row items-center">
      <View className="h-px flex-1 bg-gray-200" />
      <Text className="mx-3 text-xs text-gray-400">{text}</Text>
      <View className="h-px flex-1 bg-gray-200" />
    </View>
  );
}
