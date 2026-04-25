import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '../..');

const EXPECTED_SCREENS: string[] = [
  // Auth
  'src/app/login.tsx',
  'src/app/signup.tsx',
  'src/app/reset-password.tsx',
  'src/app/parent-invite.tsx',
  'src/app/onboarding.tsx',
  'src/app/org-invite.tsx',

  // Teacher
  'src/app/(teacher)/dashboard.tsx',
  'src/app/(teacher)/onboarding.tsx',
  'src/app/(teacher)/org-sessions.tsx',
  'src/app/(teacher)/(tabs)/dashboard.tsx',
  'src/app/(teacher)/(tabs)/students.tsx',
  'src/app/(teacher)/(tabs)/sessions.tsx',
  'src/app/(teacher)/(tabs)/profile.tsx',
  'src/app/(teacher)/students/create.tsx',
  'src/app/(teacher)/sessions/create.tsx',
  'src/app/(teacher)/attendance/[instance-id].tsx',

  // Parent
  'src/app/(parent)/dashboard.tsx',
  'src/app/(parent)/notifications.tsx',
  'src/app/(parent)/(tabs)/dashboard.tsx',
  'src/app/(parent)/(tabs)/profile.tsx',
  'src/app/(parent)/students/index.tsx',
  'src/app/(parent)/students/link.tsx',

  // Manager
  'src/app/(manager)/setup.tsx',
  'src/app/(manager)/settings.tsx',
  'src/app/(manager)/reports.tsx',
  'src/app/(manager)/(tabs)/dashboard.tsx',
  'src/app/(manager)/(tabs)/students.tsx',
  'src/app/(manager)/(tabs)/sessions.tsx',
  'src/app/(manager)/(tabs)/teachers.tsx',
  'src/app/(manager)/(tabs)/more.tsx',
  'src/app/(manager)/students/create.tsx',
  'src/app/(manager)/sessions/create.tsx',
  'src/app/(manager)/teachers/invite.tsx',
];

describe('redesign screen inventory', () => {
  it('screen inventory harness is wired', () => {
    expect(true).toBe(true);
  });

  it('all expected screen files exist', () => {
    const missing = EXPECTED_SCREENS.filter(
      rel => !existsSync(resolve(ROOT, rel)),
    );
    if (missing.length > 0) {
      throw new Error(`Missing screen files:\n${missing.map(f => `  ${f}`).join('\n')}`);
    }
  });
});
