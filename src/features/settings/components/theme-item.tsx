import type { OptionType } from '@/components/ui';

import type { ThemeMode } from '@/components/ui/theme';
import * as React from 'react';
import { Options, useModal } from '@/components/ui';
import { useTheme } from '@/components/ui/theme';
import { translate } from '@/lib/i18n';

import { SettingsItem } from './settings-item';

export function ThemeItem() {
  const { mode, setMode } = useTheme();
  const modal = useModal();

  const onSelect = React.useCallback(
    (option: OptionType) => {
      setMode(option.value as ThemeMode);
      modal.dismiss();
    },
    [setMode, modal],
  );

  const themes = React.useMemo(
    () => [
      { label: `${translate('settings.theme.dark')} 🌙`, value: 'dark' },
      { label: `${translate('settings.theme.light')} 🌞`, value: 'light' },
      { label: `${translate('settings.theme.system')} ⚙️`, value: 'system' },
    ],
    [],
  );

  const theme = React.useMemo(
    () => themes.find(t => t.value === mode),
    [mode, themes],
  );

  return (
    <>
      <SettingsItem
        text="settings.theme.title"
        value={theme?.label}
        onPress={modal.present}
      />
      <Options
        ref={modal.ref}
        options={themes}
        onSelect={onSelect}
        value={theme?.value}
      />
    </>
  );
}
