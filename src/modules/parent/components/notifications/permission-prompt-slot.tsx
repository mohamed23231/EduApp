import { useState } from 'react';
import { registerPushToken } from '../../services/push-notification-handler';
import { PermissionPrompt } from '../permission-prompt';

/**
 * PermissionPromptSlot — mount adapter for the config-gated PermissionPrompt.
 *
 * Owns the side effects so PermissionPrompt stays a pure, testable mock:
 *  - onEnable -> reuse the EXISTING push entry point `registerPushToken()`
 *    (it requests OS permission AND registers the token; no new flow invented).
 *  - onDismiss -> hide for the current session via local state.
 *
 * Renders null when the remote flag is off (PermissionPrompt handles that),
 * so this has ZERO visible effect until the backend enables it.
 */
export function PermissionPromptSlot() {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <PermissionPrompt
      onEnable={() => {
        void registerPushToken();
      }}
      onDismiss={() => setDismissed(true)}
    />
  );
}
