import type { InviteFormValues } from '../components/parent-invite/invite-form-fields';
import type { ParentInviteValidateResponse } from '../types';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthShell, LegalNote } from '@/components/ui';
import colors from '@/components/ui/colors';
import { UserRole } from '@/core/auth/roles';
import { getHomeRouteForRole } from '@/core/auth/routing';
import { AppRoute } from '@/core/navigation/routes';
import { setOnboardingContext, signIn } from '@/features/auth/use-auth-store';
import { useSelectedLanguage } from '@/lib/i18n';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { AuthHero } from '../components/auth-hero';
import { AuthTopBar } from '../components/auth-top-bar';
import { InviteFormFields } from '../components/parent-invite/invite-form-fields';
import {
  InviteErrorScreen,
  InviteValidatingScreen,
} from '../components/parent-invite/invite-status-screens';
import { acceptParentInvite, validateParentInvite } from '../services';

export default function ParentInviteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();

  const [isValidating, setIsValidating] = React.useState(true);
  const [inviteValidation, setInviteValidation] = React.useState<ParentInviteValidateResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleAccept = async (values: InviteFormValues) => {
    if (!token) {
      setError(t('auth.invite.invalidToken'));
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await acceptParentInvite({
        token,
        password: values.password,
        fullName: values.fullName || undefined,
      });

      const authUser = response.user?.email
        ? { id: response.user.id, email: response.user.email, role: response.user.role as UserRole }
        : null;

      signIn({ token: { access: response.accessToken, refresh: response.refreshToken }, user: authUser });

      if (response.onboardingRequired) {
        if (response.user?.email) {
          const onboardingRole
            = response.user.role === UserRole.TEACHER || response.user.role === UserRole.PARENT
              ? (response.user.role as 'TEACHER' | 'PARENT')
              : undefined;
          setOnboardingContext({
            email: response.user.email,
            ...(onboardingRole ? { role: onboardingRole } : {}),
            ...(response.user.fullName ? { fullName: response.user.fullName } : {}),
          });
        }
        router.replace(AppRoute.auth.onboarding);
      }
      else {
        router.replace(getHomeRouteForRole(authUser?.role ?? UserRole.PARENT));
      }
    }
    catch (err: unknown) {
      console.error('[parent-invite] accept failed', err);
      setError(getApiErrorMessage(err, t('auth.invite.acceptError', 'Unable to activate account. Please try again.')));
    }
    finally {
      setIsSubmitting(false);
    }
  };

  React.useEffect(() => {
    const validateInvite = async () => {
      if (!token) {
        setError(t('auth.invite.invalidToken'));
        setIsValidating(false);
        return;
      }
      try {
        const validation = await validateParentInvite(token);
        setInviteValidation(validation);
        if (!validation.valid) {
          if (validation.expired)
            setError(t('auth.invite.expired'));
          else if (validation.alreadyOnboarded)
            setError(t('auth.invite.alreadyOnboarded'));
          else
            setError(t('auth.invite.invalid'));
        }
      }
      catch (err: unknown) {
        const message = err instanceof Error ? err.message : t('auth.invite.validationError');
        setError(message || t('auth.invite.validationError'));
      }
      finally {
        setIsValidating(false);
      }
    };
    validateInvite();
  }, [t, token]);

  return (
    <ParentInviteView
      router={router}
      t={t}
      isValidating={isValidating}
      inviteValidation={inviteValidation}
      isSubmitting={isSubmitting}
      error={error}
      onAccept={handleAccept}
    />
  );
}

type ParentInviteViewProps = {
  router: ReturnType<typeof useRouter>;
  t: ReturnType<typeof useTranslation>['t'];
  isValidating: boolean;
  inviteValidation: ParentInviteValidateResponse | null;
  isSubmitting: boolean;
  error: string | null;
  onAccept: (values: InviteFormValues) => void;
};

function ParentInviteView({
  router,
  t,
  isValidating,
  inviteValidation,
  isSubmitting,
  error,
  onAccept,
}: ParentInviteViewProps) {
  const insets = useSafeAreaInsets();
  const { language } = useSelectedLanguage();
  const isRTL = language === 'ar';

  if (isValidating) {
    return <InviteValidatingScreen />;
  }

  if (error && !inviteValidation?.valid) {
    return <InviteErrorScreen t={t} message={error} onBack={() => router.replace(AppRoute.auth.login)} />;
  }

  return (
    <AuthShell testID="invite-auth-shell">
      <StatusBar style="light" translucent />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1, paddingBottom: 24 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AuthTopBar markSize={56} />

          <AuthHero
            line1={t('auth.invite.heroLine1', 'Join your')}
            line2={t('auth.invite.heroLine2', 'classroom.')}
            subtitle={t('auth.invite.subtitle')}
            isRTL={isRTL}
            marginTop={40}
          />

          <View style={{ paddingHorizontal: 24, marginTop: 22, flex: 1 }}>
            {error
              ? (
                  <Text
                    style={{
                      color: colors.semantic.absent,
                      fontSize: 13,
                      fontWeight: '600',
                      textAlign: 'center',
                      marginBottom: 14,
                    }}
                  >
                    {error}
                  </Text>
                )
              : null}

            <InviteFormFields isRTL={isRTL} isSubmitting={isSubmitting} onSubmit={onAccept} />

            <View style={{ flex: 1, minHeight: 16 }} />

            <LegalNote marginTop={16} marginBottom={Math.max(insets.bottom, 12)} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </AuthShell>
  );
}
