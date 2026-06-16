import type { TFunction } from 'i18next';

import * as React from 'react';

import { cleanup, render, screen, setup } from '@/lib/test-utils';
import en from '@/translations/en.json';

import { InviteErrorScreen } from './invite-status-screens';

/**
 * A faithful stand-in for i18next's `t` that reproduces its real resolution
 * semantics for the EN resource bundle: walk the dotted key path against the
 * production `en.json`; if it resolves to a string, return it; otherwise fall
 * back to the second-arg `defaultValue` (the literal key only when no fallback
 * was supplied). This is exactly the behaviour the fix depends on, and it lets
 * the assertion exercise the *real* (currently missing) `common.back` key
 * rather than the global jest mock that echoes every key verbatim.
 */
function resolveKey(key: string): string | undefined {
  const value = key
    .split('.')
    .reduce<unknown>(
      (node, segment) =>
        node && typeof node === 'object'
          ? (node as Record<string, unknown>)[segment]
          : undefined,
      en,
    );
  return typeof value === 'string' ? value : undefined;
}

const enT = ((key: string, defaultValue?: string) =>
  resolveKey(key) ?? defaultValue ?? key) as unknown as TFunction;

afterEach(cleanup);

describe('inviteErrorScreen', () => {
  it('resolves `common.back` to "Back" in the real EN resources', () => {
    // Regression guard: the key was missing (rendered the literal "common.back");
    // it must now resolve so neither the raw key nor a hardcoded fallback leaks.
    expect(resolveKey('common.back')).toBe('Back');
  });

  it('renders the resolved "Back" label, never the literal key', () => {
    render(
      <InviteErrorScreen
        t={enT}
        message="This invite link has expired."
        onBack={jest.fn()}
      />,
    );

    expect(screen.getByText('Back')).toBeOnTheScreen();
    expect(screen.queryByText('common.back')).toBeNull();
  });

  it('invokes onBack when the back button is pressed', async () => {
    const onBack = jest.fn();
    const { user } = setup(
      <InviteErrorScreen
        t={enT}
        message="This invite link has expired."
        onBack={onBack}
      />,
    );

    await user.press(screen.getByTestId('invite-back-button'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
