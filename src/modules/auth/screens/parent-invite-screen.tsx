import type { ParentInviteValidateResponse } from '../types';
import { useForm } from '@tanstack/react-form';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Eye, EyeOff, GraduationCap } from '@/components/ui/icons';
import { UserRole } from '@/core/auth/roles';
import { setOnboardingContext, signIn } from '@/features/auth/use-auth-store';
import { acceptParentInvite, validateParentInvite } from '../services';

// eslint-disable-next-line max-lines-per-function
export default function ParentInviteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token: string }>();
  const insets = useSafeAreaInsets();

  const [showPassword, setShowPassword] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(true);
  const [inviteValidation, setInviteValidation] = React.useState<ParentInviteValidateResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      password: '',
      fullName: '',
    },
    onSubmit: async ({ value }) => {
      if (!token) {
        setError(t('auth.invite.invalidToken'));
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await acceptParentInvite({
          token,
          password: value.password,
          fullName: value.fullName || undefined,
        });

        // Store auth session
        const authUser = response.user?.email
          ? {
              id: response.user.id,
              email: response.user.email,
              role: response.user.role as UserRole,
            }
          : null;

        signIn({
          token: {
            access: response.accessToken,
            refresh: response.refreshToken,
          },
          user: authUser,
        });

        // Navigate to onboarding if still required, otherwise home.
        if (response.onboardingRequired) {
          if (response.user?.email) {
            const onboardingRole
              = response.user.role === UserRole.TEACHER
                || response.user.role === UserRole.PARENT
                ? (response.user.role as 'TEACHER' | 'PARENT')
                : undefined;
            setOnboardingContext({
              email: response.user.email,
              ...(onboardingRole ? { role: onboardingRole } : {}),
              ...(response.user.fullName
                ? { fullName: response.user.fullName }
                : {}),
            });
          }
          router.replace('/onboarding');
        }
        else {
          router.replace('/(tabs)');
        }
      }
      catch (err: any) {
        setError(err.message || t('auth.invite.acceptError'));
      }
      finally {
        setIsSubmitting(false);
      }
    },
  });

  // Validate invite token on mount
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
          if (validation.expired) {
            setError(t('auth.invite.expired'));
          }
          else if (validation.alreadyOnboarded) {
            setError(t('auth.invite.alreadyOnboarded'));
          }
          else {
            setError(t('auth.invite.invalid'));
          }
        }
      }
      catch (err: any) {
        setError(err.message || t('auth.invite.validationError'));
      }
      finally {
        setIsValidating(false);
      }
    };

    validateInvite();
  }, [t, token]);

  if (isValidating) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <ActivityIndicator size="large" color="#2563EB" />
          <Text style={styles.loadingText}>{t('auth.invite.validating')}</Text>
        </View>
      </View>
    );
  }

  if (error && !inviteValidation?.valid) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.content}>
          <View style={styles.logoBadge}>
            <GraduationCap color="#FFFFFF" width={42} height={42} />
          </View>
          <Text style={styles.errorTitle}>{t('auth.invite.errorTitle')}</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Pressable
            style={styles.backButton}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.backButtonLabel}>{t('common.back')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.hero}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1200&q=80',
          }}
          style={styles.heroImage}
          contentFit="cover"
          transition={250}
        />
      </View>

      <View style={styles.logoWrapper}>
        <View style={styles.logoBadge}>
          <GraduationCap color="#FFFFFF" width={42} height={42} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.invite.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.invite.subtitle')}</Text>

        {error ? <Text style={styles.apiError}>{error}</Text> : null}

        <View style={styles.form}>
          <form.Field
            name="fullName"
            children={field => (
              <View style={styles.formBlock}>
                <Text style={styles.label}>{t('auth.invite.fullNameLabel')}</Text>
                <TextInput
                  value={field.state.value}
                  onChangeText={field.handleChange}
                  onBlur={field.handleBlur}
                  autoCapitalize="words"
                  autoCorrect={false}
                  placeholder="John Doe"
                  placeholderTextColor="#94A3B8"
                  testID="fullname-input"
                  style={styles.input}
                />
              </View>
            )}
          />

          <View style={styles.formBlock}>
            <Text style={styles.label}>{t('auth.invite.passwordLabel')}</Text>
            <View style={styles.passwordInputWrapper}>
              <form.Field
                name="password"
                children={field => (
                  <TextInput
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    secureTextEntry={!showPassword}
                    autoCorrect={false}
                    testID="password-input"
                    style={[
                      styles.input,
                      styles.passwordInput,
                    ]}
                  />
                )}
              />
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword
                  ? <EyeOff width={20} height={20} color="#94A3B8" />
                  : <Eye width={20} height={20} color="#94A3B8" />}
              </Pressable>
            </View>
          </View>

          <form.Subscribe
            selector={state => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, validating]) => (
              <Pressable
                style={[
                  styles.submitButton,
                  (!canSubmit || isSubmitting || validating) && styles.submitButtonDisabled,
                ]}
                onPress={() => void form.handleSubmit()}
                disabled={!canSubmit || isSubmitting || validating}
                testID="invite-submit-button"
              >
                {isSubmitting || validating
                  ? <ActivityIndicator color="#FFFFFF" />
                  : (
                      <Text style={styles.submitButtonLabel}>
                        {t('auth.invite.acceptButton')}
                      </Text>
                    )}
              </Pressable>
            )}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  apiError: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
    textAlign: 'center',
  },
  container: {
    backgroundColor: '#FFFFFF',
    flexGrow: 1,
  },
  content: {
    paddingBottom: 32,
    paddingHorizontal: 28,
    paddingTop: 28,
  },
  logoBadge: {
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 22,
    elevation: 12,
    height: 88,
    justifyContent: 'center',
    shadowColor: '#1E40AF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    width: 88,
  },
  logoWrapper: {
    alignItems: 'center',
    marginTop: -44,
    zIndex: 10,
  },
  hero: {
    backgroundColor: '#D4E4D8',
    height: 300,
    overflow: 'hidden',
  },
  heroImage: {
    height: '100%',
    width: '100%',
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  form: {
    gap: 14,
  },
  formBlock: {
    width: '100%',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#CBD5E1',
    borderRadius: 14,
    borderWidth: 1,
    color: '#0F172A',
    fontSize: 20,
    paddingHorizontal: 18,
    paddingVertical: 15,
  },
  label: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  eyeButton: {
    padding: 4,
    position: 'absolute',
    right: 14,
    top: 14,
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 16,
  },
  submitButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
  submitButtonLabel: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  loadingText: {
    color: '#64748B',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  errorTitle: {
    color: '#0F172A',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  errorMessage: {
    color: '#64748B',
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 12,
    justifyContent: 'center',
    paddingVertical: 14,
    width: '100%',
  },
  backButtonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
