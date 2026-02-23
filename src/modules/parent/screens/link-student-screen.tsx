import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  I18nManager,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Modal, Text, useModal } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { useLinkStudent } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';
import { linkStudentSchema } from '../validators/link-student.schema';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

function useClearErrorsOnChange({
  accessCode,
  validationError,
  hasMutationError,
  resetMutationError,
  setValidationError,
}: {
  accessCode: string;
  validationError: string | null;
  hasMutationError: boolean;
  resetMutationError: (() => void) | undefined;
  setValidationError: (error: string | null) => void;
}) {
  const previousAccessCode = useRef(accessCode);

  useEffect(() => {
    const hasChanged = accessCode !== previousAccessCode.current;
    previousAccessCode.current = accessCode;
    if (!hasChanged) {
      return;
    }

    if (validationError) {
      setValidationError(null);
    }

    if (hasMutationError) {
      resetMutationError?.();
    }
  }, [accessCode, validationError, hasMutationError, resetMutationError, setValidationError]);
}

function ScreenHeader({
  onBack,
  backLabel,
  title,
}: {
  onBack: () => void;
  backLabel: string;
  title: string;
}) {
  return (
    <View style={s.header}>
      <TouchableOpacity
        style={s.backButton}
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        testID="back-button"
      >
        <Ionicons
          name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'}
          size={24}
          color="#111827"
        />
      </TouchableOpacity>
      <Text style={s.headerTitle}>{title}</Text>
      <View style={s.headerSpacer} />
    </View>
  );
}

function Illustration() {
  return (
    <View style={s.illustrationContainer}>
      <View style={s.illustration}>
        <View style={s.illustrationIconWrapper}>
          <Ionicons name="school" size={44} color="#6366F1" />
        </View>
        <View style={s.illustrationBadge}>
          <Ionicons name="link" size={18} color="#FFFFFF" />
        </View>
      </View>
    </View>
  );
}

function CodeInput({
  accessCode,
  onChangeText,
  isPending,
  hasError,
  label,
  placeholder,
}: {
  accessCode: string;
  onChangeText: (text: string) => void;
  isPending: boolean;
  hasError: boolean;
  label: string;
  placeholder: string;
}) {
  return (
    <>
      <Text style={s.inputLabel}>{label}</Text>
      <View style={[s.inputContainer, hasError && s.inputContainerError]}>
        <TextInput
          style={[
            s.input,
            {
              textAlign: I18nManager.isRTL ? 'right' : 'left',
              writingDirection: I18nManager.isRTL ? 'rtl' : 'ltr',
            },
          ]}
          placeholder={placeholder}
          placeholderTextColor="#9CA3AF"
          value={accessCode}
          onChangeText={onChangeText}
          editable={!isPending}
          testID="access-code-input"
          autoCapitalize="characters"
          autoCorrect={false}
          accessibilityLabel={label}
        />
        <Ionicons name="qr-code-outline" size={20} color="#9CA3AF" style={s.inputIcon} />
      </View>
    </>
  );
}

function SubmitButton({
  onPress,
  disabled,
  isPending,
  label,
}: {
  onPress: () => void;
  disabled: boolean;
  isPending: boolean;
  label: string;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.96);
  };

  const handlePressOut = () => {
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1);
  };

  const iconColor = disabled ? '#9CA3AF' : '#FFFFFF';

  return (
    <AnimatedTouchableOpacity
      style={[s.submitButton, disabled && s.submitButtonDisabled, animatedStyle]}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.8}
      testID="submit-button"
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={label}
    >
      {isPending
        ? <ActivityIndicator color="#FFFFFF" size="small" />
        : (
            <View style={s.submitContent}>
              <Text style={[s.submitText, disabled && s.submitTextDisabled]}>
                {label}
              </Text>
              <Ionicons
                name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                size={18}
                color={iconColor}
              />
            </View>
          )}
    </AnimatedTouchableOpacity>
  );
}

function ErrorMessages({
  validationError,
  errorMessage,
}: {
  validationError: string | null;
  errorMessage: string | null;
}) {
  return (
    <>
      {validationError && (
        <Text style={s.errorText} accessibilityRole="alert">{validationError}</Text>
      )}
      {errorMessage && (
        <Text style={s.errorText} testID="error-message" accessibilityRole="alert">
          {errorMessage}
        </Text>
      )}
    </>
  );
}

export function LinkStudentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { mutate, isPending, error, reset } = useLinkStudent();
  const helpModalRef = useRef(useModal());
  useClearErrorsOnChange({
    accessCode,
    validationError,
    hasMutationError: Boolean(error),
    resetMutationError: reset,
    setValidationError,
  });
  const handleSubmit = () => {
    const result = linkStudentSchema.safeParse({ accessCode });
    if (!result.success) {
      const firstError = result.error.issues[0];
      setValidationError(t(firstError.message));
      return;
    }
    mutate(accessCode.trim(), {
      onSuccess: () => router.replace(AppRoute.parent.dashboard),
    });
  };

  const isSubmitDisabled = !accessCode.trim() || isPending;
  const errorMessage = error ? extractErrorMessage(error, t) : null;
  const hasInputError = !!validationError || !!errorMessage;

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <ScreenHeader
        onBack={() => router.back()}
        backLabel={t('parent.common.back')}
        title={t('parent.common.brandName')}
      />

      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={s.flex}
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(0).duration(400)}>
            <Illustration />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text style={s.title}>{t('parent.linkStudent.title')}</Text>
            <Text style={s.description}>{t('parent.linkStudent.description')}</Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <CodeInput
              accessCode={accessCode}
              onChangeText={setAccessCode}
              isPending={isPending}
              hasError={hasInputError}
              label={t('parent.linkStudent.inputLabel')}
              placeholder={t('parent.linkStudent.inputPlaceholder')}
            />

            <ErrorMessages validationError={validationError} errorMessage={errorMessage} />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <TouchableOpacity
              style={s.helpLinkContainer}
              onPress={() => helpModalRef.current?.present()}
              testID="help-link"
              accessibilityRole="button"
              accessibilityLabel={t('parent.linkStudent.helpLink')}
            >
              <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
              <Text style={s.helpLink}>{t('parent.linkStudent.helpLink')}</Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <SubmitButton
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
              isPending={isPending}
              label={t('parent.linkStudent.submit')}
            />
          </Animated.View>

          <View style={s.footer}>
            <Text style={s.footerText}>{t('parent.linkStudent.fallbackHelp')}</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        ref={helpModalRef.current?.ref}
        snapPoints={['50%']}
        title={t('parent.linkStudent.helpLink')}
      >
        <View style={s.modalContent}>
          <Text style={s.modalText}>{t('parent.linkStudent.helpContent')}</Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
  },
  headerSpacer: { width: 40 },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    flexGrow: 1,
  },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 28,
  },
  illustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationIconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#6366F1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  inputContainerError: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#111827',
  },
  inputIcon: {
    marginStart: 8,
  },
  errorText: {
    fontSize: 13,
    color: '#DC2626',
    marginTop: 8,
  },
  helpLinkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 28,
    gap: 6,
  },
  helpLink: {
    fontSize: 14,
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#6366F1',
    borderRadius: 16,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  submitButtonDisabled: {
    backgroundColor: '#E5E7EB',
    shadowOpacity: 0,
    elevation: 0,
  },
  submitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submitTextDisabled: {
    color: '#9CA3AF',
  },
  footer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  modalText: {
    fontSize: 15,
    color: '#374151',
    lineHeight: 24,
  },
});
