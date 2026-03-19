import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import LottieView from 'lottie-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  I18nManager,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
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

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
    <View className="flex-row items-center px-4 py-3">
      <Pressable
        className="size-10 items-center justify-center rounded-full border border-gray-200"
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel={backLabel}
        testID="back-button"
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <Ionicons name={I18nManager.isRTL ? 'chevron-forward' : 'chevron-back'} size={20} color="#374151" />
      </Pressable>
      <Text className="flex-1 text-center text-base font-bold text-gray-900">{title}</Text>
      <View className="size-10" />
    </View>
  );
}

function LottieHero() {
  return (
    <View className="mt-6 items-center">
      <LottieView
        source={require('@assets/lottie/education-books.json')}
        autoPlay
        loop
        renderMode={Platform.OS === 'android' ? 'HARDWARE' : 'AUTOMATIC'}
        style={{ width: 200, height: 160 }}
      />
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
      <Text className="ms-1 mb-1.5 text-xs font-medium text-gray-500">{label}</Text>
      <View
        className={`h-[52px] flex-row items-center rounded-lg border bg-white px-4 ${
          hasError ? 'border-red-500' : 'border-gray-300'
        }`}
      >
        <TextInput
          className="flex-1 text-[15px] text-gray-900"
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
        <Ionicons name="qr-code-outline" size={20} color="#9CA3AF" className="ms-2" />
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

  return (
    <AnimatedPressable
      className={`h-[52px] items-center justify-center rounded-xl bg-gray-900 ${
        disabled ? 'opacity-50' : ''
      }`}
      style={animatedStyle}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      testID="submit-button"
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityLabel={label}
    >
      {isPending
        ? <ActivityIndicator color="#FFFFFF" size="small" />
        : <Text className="text-base font-semibold text-white">{label}</Text>}
    </AnimatedPressable>
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
        <Text className="ms-1 mt-1.5 text-xs text-red-500" accessibilityRole="alert">
          {validationError}
        </Text>
      )}
      {errorMessage && (
        <Text
          className="ms-1 mt-1.5 text-xs text-red-500"
          testID="error-message"
          accessibilityRole="alert"
        >
          {errorMessage}
        </Text>
      )}
    </>
  );
}

function HelpLink({ onPress, label }: { onPress: () => void; label: string }) {
  return (
    <Pressable
      className="mt-5 mb-7 flex-row items-center justify-center gap-1.5"
      onPress={onPress}
      testID="help-link"
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Ionicons name="information-circle-outline" size={16} color="#6B7280" />
      <Text className="text-[13px] text-gray-500">{label}</Text>
    </Pressable>
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
      setValidationError(t(result.error.issues[0].message));
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
    <SafeAreaView style={{ flex: 1 }} className="bg-white" edges={['top', 'bottom']}>
      <ScreenHeader
        onBack={() => router.back()}
        backLabel={t('parent.common.back')}
        title={t('parent.common.brandName')}
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerClassName="flex-grow px-4 pb-6"
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(0).duration(400)}>
            <LottieHero />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text className="mb-2 text-center text-[28px] font-bold text-gray-900">
              {t('parent.linkStudent.title')}
            </Text>
            <Text className="mb-8 px-2 text-center text-[15px] text-gray-500">
              {t('parent.linkStudent.description')}
            </Text>
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
            <HelpLink onPress={() => helpModalRef.current?.present()} label={t('parent.linkStudent.helpLink')} />
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <SubmitButton
              onPress={handleSubmit}
              disabled={isSubmitDisabled}
              isPending={isPending}
              label={t('parent.linkStudent.submit')}
            />
          </Animated.View>
          <View className="flex-1 items-center justify-end pt-6 pb-2">
            <Text className="px-4 text-center text-xs text-gray-400">
              {t('parent.linkStudent.fallbackHelp')}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <Modal
        ref={helpModalRef.current?.ref}
        snapPoints={['50%']}
        title={t('parent.linkStudent.helpLink')}
      >
        <View className="px-5 pb-6">
          <Text className="text-[15px]/6 text-gray-700">
            {t('parent.linkStudent.helpContent')}
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
