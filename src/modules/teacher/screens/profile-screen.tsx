/**
 * ProfileScreen — Teacher
 * Phase-9 restyled. Monogram avatar, name + role header.
 * Preserves TeacherStatusBadge, TrialCard, SubscriptionCard, ExpiredBanner, LanguageToggle.
 * Validates: Requirements 11.1, 11.4, 12.1, 13.1, 14.1
 */

import type { TFunction } from 'i18next';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, Pressable, ScrollView, TouchableOpacity, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ErrorState, Skeleton, Text } from '@/components/ui';
import colors from '@/components/ui/colors';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { useSelectedLanguage } from '@/lib/i18n';
import { validateToken } from '@/modules/auth/services';
import { ExpiredBanner } from '../components/expired-banner';
import { SubscriptionCard } from '../components/subscription-card';
import { TeacherStatusBadge } from '../components/teacher-status-badge';
import { TrialCard } from '../components/trial-card';
import { useTeacherProfile } from '../hooks/use-teacher-profile';

const GENERATED_PHONE_EMAIL_DOMAIN = '@phone-generated.privatedu';

function isGeneratedPhoneEmail(email: string | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(GENERATED_PHONE_EMAIL_DOMAIN);
}

function getDisplayName(fullName: string | undefined, email: string | undefined, t: TFunction): string {
  if (fullName?.trim())
    return fullName.trim();
  if (email && !isGeneratedPhoneEmail(email))
    return email;
  return t('teacher.profile.phoneAccount', 'Phone account');
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
    return 'T';
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2)
    return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

function getDisplayAccountIdentifier(email: string | undefined, t: TFunction): string {
  if (!email || isGeneratedPhoneEmail(email))
    return t('teacher.profile.phoneAccount', 'Phone account');
  return email;
}

function getTranslatedRole(role: string | undefined, t: TFunction): string {
  if (!role)
    return '';
  if (role.toLowerCase() === 'teacher')
    return t('teacher.profile.roleTeacher', 'Teacher');
  return role;
}

function useTeacherAccountViewModel(
  user: ReturnType<typeof useAuthStore.use.user>,
  t: TFunction,
) {
  const token = useAuthStore.use.token();
  const signIn = useAuthStore.use.signIn();

  React.useEffect(() => {
    let cancelled = false;
    async function hydrateUserDetails() {
      if (!user || !token)
        return;
      const missingName = !user.fullName?.trim();
      const missingPhoneForPhoneAccount = isGeneratedPhoneEmail(user.email) && !user.phoneE164;
      if (!missingName && !missingPhoneForPhoneAccount)
        return;
      try {
        const validatedUser = await validateToken();
        if (cancelled)
          return;
        signIn({ token, user: { ...user, ...validatedUser } });
      }
      catch { /* best-effort */ }
    }
    void hydrateUserDetails();
    return () => {
      cancelled = true;
    };
  }, [signIn, token, user]);

  const isPhoneAccount = isGeneratedPhoneEmail(user?.email);
  const displayName = getDisplayName(user?.fullName, user?.email, t);
  const initials = getInitials(user?.fullName, user?.email);
  const accountIdentifier = isPhoneAccount
    ? (user?.phoneE164 ?? getDisplayAccountIdentifier(user?.email, t))
    : getDisplayAccountIdentifier(user?.email, t);
  const accountLabel = isPhoneAccount
    ? t('teacher.profile.phoneLabel', 'Phone')
    : t('teacher.profile.emailLabel', 'Email');

  return { accountIdentifier, accountLabel, displayName, initials, isPhoneAccount };
}

function LanguageToggle() {
  const { t } = useTranslation();
  const { language, setLanguage } = useSelectedLanguage();
  const isArabic = language === 'ar';
  return (
    <View className="flex-row items-center justify-between px-4 py-3.5">
      <View className="flex-1 flex-row items-center">
        <View className="me-3 size-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.neutral.paper }}>
          <Ionicons name="language-outline" size={18} color={colors.neutral.inkMuted} />
        </View>
        <Text className="text-body-lg text-ink" style={{ fontWeight: '500' }}>
          {t('teacher.profile.languageLabel', 'Language')}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => setLanguage(isArabic ? 'en' : 'ar')}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('teacher.profile.languageLabel', 'Language')}
        className="flex-row rounded-xl p-0.5"
        style={{ backgroundColor: colors.neutral.paper }}
      >
        <View className="rounded-lg px-3.5 py-1.5" style={!isArabic ? { backgroundColor: colors.neutral.ink } : undefined}>
          <Text className="text-body font-semibold" style={{ color: !isArabic ? '#fff' : colors.neutral.inkMuted }}>EN</Text>
        </View>
        <View className="rounded-lg px-3.5 py-1.5" style={isArabic ? { backgroundColor: colors.neutral.ink } : undefined}>
          <Text className="text-body font-semibold" style={{ color: isArabic ? '#fff' : colors.neutral.inkMuted }}>عربي</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function SettingsRow({ icon, label, right }: { icon: string; label: string; right: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3.5">
      <View className="flex-1 flex-row items-center">
        <View className="me-3 size-8 items-center justify-center rounded-lg" style={{ backgroundColor: colors.neutral.paper }}>
          <Ionicons name={icon as any} size={18} color={colors.neutral.inkMuted} />
        </View>
        <Text className="text-body-lg text-ink" style={{ fontWeight: '500' }}>{label}</Text>
      </View>
      {right}
    </View>
  );
}

function ProfileHeader({ initials, displayName, role }: { initials: string; displayName: string; role: string }) {
  return (
    <View className="items-center px-6 pt-8 pb-6" style={{ backgroundColor: colors.neutral.card, borderBottomWidth: 1, borderBottomColor: colors.neutral.rule }}>
      {/* Monogram avatar */}
      <View
        className="mb-4 size-20 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.neutral.ink }}
      >
        <Text className="text-[28px] font-bold" style={{ color: '#fff' }}>{initials}</Text>
      </View>
      <Text className="mb-1 text-center text-title font-bold text-ink">{displayName}</Text>
      <View className="rounded-full px-3 py-1" style={{ backgroundColor: colors.brand.primary }}>
        <Text className="text-small font-bold" style={{ color: colors.neutral.ink }}>{role}</Text>
      </View>
    </View>
  );
}

function ProfileLoadingState() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.paper }} edges={['top']}>
      <View className="items-center px-6 pt-8 pb-6" style={{ backgroundColor: colors.neutral.card, borderBottomWidth: 1, borderBottomColor: colors.neutral.rule, gap: 12 }}>
        <View className="mb-2 size-20 items-center justify-center rounded-full" style={{ backgroundColor: colors.neutral.rule }} />
        <Skeleton width={160} height={18} radius={6} />
        <Skeleton width={80} height={22} radius={11} />
      </View>
      <View className="px-4 pt-6" style={{ gap: 12 }}>
        <Skeleton width="100%" height={64} radius={16} />
        <Skeleton width="100%" height={140} radius={16} />
      </View>
    </SafeAreaView>
  );
}

function ProfileErrorState({ message, onRetry, t }: { message: string; onRetry: () => void; t: TFunction }) {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.paper }} edges={['top']}>
      <View className="flex-1 items-center justify-center">
        <ErrorState
          title={t('teacher.common.errorTitle', 'Something went wrong')}
          body={message}
          action={{ label: t('teacher.common.retry', 'Retry'), onPress: onRetry }}
        />
      </View>
    </SafeAreaView>
  );
}

export function TeacherProfileScreen() {
  const { t } = useTranslation();
  const user = useAuthStore.use.user();
  const signOut = useAuthStore.use.signOut();
  const { profile, isLoading, error, refetch } = useTeacherProfile();
  const { accountIdentifier, accountLabel, displayName, initials, isPhoneAccount }
    = useTeacherAccountViewModel(user, t);

  if (isLoading && !profile)
    return <ProfileLoadingState />;
  if (error && !profile)
    return <ProfileErrorState message={error} onRetry={refetch} t={t} />;

  const teacherStatus = profile?.teacherStatus;
  const isExpired = teacherStatus === 'EXPIRED';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.paper }} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(0).duration(400)}>
          <ProfileHeader
            initials={initials}
            displayName={displayName}
            role={getTranslatedRole(user?.role, t)}
          />
        </Animated.View>

        {/* Status badge */}
        {teacherStatus && (
          <Animated.View entering={FadeInDown.delay(60).duration(400)} className="items-center pt-3">
            <TeacherStatusBadge status={teacherStatus} />
          </Animated.View>
        )}

        {/* Lifecycle cards */}
        {isExpired && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} className="px-4 pt-4">
            <ExpiredBanner />
          </Animated.View>
        )}
        {teacherStatus === 'TRIAL' && profile?.trial && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} className="px-4 pt-4">
            <TrialCard trial={profile.trial} />
          </Animated.View>
        )}
        {(teacherStatus === 'ACTIVE' || teacherStatus === 'EXPIRED') && profile?.subscription && (
          <Animated.View entering={FadeInDown.delay(100).duration(400)} className="px-4 pt-4">
            <SubscriptionCard subscription={profile.subscription} teacherStatus={teacherStatus} />
          </Animated.View>
        )}

        {/* Account settings */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} className="px-4 pt-6">
          <Text className="ms-1 mb-2 text-caption font-bold tracking-wide text-ink-muted uppercase">
            {t('teacher.profile.accountSection', 'Account')}
          </Text>
          <View className="overflow-hidden rounded-2xl border border-rule" style={{ backgroundColor: colors.neutral.card }}>
            <SettingsRow
              icon={isPhoneAccount ? 'call-outline' : 'mail-outline'}
              label={accountLabel}
              right={(
                <Text
                  className="shrink text-[14px] text-ink-muted"
                  numberOfLines={1}
                  style={{ textAlign: I18nManager.isRTL ? 'left' : 'right' }}
                >
                  {accountIdentifier}
                </Text>
              )}
            />
            <View className="ms-14 h-px" style={{ backgroundColor: colors.neutral.rule }} />
            <SettingsRow
              icon="shield-outline"
              label={t('teacher.profile.roleLabel', 'Role')}
              right={(
                <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: colors.neutral.paper }}>
                  <Text className="text-body font-semibold text-ink">
                    {getTranslatedRole(user?.role, t)}
                  </Text>
                </View>
              )}
            />
            <View className="ms-14 h-px" style={{ backgroundColor: colors.neutral.rule }} />
            <LanguageToggle />
          </View>
        </Animated.View>

        {/* Logout */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)} className="px-4 pt-4 pb-8">
          <Pressable
            onPress={signOut}
            accessibilityRole="button"
            accessibilityLabel={t('teacher.profile.logoutButton', 'Sign out')}
            className="flex-row items-center justify-center gap-2 rounded-2xl px-6 py-3.5"
            style={({ pressed }) => [
              { backgroundColor: colors.semantic.absentSoft },
              pressed && { opacity: 0.8 },
            ]}
          >
            <Ionicons name="log-out-outline" size={20} color={colors.semantic.absent} />
            <Text className="text-[16px] font-semibold" style={{ color: colors.semantic.absent }}>
              {t('teacher.profile.logoutButton', 'Sign out')}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}
