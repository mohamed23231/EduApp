import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { I18nManager, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useSelectedLanguage } from '@/lib/i18n';
import { useOrganization } from '../hooks';
import { useManagerStore } from '../store/manager-store';

const GENERATED_PHONE_EMAIL_DOMAIN = '@phone-generated.privatedu';

function isGeneratedPhoneEmail(email: string | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(GENERATED_PHONE_EMAIL_DOMAIN);
}

function getInitials(fullName: string | undefined, email: string | undefined): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2)
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (!email)
    return '?';
  if (isGeneratedPhoneEmail(email))
    return 'M';
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function LanguageToggle() {
  const { t } = useTranslation();
  const { language, setLanguage } = useSelectedLanguage();
  const isArabic = language === 'ar';

  return (
    <View style={styles.settingsRow}>
      <View style={styles.settingsRowLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name="language-outline" size={20} color="#6B7280" />
        </View>
        <Text style={styles.settingsLabel}>
          {t('manager.more.languageLabel', { defaultValue: 'Language' })}
        </Text>
      </View>
      <TouchableOpacity
        style={styles.langToggle}
        onPress={() => setLanguage(isArabic ? 'en' : 'ar')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('manager.more.languageLabel', { defaultValue: 'Language' })}
      >
        <View style={[styles.langOption, !isArabic && styles.langOptionActive]}>
          <Text style={[styles.langOptionText, !isArabic && styles.langOptionTextActive]}>EN</Text>
        </View>
        <View style={[styles.langOption, isArabic && styles.langOptionActive]}>
          <Text style={[styles.langOptionText, isArabic && styles.langOptionTextActive]}>عربي</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function EntitlementSection({ org }: { org: { entitlementSource?: string; trial?: { endDate?: string; startDate?: string }; limits?: { maxStudents?: number | null; maxTeachers?: number | null; maxSessions?: number | null; maxSessionMinutes?: number | null }; currentStudents: number; currentTeachers: number; currentSessions: number; currentSessionMinutes: number } }) {
  const { t } = useTranslation();
  const source = org.entitlementSource ?? 'trial';
  const isExpired = source === 'expired';

  const usageRows = [
    { label: t('manager.more.usage.students', { defaultValue: 'Students' }), current: org.currentStudents, limit: org.limits?.maxStudents },
    { label: t('manager.more.usage.teachers', { defaultValue: 'Teachers' }), current: org.currentTeachers, limit: org.limits?.maxTeachers },
    { label: t('manager.more.usage.sessions', { defaultValue: 'Sessions' }), current: org.currentSessions, limit: org.limits?.maxSessions },
    { label: t('manager.more.usage.minutes', { defaultValue: 'Minutes' }), current: org.currentSessionMinutes, limit: org.limits?.maxSessionMinutes },
  ];

  return (
    <View className="rounded-2xl bg-white shadow-sm">
      <View style={styles.settingsRow}>
        <View style={styles.settingsRowLeft}>
          <View style={styles.iconContainer}>
            <Ionicons name="card-outline" size={20} color="#6B7280" />
          </View>
          <Text style={styles.settingsLabel}>
            {t('manager.more.planLabel', { defaultValue: 'Plan' })}
          </Text>
        </View>
        <View style={[styles.statusBadge, isExpired && styles.statusBadgeExpired]}>
          <Text style={[styles.statusBadgeText, isExpired && styles.statusBadgeTextExpired]}>
            {t(`manager.more.planStatus.${source}`, { defaultValue: source })}
          </Text>
        </View>
      </View>
      {org.trial?.endDate
        ? (
            <>
              <View style={styles.divider} />
              <View style={styles.settingsRow}>
                <View style={styles.settingsRowLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="calendar-outline" size={20} color="#6B7280" />
                  </View>
                  <Text style={styles.settingsLabel}>
                    {source === 'trial'
                      ? t('manager.more.trialEnds', { defaultValue: 'Trial ends' })
                      : t('manager.more.subscriptionEnds', { defaultValue: 'Ends' })}
                  </Text>
                </View>
                <Text style={styles.settingsValue}>{org.trial.endDate}</Text>
              </View>
            </>
          )
        : null}
      <View style={styles.divider} />
      <View className="px-4 py-3">
        <Text className="font-inter mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {t('manager.more.usage.title', { defaultValue: 'Usage' })}
        </Text>
        {usageRows.map(row => (
          <View key={row.label} className="mt-2 flex-row items-center justify-between">
            <Text className="font-inter text-sm text-slate-600">{row.label}</Text>
            <Text className="font-inter text-sm font-medium text-slate-900">
              {row.current}
              {' / '}
              {row.limit ?? t('manager.more.usage.unlimited', { defaultValue: '∞' })}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

export function MoreScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const user = useAuthStore.use.user();
  const signOut = useAuthStore.use.signOut();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const organizationQuery = useOrganization(activeOrgId);

  const isPhoneAccount = isGeneratedPhoneEmail(user?.email);
  const displayName = user?.fullName?.trim()
    || (user?.email && !isPhoneAccount ? user.email : t('manager.more.phoneAccount', { defaultValue: 'Phone Account' }));
  const initials = getInitials(user?.fullName, user?.email);
  const accountId = isPhoneAccount
    ? (user?.phoneE164 ?? t('manager.more.phoneAccount', { defaultValue: 'Phone Account' }))
    : (user?.email ?? '');

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <ScrollView contentContainerClassName="px-6 py-6" showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View className="items-center rounded-[28px] bg-white py-6">
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
          <Text className="font-inter mt-3 text-lg font-semibold text-slate-900">{displayName}</Text>
          <View className="mt-1 rounded-full bg-[#EEF2FF] px-3 py-1">
            <Text className="font-inter text-xs font-semibold text-[#4338CA]">
              {t('manager.more.roleManager', { defaultValue: 'Manager' })}
            </Text>
          </View>
          {organizationQuery.data?.name
            ? (
                <Text className="font-inter mt-2 text-sm text-slate-500">{organizationQuery.data.name}</Text>
              )
            : null}
        </View>

        {/* Account section */}
        <Text className="font-inter ms-1 mt-5 mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {t('manager.more.accountSection', { defaultValue: 'Account' })}
        </Text>
        <View className="rounded-2xl bg-white shadow-sm">
          <View style={styles.settingsRow}>
            <View style={styles.settingsRowLeft}>
              <View style={styles.iconContainer}>
                <Ionicons name={isPhoneAccount ? 'call-outline' : 'mail-outline'} size={20} color="#6B7280" />
              </View>
              <Text style={styles.settingsLabel}>
                {isPhoneAccount
                  ? t('manager.more.phoneLabel', { defaultValue: 'Phone' })
                  : t('manager.more.emailLabel', { defaultValue: 'Email' })}
              </Text>
            </View>
            <Text style={[styles.settingsValue, { textAlign: I18nManager.isRTL ? 'left' : 'right' }]} numberOfLines={1}>
              {accountId}
            </Text>
          </View>
          <View style={styles.divider} />
          <LanguageToggle />
        </View>

        {/* Entitlement section */}
        {organizationQuery.data
          ? (
              <>
                <Text className="font-inter ms-1 mt-5 mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
                  {t('manager.more.entitlementSection', { defaultValue: 'Subscription' })}
                </Text>
                <EntitlementSection org={{ ...organizationQuery.data, limits: organizationQuery.data.limits ?? undefined }} />
              </>
            )
          : null}

        {/* Quick links */}
        <Text className="font-inter ms-1 mt-5 mb-2 text-xs font-semibold tracking-wider text-slate-400 uppercase">
          {t('manager.more.quickLinksSection', { defaultValue: 'Quick links' })}
        </Text>
        <View className="gap-3">
          <Pressable className="rounded-2xl bg-white p-4 shadow-sm" onPress={() => router.push('/(manager)/settings')}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View style={styles.iconContainer}>
                  <Ionicons name="settings-outline" size={20} color="#6B7280" />
                </View>
                <Text className="font-inter text-base font-medium text-slate-900">
                  {t('manager.more.settings.title', { defaultValue: 'Settings' })}
                </Text>
              </View>
              <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color="#9CA3AF" />
            </View>
            <Text className="font-inter ms-11 mt-1 text-sm text-slate-500">
              {t('manager.more.settings.body', { defaultValue: 'Update contact information and monitor limit usage.' })}
            </Text>
          </Pressable>

          <Pressable className="rounded-2xl bg-white p-4 shadow-sm" onPress={() => router.push('/(manager)/reports')}>
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View style={styles.iconContainer}>
                  <Ionicons name="bar-chart-outline" size={20} color="#6B7280" />
                </View>
                <Text className="font-inter text-base font-medium text-slate-900">
                  {t('manager.more.reports.title', { defaultValue: 'Reports' })}
                </Text>
              </View>
              <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color="#9CA3AF" />
            </View>
            <Text className="font-inter ms-11 mt-1 text-sm text-slate-500">
              {t('manager.more.reports.body', { defaultValue: 'Review attendance, engagement, and teacher performance trends.' })}
            </Text>
          </Pressable>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={signOut}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('manager.more.logout', { defaultValue: 'Log Out' })}
        >
          <Ionicons name="log-out-outline" size={20} color="#DC2626" style={{ marginEnd: 8 }} />
          <Text style={styles.logoutText}>{t('manager.more.logout', { defaultValue: 'Log Out' })}</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  avatarText: { fontSize: 26, fontWeight: '700', color: '#FFFFFF' },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  settingsRowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 12,
  },
  settingsLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
  settingsValue: { fontSize: 14, color: '#6B7280', flexShrink: 1 },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginStart: 60 },
  statusBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusBadgeExpired: { backgroundColor: '#FEF2F2' },
  statusBadgeText: { fontSize: 13, fontWeight: '600', color: '#3B82F6', textTransform: 'capitalize' },
  statusBadgeTextExpired: { color: '#DC2626' },
  langToggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 2 },
  langOption: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 6 },
  langOptionActive: {
    backgroundColor: '#3B82F6',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  langOptionText: { fontSize: 13, fontWeight: '600', color: '#6B7280' },
  langOptionTextActive: { color: '#FFFFFF' },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 20,
    marginBottom: 32,
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    minHeight: 48,
  },
  logoutText: { fontSize: 16, color: '#DC2626', fontWeight: '600' },
});
