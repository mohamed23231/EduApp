import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { I18nManager, Pressable, TouchableOpacity } from 'react-native';
import { SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import colors from '@/components/ui/colors';
import { AppRoute } from '@/core/navigation/routes';
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
    <View className="flex-row items-center justify-between px-4 py-3.5">
      <View className="flex-1 flex-row items-center">
        <SettingsIcon name="language-outline" />
        <Text className="text-body-lg font-medium" style={{ color: colors.neutral.inkSoft }}>
          {t('manager.more.languageLabel', { defaultValue: 'Language' })}
        </Text>
      </View>
      <TouchableOpacity
        className="flex-row rounded-lg p-0.5"
        style={{ backgroundColor: colors.neutral.paper }}
        onPress={() => setLanguage(isArabic ? 'en' : 'ar')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('manager.more.languageLabel', { defaultValue: 'Language' })}
      >
        <LangOption label="EN" active={!isArabic} />
        <LangOption label="عربي" active={isArabic} />
      </TouchableOpacity>
    </View>
  );
}

function LangOption({ label, active }: { label: string; active: boolean }) {
  return (
    <View
      className="rounded-md px-3.5 py-1.5"
      style={active ? { backgroundColor: colors.neutral.ink } : undefined}
    >
      <Text
        className="text-body font-semibold"
        style={{ color: active ? colors.neutral.white : colors.neutral.inkMuted }}
      >
        {label}
      </Text>
    </View>
  );
}

function SettingsIcon({ name, color }: { name: React.ComponentProps<typeof Ionicons>['name']; color?: string }) {
  return (
    <View
      className="me-3 size-8 items-center justify-center rounded-lg"
      style={{ backgroundColor: colors.neutral.paper }}
    >
      <Ionicons name={name} size={20} color={color ?? colors.neutral.inkMuted} />
    </View>
  );
}

function SettingsDivider() {
  return <View className="ms-[60px] h-px" style={{ backgroundColor: colors.neutral.rule }} />;
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
      <View className="flex-row items-center justify-between px-4 py-3.5">
        <View className="flex-1 flex-row items-center">
          <SettingsIcon name="card-outline" />
          <Text className="text-body-lg font-medium" style={{ color: colors.neutral.inkSoft }}>
            {t('manager.more.planLabel', { defaultValue: 'Plan' })}
          </Text>
        </View>
        <View
          className="rounded-lg px-2.5 py-1"
          style={{ backgroundColor: isExpired ? colors.semantic.absentSoft : colors.semantic.infoSoft }}
        >
          <Text
            className="text-body font-semibold capitalize"
            style={{ color: isExpired ? colors.semantic.absent : colors.brand.primary }}
          >
            {t(`manager.more.planStatus.${source}`, { defaultValue: source })}
          </Text>
        </View>
      </View>
      {org.trial?.endDate
        ? (
            <>
              <SettingsDivider />
              <View className="flex-row items-center justify-between px-4 py-3.5">
                <View className="flex-1 flex-row items-center">
                  <SettingsIcon name="calendar-outline" />
                  <Text className="text-body-lg font-medium" style={{ color: colors.neutral.inkSoft }}>
                    {source === 'trial'
                      ? t('manager.more.trialEnds', { defaultValue: 'Trial ends' })
                      : t('manager.more.subscriptionEnds', { defaultValue: 'Ends' })}
                  </Text>
                </View>
                <Text className="shrink text-sm" style={{ color: colors.neutral.inkMuted }}>{org.trial.endDate}</Text>
              </View>
            </>
          )
        : null}
      <SettingsDivider />
      <View className="px-4 py-3">
        <Text className="mb-2 font-inter text-xs font-semibold tracking-wider text-ink-muted uppercase">
          {t('manager.more.usage.title', { defaultValue: 'Usage' })}
        </Text>
        {usageRows.map(row => (
          <View key={row.label} className="mt-2 flex-row items-center justify-between">
            <Text className="font-inter text-sm text-ink-soft">{row.label}</Text>
            <Text className="font-inter text-sm font-medium text-ink">
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

function QuickLinks({ onSettings, onReports }: { onSettings: () => void; onReports: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="gap-3">
      <Pressable className="rounded-2xl bg-white p-4 shadow-sm" onPress={onSettings}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <SettingsIcon name="settings-outline" />
            <Text className="font-inter text-base font-medium text-ink">
              {t('manager.more.settings.title', { defaultValue: 'Settings' })}
            </Text>
          </View>
          <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.neutral.inkMuted} />
        </View>
        <Text className="ms-11 mt-1 font-inter text-sm text-ink-muted">
          {t('manager.more.settings.body', { defaultValue: 'Update contact information and monitor limit usage.' })}
        </Text>
      </Pressable>
      <Pressable className="rounded-2xl bg-white p-4 shadow-sm" onPress={onReports}>
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <SettingsIcon name="bar-chart-outline" />
            <Text className="font-inter text-base font-medium text-ink">
              {t('manager.more.reports.title', { defaultValue: 'Reports' })}
            </Text>
          </View>
          <Ionicons name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'} size={20} color={colors.neutral.inkMuted} />
        </View>
        <Text className="ms-11 mt-1 font-inter text-sm text-ink-muted">
          {t('manager.more.reports.body', { defaultValue: 'Review attendance, engagement, and teacher performance trends.' })}
        </Text>
      </Pressable>
    </View>
  );
}

// eslint-disable-next-line max-lines-per-function
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
    <SafeAreaView className="flex-1 bg-paper">
      <ScrollView contentContainerClassName="px-6 py-6 pb-20" showsVerticalScrollIndicator={false}>
        {/* Profile header */}
        <View className="items-center rounded-[28px] bg-white py-6">
          <View
            className="size-[72px] items-center justify-center rounded-full"
            style={{
              backgroundColor: colors.neutral.ink,
              shadowColor: colors.neutral.ink,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 8,
            }}
          >
            <Text className="text-[26px] font-bold" style={{ color: colors.neutral.white }}>{initials}</Text>
          </View>
          <Text className="mt-3 font-inter text-lg font-semibold text-ink">{displayName}</Text>
          <View className="mt-1 rounded-full px-3 py-1" style={{ backgroundColor: colors.brand.primaryGlow }}>
            <Text className="font-inter text-xs font-semibold" style={{ color: colors.brand.primaryInk }}>
              {t('manager.more.roleManager', { defaultValue: 'Manager' })}
            </Text>
          </View>
          {organizationQuery.data?.name
            ? (
                <Text className="mt-2 font-inter text-sm text-ink-muted">{organizationQuery.data.name}</Text>
              )
            : null}
        </View>

        {/* Account section */}
        <Text className="ms-1 mt-5 mb-2 font-inter text-xs font-semibold tracking-wider text-ink-muted uppercase">
          {t('manager.more.accountSection', { defaultValue: 'Account' })}
        </Text>
        <View className="rounded-2xl bg-white shadow-sm">
          <View className="flex-row items-center justify-between px-4 py-3.5">
            <View className="flex-1 flex-row items-center">
              <SettingsIcon name={isPhoneAccount ? 'call-outline' : 'mail-outline'} />
              <Text className="text-body-lg font-medium" style={{ color: colors.neutral.inkSoft }}>
                {isPhoneAccount
                  ? t('manager.more.phoneLabel', { defaultValue: 'Phone' })
                  : t('manager.more.emailLabel', { defaultValue: 'Email' })}
              </Text>
            </View>
            <Text
              className="shrink text-sm"
              style={{ color: colors.neutral.inkMuted, textAlign: I18nManager.isRTL ? 'left' : 'right' }}
              numberOfLines={1}
            >
              {accountId}
            </Text>
          </View>
          <SettingsDivider />
          <LanguageToggle />
        </View>

        {/* Entitlement section */}
        {organizationQuery.data
          ? (
              <>
                <Text className="ms-1 mt-5 mb-2 font-inter text-xs font-semibold tracking-wider text-ink-muted uppercase">
                  {t('manager.more.entitlementSection', { defaultValue: 'Subscription' })}
                </Text>
                <EntitlementSection org={{ ...organizationQuery.data, limits: organizationQuery.data.limits ?? undefined }} />
              </>
            )
          : null}

        {/* Quick links */}
        <Text className="ms-1 mt-5 mb-2 font-inter text-xs font-semibold tracking-wider text-ink-muted uppercase">
          {t('manager.more.quickLinksSection', { defaultValue: 'Quick links' })}
        </Text>
        <QuickLinks
          onSettings={() => router.push(AppRoute.manager.settings)}
          onReports={() => router.push(AppRoute.manager.reports)}
        />

        {/* Logout */}
        <TouchableOpacity
          className="mt-5 mb-8 min-h-[48px] flex-row items-center justify-center rounded-xl py-3.5"
          style={{ backgroundColor: colors.semantic.absentSoft }}
          onPress={signOut}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={t('manager.more.logout', { defaultValue: 'Log Out' })}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.semantic.absent} style={{ marginEnd: 8 }} />
          <Text className="text-base font-semibold" style={{ color: colors.semantic.absent }}>
            {t('manager.more.logout', { defaultValue: 'Log Out' })}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
