import type { TFunction } from 'i18next';

import Ionicons from '@expo/vector-icons/Ionicons';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui';

import { useAuthStore } from '@/features/auth/use-auth-store';
import { useSelectedLanguage } from '@/lib/i18n';
import { validateToken } from '@/modules/auth/services';

const GENERATED_PHONE_EMAIL_DOMAIN = '@phone-generated.privatedu';

function getTranslatedRole(role: string | undefined, t: TFunction): string {
  if (!role) {
    return '';
  }
  if (role.toLowerCase() === 'parent') {
    return t('parent.profile.roleParent');
  }
  return role;
}

function isGeneratedPhoneEmail(email: string | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(GENERATED_PHONE_EMAIL_DOMAIN);
}

function getDisplayAccountIdentifier(email: string | undefined, t: TFunction): string {
  if (!email || isGeneratedPhoneEmail(email)) {
    return t('parent.profile.phoneAccount');
  }

  return email;
}

function getDisplayName(fullName: string | undefined, email: string | undefined, t: TFunction): string {
  if (fullName?.trim()) {
    return fullName.trim();
  }
  if (email && !isGeneratedPhoneEmail(email)) {
    return email;
  }
  return t('parent.profile.phoneAccount');
}

function getInitials(fullName: string | undefined, email: string | undefined): string {
  if (fullName?.trim()) {
    const parts = fullName.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (!email) {
    return '?';
  }
  if (isGeneratedPhoneEmail(email)) {
    return 'P';
  }
  const name = email.split('@')[0];
  const parts = name.split(/[._-]/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function LanguageToggle() {
  const { t } = useTranslation();
  const { language, setLanguage } = useSelectedLanguage();
  const isArabic = language === 'ar';

  const handleToggle = () => {
    setLanguage(isArabic ? 'en' : 'ar');
  };

  const activeShadow = { shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 };

  return (
    <View className="flex-row items-center justify-between px-4 py-3.5">
      <View className="flex-1 flex-row items-center">
        <View className="me-3 size-8 items-center justify-center rounded-lg bg-gray-100">
          <Ionicons name="language-outline" size={20} color="#6B7280" />
        </View>
        <Text className="text-[15px] font-medium text-gray-700">
          {t('parent.profile.languageLabel')}
        </Text>
      </View>
      <TouchableOpacity
        className="flex-row rounded-lg bg-gray-100 p-0.5"
        onPress={handleToggle}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={t('parent.profile.languageLabel')}
      >
        <View
          className={`rounded-md px-3.5 py-1.5 ${!isArabic ? 'bg-blue-500 shadow-sm' : ''}`}
          style={!isArabic ? activeShadow : undefined}
        >
          <Text className={`text-[13px] font-semibold ${!isArabic ? 'text-white' : 'text-gray-500'}`}>EN</Text>
        </View>
        <View
          className={`rounded-md px-3.5 py-1.5 ${isArabic ? 'bg-blue-500 shadow-sm' : ''}`}
          style={isArabic ? activeShadow : undefined}
        >
          <Text className={`text-[13px] font-semibold ${isArabic ? 'text-white' : 'text-gray-500'}`}>عربي</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

function ProfileHeader({ initials, displayName, roleBadge }: { initials: string; displayName: string; roleBadge: string }) {
  return (
    <View className="items-center bg-white px-6 py-8">
      <View className="mb-4">
        <View
          className="size-20 items-center justify-center rounded-full bg-blue-500"
          style={{ shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 8 }}
        >
          <Text className="text-[28px] font-bold text-white">{initials}</Text>
        </View>
      </View>
      <Text className="mb-2 text-center text-[18px] font-semibold text-gray-900">{displayName}</Text>
      <View className="rounded-full bg-blue-50 px-3 py-1">
        <Text className="text-xs font-semibold text-blue-600 capitalize">{roleBadge}</Text>
      </View>
    </View>
  );
}

function SettingsRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: React.ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3.5">
      <View className="flex-1 flex-row items-center">
        <View className="me-3 size-8 items-center justify-center rounded-lg bg-gray-100">
          <Ionicons name={icon} size={20} color="#6B7280" />
        </View>
        <Text className="text-[15px] font-medium text-gray-700">{label}</Text>
      </View>
      {value}
    </View>
  );
}

function AccountCard({ accountLabel, accountIdentifier, roleBadge, t }: {
  accountLabel: string;
  accountIdentifier: string;
  roleBadge: string;
  t: TFunction;
}) {
  return (
    <View className="px-4 pt-6">
      <Text className="ms-1 mb-2 text-[11px] font-semibold tracking-wide text-gray-500 uppercase">
        {t('parent.profile.accountSection')}
      </Text>
      <View className="rounded-xl border border-gray-200 bg-white">
        <SettingsRow
          icon="mail-outline"
          label={accountLabel}
          value={(
            <Text className="shrink text-sm text-gray-500" style={{ textAlign: I18nManager.isRTL ? 'left' : 'right' }} numberOfLines={1}>
              {accountIdentifier}
            </Text>
          )}
        />
        <View className="ms-[60px] h-px bg-gray-200" />
        <SettingsRow
          icon="shield-outline"
          label={t('parent.profile.roleLabel')}
          value={(
            <View className="rounded-lg bg-blue-50 px-2.5 py-1">
              <Text className="text-[13px] font-semibold text-blue-600 capitalize">{roleBadge}</Text>
            </View>
          )}
        />
        <View className="ms-[60px] h-px bg-gray-200" />
        <LanguageToggle />
      </View>
    </View>
  );
}

function useHydrateUser() {
  const user = useAuthStore.use.user();
  const token = useAuthStore.use.token();
  const signIn = useAuthStore.use.signIn();

  React.useEffect(() => {
    let cancelled = false;

    async function hydrateUserDetails() {
      if (!user || !token)
        return;

      const missingName = !user.fullName?.trim();
      const missingPhone = isGeneratedPhoneEmail(user.email) && !user.phoneE164;
      if (!missingName && !missingPhone)
        return;

      try {
        const validatedUser = await validateToken();
        if (cancelled)
          return;
        signIn({ token, user: { ...user, ...validatedUser } });
      }
      catch {
        // Best-effort hydration for legacy cached user payloads.
      }
    }

    void hydrateUserDetails();
    return () => {
      cancelled = true;
    };
  }, [signIn, token, user]);

  return { user };
}

export function ProfileScreen() {
  const { t } = useTranslation();
  const { user } = useHydrateUser();
  const signOut = useAuthStore.use.signOut();

  const displayName = getDisplayName(user?.fullName, user?.email, t);
  const initials = getInitials(user?.fullName, user?.email);
  const roleBadge = getTranslatedRole(user?.role, t);
  const accountIdentifier = isGeneratedPhoneEmail(user?.email)
    ? (user?.phoneE164 ?? getDisplayAccountIdentifier(user?.email, t))
    : getDisplayAccountIdentifier(user?.email, t);
  const accountLabel = isGeneratedPhoneEmail(user?.email)
    ? t('parent.profile.phoneLabel')
    : t('parent.profile.emailLabel');

  return (
    <SafeAreaView style={{ flex: 1 }} className="bg-white" edges={['top']}>
      <ProfileHeader initials={initials} displayName={displayName} roleBadge={roleBadge} />
      <AccountCard accountLabel={accountLabel} accountIdentifier={accountIdentifier} roleBadge={roleBadge} t={t} />
      <View className="flex-1" />
      <View className="px-4 pb-8">
        <TouchableOpacity
          className="h-[52px] flex-row items-center justify-center rounded-xl bg-red-50"
          onPress={signOut}
          accessibilityRole="button"
          accessibilityLabel={t('parent.profile.logoutButton')}
        >
          <Ionicons name="log-out-outline" size={20} color="#EF4444" style={{ marginEnd: 8 }} />
          <Text className="text-base font-semibold text-red-600">{t('parent.profile.logoutButton')}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
