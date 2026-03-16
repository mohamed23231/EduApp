import type { NativeSyntheticEvent, TextInputKeyPressEventData } from 'react-native';
import { useRef } from 'react';
import { TextInput, View } from 'react-native';

type OtpInputProps = {
  length?: number;
  value: string;
  onChange: (value: string) => void;
};

export function OtpInput({ length = 6, value, onChange }: OtpInputProps) {
  const inputRefs = useRef<(TextInput | null)[]>([]);
  const digits = value.split('').concat(Array.from<string>({ length: length - value.length }).fill(''));

  const handleChange = (text: string, index: number) => {
    const sanitized = text.replace(/\D/g, '').slice(0, 1);
    const newDigits = [...digits];
    newDigits[index] = sanitized;
    const newValue = newDigits.join('').slice(0, length);
    onChange(newValue);

    if (sanitized && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (
    e: NativeSyntheticEvent<TextInputKeyPressEventData>,
    index: number,
  ) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = '';
      onChange(newDigits.join('').slice(0, length));
    }
  };

  return (
    <View className="flex-row justify-center gap-2" style={{ direction: 'ltr' }}>
      {digits.slice(0, length).map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => { inputRefs.current[index] = ref; }}
          className={`h-[56px] w-[48px] rounded-lg border bg-white text-center text-[22px] font-bold text-gray-900 ${
            index === value.length
              ? 'border-2 border-blue-500'
              : 'border-gray-300'
          }`}
          keyboardType="number-pad"
          maxLength={1}
          value={digit}
          onChangeText={text => handleChange(text, index)}
          onKeyPress={e => handleKeyPress(e, index)}
          selectTextOnFocus
        />
      ))}
    </View>
  );
}
