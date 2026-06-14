/**
 * useRatingInput — local hook for the inline rating numpad in OrgAttendanceScreen.
 */

import { useCallback, useState } from 'react';

export function useRatingInput(
  value: number | null,
  onChange: (r: number | null) => void,
  disabled: boolean,
) {
  const [showNumpad, setShowNumpad] = useState(false);
  const [tempValue, setTempValue] = useState('');

  const handlePresetPress = useCallback(
    (preset: number) => {
      if (!disabled)
        onChange(preset);
    },
    [disabled, onChange],
  );

  const handleClear = useCallback(() => {
    if (!disabled)
      onChange(null);
  }, [disabled, onChange]);

  const openNumpad = useCallback(() => {
    if (disabled)
      return;
    setTempValue(value !== null ? String(value) : '');
    setShowNumpad(true);
  }, [disabled, value]);

  const handleNumpadConfirm = useCallback(() => {
    const num = Number.parseInt(tempValue, 10);
    if (!Number.isNaN(num) && num >= 0 && num <= 10)
      onChange(num);
    setShowNumpad(false);
    setTempValue('');
  }, [tempValue, onChange]);

  const handleNumpadCancel = useCallback(() => {
    setShowNumpad(false);
    setTempValue('');
  }, []);

  const handleNumpadInput = useCallback((digit: string) => {
    setTempValue((prev) => {
      if (digit === 'backspace')
        return prev.slice(0, -1);
      if (digit === '10')
        return '10';
      const appended = prev + digit;
      const num = Number.parseInt(appended, 10);
      if (num <= 10 && appended.length <= 2)
        return appended;
      return digit;
    });
  }, []);

  return {
    showNumpad,
    tempValue,
    handlePresetPress,
    handleClear,
    openNumpad,
    handleNumpadConfirm,
    handleNumpadCancel,
    handleNumpadInput,
  };
}
