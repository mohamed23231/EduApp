import ar from '../ar.json';
import en from '../en.json';

// Helper to retrieve a nested value by dot-separated key path
function getNestedValue(obj: Record<string, unknown>, keyPath: string): unknown {
  return keyPath.split('.').reduce<unknown>((current, key) => {
    if (current !== null && typeof current === 'object') {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

function assertKeyExists(
  translations: Record<string, unknown>,
  locale: string,
  key: string,
): void {
  const value = getNestedValue(translations, key);
  if (value === undefined) {
    throw new Error(`Missing key "${key}" in ${locale}.json`);
  }
}

// Keys used in dashboard-screen.tsx
const DASHBOARD_KEYS = [
  'parent.common.retry',
  'parent.dashboard.statsTitle',
  'parent.dashboard.statsError',
  'parent.dashboard.timelineTitle',
  'parent.dashboard.timelineError',
  'parent.dashboard.noTimeline',
];

// Keys used in link-student-screen.tsx
const LINK_STUDENT_KEYS = [
  'parent.common.back',
  'parent.common.brandName',
  'parent.linkStudent.title',
  'parent.linkStudent.description',
  'parent.linkStudent.inputLabel',
  'parent.linkStudent.inputPlaceholder',
  'parent.linkStudent.helpLink',
  'parent.linkStudent.submit',
  'parent.linkStudent.fallbackHelp',
  'parent.linkStudent.helpContent',
  'parent.linkStudent.validation.codeRequired',
];

// Keys used in profile-screen.tsx
const PROFILE_KEYS = [
  'parent.profile.emailLabel',
  'parent.profile.roleLabel',
  'parent.profile.logoutButton',
];

describe('translation key completeness', () => {
  describe('dashboard screen keys', () => {
    it.each(DASHBOARD_KEYS)('en.json has key "%s"', (key) => {
      assertKeyExists(en as Record<string, unknown>, 'en', key);
    });

    it.each(DASHBOARD_KEYS)('ar.json has key "%s"', (key) => {
      assertKeyExists(ar as Record<string, unknown>, 'ar', key);
    });
  });

  describe('link student screen keys', () => {
    it.each(LINK_STUDENT_KEYS)('en.json has key "%s"', (key) => {
      assertKeyExists(en as Record<string, unknown>, 'en', key);
    });

    it.each(LINK_STUDENT_KEYS)('ar.json has key "%s"', (key) => {
      assertKeyExists(ar as Record<string, unknown>, 'ar', key);
    });
  });

  describe('profile screen keys', () => {
    it.each(PROFILE_KEYS)('en.json has key "%s"', (key) => {
      assertKeyExists(en as Record<string, unknown>, 'en', key);
    });

    it.each(PROFILE_KEYS)('ar.json has key "%s"', (key) => {
      assertKeyExists(ar as Record<string, unknown>, 'ar', key);
    });
  });
});
