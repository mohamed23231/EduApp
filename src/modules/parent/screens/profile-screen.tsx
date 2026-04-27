import type { TFunction } from 'i18next';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon, LanguageToggle, SectionLabel } from '@/components/ui';
import colors from '@/components/ui/colors';
import { AppRoute } from '@/core/navigation/routes';
import { useAuthStore } from '@/features/auth/use-auth-store';
import { validateToken } from '@/modules/auth/services';
import { ProfileChildRow, ProfileHeader } from '../components/profile';
import { useStudents } from '../hooks';

const GENERATED_PHONE_EMAIL_DOMAIN = '@phone-generated.privatedu';
const COLLAPSED_LIMIT = 3;

function isGeneratedPhoneEmail(email: string | undefined): boolean {
  return !!email && email.toLowerCase().endsWith(GENERATED_PHONE_EMAIL_DOMAIN);
}

function getDisplayName(fullName: string | undefined, email: string | undefined, t: TFunction): string {
  if (fullName?.trim())
    return fullName.trim();
  if (email && !isGeneratedPhoneEmail(email))
    return email;
  return t('parent.profile.phoneAccount');
}

function getIdentifier(
  email: string | undefined,
  phone: string | undefined,
  t: TFunction,
): string {
  if (isGeneratedPhoneEmail(email))
    return phone ?? t('parent.profile.phoneAccount');
  if (email)
    return email;
  return phone ?? t('parent.profile.phoneAccount');
}

// eslint-disable-next-line max-lines-per-function
export function ProfileScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = i18n?.language === 'ar';
  const user = useAuthStore.use.user();
  const token = useAuthStore.use.token();
  const signIn = useAuthStore.use.signIn();
  const signOut = useAuthStore.use.signOut();
  const { data: students, isLoading: studentsLoading } = useStudents();
  const attendanceLabel = t('parent.studentList.attendanceLabel', 'attendance');

  React.useEffect(() => {
    let cancelled = false;
    async function hydrate() {
      if (!user || !token)
        return;
      const missingName = !user.fullName?.trim();
      const missingPhone = isGeneratedPhoneEmail(user.email) && !user.phoneE164;
      if (!missingName && !missingPhone)
        return;
      try {
        const validated = await validateToken();
        if (!cancelled)
          signIn({ token, user: { ...user, ...validated } });
      }
      catch {
        // best-effort hydration
      }
    }
    void hydrate();
    return () => {
      cancelled = true;
    };
  }, [signIn, token, user]);

  const displayName = getDisplayName(user?.fullName, user?.email, t);
  const identifier = getIdentifier(user?.email, user?.phoneE164 ?? undefined, t);
  const childCount = students?.length ?? 0;
  const [childrenExpanded, setChildrenExpanded] = React.useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.neutral.paper }}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <ProfileHeader
          displayName={displayName}
          identifier={identifier}
          userId={user?.id ?? ''}
        />

        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          <SectionLabel>
            {`${t('parent.profile.childrenLabel', 'CHILDREN')}${childCount > 0 ? ` · ${childCount}` : ''}`}
          </SectionLabel>
        </View>
        {studentsLoading
          ? (
              <ActivityIndicator size="small" color={colors.brand.primary} style={{ marginTop: 16 }} />
            )
          : (
              <View style={{ marginTop: 8 }}>
                {(childrenExpanded ? (students ?? []) : (students ?? []).slice(0, COLLAPSED_LIMIT)).map(student => (
                  <ProfileChildRow
                    key={student.id}
                    student={student}
                    onPress={() => router.push(AppRoute.parent.studentDetails(student.id))}
                    isRTL={isRTL}
                    attendanceLabel={attendanceLabel}
                  />
                ))}
                {childCount > COLLAPSED_LIMIT
                  ? (
                      <Pressable
                        onPress={() => setChildrenExpanded(v => !v)}
                        accessibilityRole="button"
                        style={({ pressed }) => ({
                          marginHorizontal: 16,
                          marginBottom: 8,
                          paddingVertical: 12,
                          alignItems: 'center',
                          opacity: pressed ? 0.7 : 1,
                        })}
                      >
                        <Text
                          style={{
                            color: colors.neutral.ink,
                            fontSize: 13,
                            fontWeight: '700',
                            letterSpacing: 0.2,
                          }}
                        >
                          {childrenExpanded
                            ? t('parent.profile.showLessChildren', 'Show less')
                            : t('parent.profile.showAllChildren', { defaultValue: 'Show all ({{count}})', count: childCount })}
                        </Text>
                      </Pressable>
                    )
                  : null}
                <Pressable
                  onPress={() => router.push(AppRoute.parent.linkStudent)}
                  accessibilityRole="button"
                  accessibilityLabel={t('parent.profile.addChild', 'Link another child')}
                  style={({ pressed }) => ({
                    marginHorizontal: 16,
                    marginBottom: 8,
                    padding: 14,
                    backgroundColor: colors.neutral.card,
                    borderRadius: 18,
                    borderWidth: 1.5,
                    borderColor: colors.neutral.rule,
                    borderStyle: 'dashed',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    opacity: pressed ? 0.85 : 1,
                  })}
                >
                  <View
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 999,
                      backgroundColor: colors.neutral.paper,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Icon name="plus" size={18} color={colors.neutral.inkMuted} />
                  </View>
                  <Text
                    style={{
                      flex: 1,
                      color: colors.neutral.inkMuted,
                      fontSize: 14,
                      fontWeight: '600',
                      textAlign: isRTL ? 'right' : 'left',
                    }}
                  >
                    {t('parent.profile.addChild', 'Link another child')}
                  </Text>
                </Pressable>
                {!studentsLoading && childCount === 0
                  ? (
                      <Text
                        style={{
                          marginHorizontal: 24,
                          marginTop: 4,
                          color: colors.neutral.inkMuted,
                          fontSize: 12,
                          fontWeight: '500',
                          textAlign: 'center',
                        }}
                      >
                        {t('parent.profile.noChildrenMessage', 'Link your first child to get started.')}
                      </Text>
                    )
                  : null}
              </View>
            )}

        <View style={{ paddingHorizontal: 16, marginTop: 24 }}>
          <SectionLabel>{t('parent.profile.preferencesLabel', 'PREFERENCES')}</SectionLabel>
        </View>
        <View style={{ marginTop: 8 }}>
          <LanguageToggle
            label={t('parent.profile.languageLabel')}
            isRTL={isRTL}
          />
        </View>

        <View style={{ paddingHorizontal: 16, marginTop: 16 }}>
          <Pressable
            onPress={signOut}
            accessibilityRole="button"
            accessibilityLabel={t('parent.profile.logoutButton')}
            style={({ pressed }) => ({
              padding: 14,
              backgroundColor: colors.neutral.card,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: colors.neutral.rule,
              alignItems: 'center',
              opacity: pressed ? 0.9 : 1,
            })}
          >
            <Text
              style={{
                color: colors.semantic.absent,
                fontSize: 14,
                fontWeight: '700',
              }}
            >
              {t('parent.profile.logoutButton')}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
