/**
 * Dashboard name + greeting helpers.
 * Pure functions extracted from dashboard-screen.
 */

const GENERATED_PHONE_EMAIL_DOMAIN = '@phone-generated.privatedu';

function isGeneratedPhoneEmail(email: string | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(GENERATED_PHONE_EMAIL_DOMAIN);
}

export function getDashboardFirstName(
  fullName: string | undefined,
  email: string | undefined,
  t: (key: string) => string,
): string {
  if (fullName?.trim()) {
    const [firstPart] = fullName.trim().split(/\s+/);
    return firstPart || fullName.trim();
  }

  if (email && !isGeneratedPhoneEmail(email)) {
    const [localPart] = email.split('@');
    if (localPart) {
      return localPart;
    }
  }

  return t('teacher.profile.roleTeacher');
}

export function getGreeting(t: (key: string) => string) {
  const hour = new Date().getHours();
  if (hour < 12)
    return t('teacher.dashboard.goodMorning');
  if (hour < 17)
    return t('teacher.dashboard.goodAfternoon');
  return t('teacher.dashboard.goodEvening');
}
