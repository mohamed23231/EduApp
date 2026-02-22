import type { LoginFormValues } from '../types';
import { useForm } from '@tanstack/react-form';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Eye, EyeOff, GraduationCap } from '@/components/ui/icons';
import { AppRoute } from '@/core/navigation/routes';
import { useSelectedLanguage } from '@/lib/i18n';
import { loginSchema } from '../validators';

export type LoginFormProps = {
  onSubmit: (data: LoginFormValues) => void;
  isSubmitting: boolean;
  error?: string | null;
};

// eslint-disable-next-line max-lines-per-function
export function LoginForm({ onSubmit, isSubmitting, error }: LoginFormProps) {
  const { t, i18n } = useTranslation();
  const [showPassword, setShowPassword] = React.useState(false);
  const { language, setLanguage } = useSelectedLanguage();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isRTL = i18n.language === 'ar' || language === 'ar';

  const toggleLanguage = () => {
    const newLang = language === 'en' ? 'ar' : 'en';
    setLanguage(newLang);
  };

  const languageLabel = language === 'en' ? 'العربية' : 'English';

  const getValidationError = (fieldErrors: unknown[]) => {
    const firstError = fieldErrors[0];

    if (!firstError) {
      return undefined;
    }

    if (typeof firstError === 'string') {
      return t(firstError);
    }

    if (
      typeof firstError === 'object'
      && firstError !== null
      && 'message' in firstError
      && typeof firstError.message === 'string'
    ) {
      return t(firstError.message);
    }

    return t('auth.login.genericError');
  };

  const form = useForm({
    defaultValues: {
      email: '',
      password: '',
    },
    validators: {
      onChange: loginSchema as any,
    },
    onSubmit: async ({ value }) => {
      onSubmit(value);
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Image
          source={{
            uri: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80',
          }}
          style={styles.heroImage}
          contentFit="cover"
          transition={250}
        />
        {/* Language Switcher - flips side based on language direction */}
        <Pressable
          style={[
            styles.languageSwitcher,
            { top: insets.top + 10 },
            // On iOS, inline left/right is NOT auto-flipped, so we manually pick the side.
            // On Android, I18nManager auto-flips inline left/right, so we always use right
            // and let the system flip it to left in RTL.
            Platform.OS === 'android'
              ? { right: 16 }
              : isRTL ? { left: 16 } : { right: 16 },
          ]}
          onPress={toggleLanguage}
          hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
        >
          <Text style={styles.languageIcon}>🌐</Text>
          <Text style={styles.languageLabel}>{languageLabel}</Text>
        </Pressable>
      </View>

      <View style={styles.logoWrapper}>
        <View style={styles.logoBadge}>
          <GraduationCap color="#FFFFFF" width={42} height={42} />
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{t('auth.login.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>

        {error ? <Text style={styles.apiError}>{error}</Text> : null}

        <View style={styles.form}>
          <form.Field
            name="email"
            children={(field) => {
              const hasError = field.state.meta.errors.length > 0;
              const errorMsg = getValidationError(field.state.meta.errors);

              return (
                <View style={styles.formBlock}>
                  <Text style={styles.label}>
                    {t('auth.login.emailLabel')}
                  </Text>
                  <TextInput
                    value={field.state.value}
                    onChangeText={field.handleChange}
                    onBlur={field.handleBlur}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    autoCorrect={false}
                    placeholder="name@school.edu"
                    placeholderTextColor="#94A3B8"
                    testID="email-input"
                    textAlign={isRTL ? 'right' : 'left'}
                    style={[
                      styles.input,
                      isRTL && styles.inputRTL,
                      hasError && styles.inputError,
                    ]}
                  />
                  {hasError && errorMsg
                    ? (
                        <Text style={styles.fieldError}>
                          {errorMsg}
                        </Text>
                      )
                    : null}
                </View>
              );
            }}
          />

          <View style={styles.formBlock}>
            <View style={styles.passwordHeader}>
              <Text style={styles.passwordLabel}>{t('auth.login.passwordLabel')}</Text>
              <Pressable>
                <Text style={styles.forgotPassword}>
                  {t('auth.login.forgotPassword')}
                </Text>
              </Pressable>
            </View>

            <form.Field
              name="password"
              children={(field) => {
                const hasError = field.state.meta.errors.length > 0;
                const errorMsg = getValidationError(field.state.meta.errors);

                return (
                  <View>
                    <View style={styles.passwordInputWrapper}>
                      <TextInput
                        value={field.state.value}
                        onChangeText={field.handleChange}
                        onBlur={field.handleBlur}
                        secureTextEntry={!showPassword}
                        autoCorrect={false}
                        testID="password-input"
                        textAlign={isRTL ? 'right' : 'left'}
                        style={[
                          styles.input,
                          styles.passwordInput,
                          isRTL && styles.inputRTL,
                          hasError && styles.inputError,
                        ]}
                      />
                      <Pressable
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {showPassword
                          ? (
                              <EyeOff width={20} height={20} color="#94A3B8" />
                            )
                          : (
                              <Eye width={20} height={20} color="#94A3B8" />
                            )}
                      </Pressable>
                    </View>
                    {hasError && errorMsg
                      ? (
                          <Text style={styles.fieldError}>
                            {errorMsg}
                          </Text>
                        )
                      : null}
                  </View>
                );
              }}
            />
          </View>

          <form.Subscribe
            selector={state => [state.canSubmit, state.isSubmitting]}
            children={([canSubmit, validating]) => (
              <Pressable
                style={[
                  styles.submitButton,
                  (!canSubmit || isSubmitting || validating)
                  && styles.submitButtonDisabled,
                ]}
                onPress={() => void form.handleSubmit()}
                disabled={!canSubmit || isSubmitting || validating}
                testID="login-submit-button"
              >
                {isSubmitting || validating
                  ? (
                      <ActivityIndicator color="#FFFFFF" />
                    )
                  : (
                      <View style={styles.submitButtonContent}>
                        <Text style={styles.submitButtonLabel}>
                          {t('auth.login.submit')}
                        </Text>
                        <ArrowRight
                          color="#FFFFFF"
                          width={16}
                          height={16}
                        />
                      </View>
                    )}
              </Pressable>
            )}
          />
        </View>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerLabel}>
            {t('auth.login.orConnectWith')}
          </Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.createAccountRow}>
          <Text style={styles.createAccountText}>
            {t('auth.login.dontHaveAccount')}
          </Text>
          <Pressable onPress={() => router.push(AppRoute.auth.signup)}>
            <Text style={styles.createAccountLink}>
              {t('auth.login.createAccount')}
            </Text>
          </Pressable>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>{t('auth.login.protectedBy')}</Text>
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
  createAccountLink: {
    color: '#2563EB',
    fontSize: 17,
    fontWeight: '700',
  },
  createAccountRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    justifyContent: 'center',
    marginTop: 8,
  },
  createAccountText: {
    color: '#64748B',
    fontSize: 17,
    fontWeight: '500',
  },
  divider: {
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 20,
    marginTop: 28,
  },
  dividerLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.8,
    marginHorizontal: 14,
  },
  dividerLine: {
    backgroundColor: '#CBD5E1',
    flex: 1,
    height: 1,
  },
  eyeButton: {
    padding: 4,
    position: 'absolute',
    right: 14,
    top: 14,
  },
  fieldError: {
    color: '#DC2626',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'left',
  },
  footer: {
    alignItems: 'center',
    marginTop: 34,
    paddingBottom: 12,
  },
  footerText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
  },
  forgotPassword: {
    color: '#2563EB',
    fontSize: 15,
    fontWeight: '600',
  },
  form: {
    gap: 14,
  },
  formBlock: {
    width: '100%',
  },
  hero: {
    backgroundColor: '#D4E4D8',
    height: 300,
    overflow: 'hidden',
    position: 'relative',
  },
  heroImage: {
    height: '100%',
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
  inputError: {
    borderColor: '#EF4444',
  },
  inputRTL: {
    writingDirection: 'rtl',
  },
  label: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'left',
  },
  languageIcon: {
    fontSize: 14,
  },
  languageLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  languageSwitcher: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    borderRadius: 22,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    position: 'absolute',
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
  passwordHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  passwordInput: {
    paddingRight: 48,
  },
  passwordLabel: {
    color: '#334155',
    fontSize: 17,
    fontWeight: '700',
  },
  passwordInputWrapper: {
    position: 'relative',
  },
  submitButton: {
    alignItems: 'center',
    backgroundColor: '#2563EB',
    borderRadius: 16,
    justifyContent: 'center',
    marginTop: 12,
    minHeight: 58,
  },
  submitButtonContent: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonLabel: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 10,
    textAlign: 'center',
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
});
