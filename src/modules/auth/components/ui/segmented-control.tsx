import { Pressable, Text, View } from 'react-native';

type SegmentedControlProps = {
  segments: string[];
  activeIndex: number;
  onChange: (index: number) => void;
};

export function SegmentedControl({
  segments,
  activeIndex,
  onChange,
}: SegmentedControlProps) {
  return (
    <View className="h-10 flex-row rounded-full bg-gray-100 p-1">
      {segments.map((label, index) => {
        const isActive = index === activeIndex;
        return (
          <Pressable
            key={label}
            onPress={() => onChange(index)}
            className={`flex-1 items-center justify-center rounded-full ${isActive ? 'bg-white shadow-sm' : ''}`}
          >
            <Text
              className={`text-sm ${isActive ? 'font-bold text-gray-900' : 'font-medium text-gray-500'}`}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
