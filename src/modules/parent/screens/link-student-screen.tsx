import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  I18nManager,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Modal, PressButton, Text, useModal } from '@/components/ui';
import colors from '@/components/ui/colors';
import { AppRoute } from '@/core/navigation/routes';
import { LinkCodeField, LinkHeader, LinkIllustration } from '../components/link';
import { useClearLinkErrors, useLinkStudent } from '../hooks';
import { classifyLinkError, linkErrorMessage } from '../utils/link-error';
import { linkStudentSchema } from '../validators/link-student.schema';

/**
 * Link a child to the parent account via an access code. Per `visual-parent.md`
 * §"Link student" — paper canvas, illustration, code field, gradient CTA. The
 * Parent States Pass requires distinguishing an *invalid* code from an
 * expired/revoked* one: see `../utils/link-error.ts`.
 */
// eslint-disable-next-line max-lines-per-function -- screen wrapper composes extracted sub-components
export function LinkStudentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const [accessCode, setAccessCode] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { mutate, isPending, error, reset } = useLinkStudent();
  const helpModalRef = useRef(useModal());

  useClearLinkErrors({
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
  const errorMessage = error ? linkErrorMessage(classifyLinkError(error), t) : null;
  const hasInputError = !!validationError || !!errorMessage;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.neutral.paper }} edges={['top', 'bottom']}>
      <LinkHeader
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
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24, flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View entering={FadeInDown.delay(0).duration(400)}>
            <LinkIllustration />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).duration(400)}>
            <Text className="mb-3 text-center text-2xl font-bold" style={{ color: colors.neutral.ink }}>
              {t('parent.linkStudent.title')}
            </Text>
            <Text
              className="mb-8 px-2 text-center text-base"
              style={{ color: colors.neutral.inkMuted, lineHeight: 24 }}
            >
              {t('parent.linkStudent.description')}
            </Text>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <LinkCodeField
              accessCode={accessCode}
              onChangeText={setAccessCode}
              isPending={isPending}
              hasError={hasInputError}
              label={t('parent.linkStudent.inputLabel')}
              placeholder={t('parent.linkStudent.inputPlaceholder')}
              validationError={validationError}
              errorMessage={errorMessage}
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(300).duration(400)}>
            <TouchableOpacity
              className="mt-5 mb-7 flex-row items-center justify-center"
              style={{ gap: 6 }}
              onPress={() => helpModalRef.current?.present()}
              testID="help-link"
              accessibilityRole="button"
              accessibilityLabel={t('parent.linkStudent.helpLink')}
            >
              <Ionicons name="information-circle-outline" size={16} color={colors.neutral.inkMuted} />
              <Text className="text-sm" style={{ color: colors.neutral.inkMuted }}>
                {t('parent.linkStudent.helpLink')}
              </Text>
            </TouchableOpacity>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(400).duration(400)}>
            <PressButton
              variant="gradient"
              size="lg"
              fullWidth
              loading={isPending}
              disabled={isSubmitDisabled}
              onPress={handleSubmit}
              label={t('parent.linkStudent.submit')}
              testID="submit-button"
              trailingIcon={(
                <Ionicons
                  name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
                  size={18}
                  color={isSubmitDisabled ? colors.neutral.inkMuted : colors.neutral.white}
                />
              )}
            />
          </Animated.View>

          <View className="flex-1 items-center justify-end pt-6 pb-2">
            <Text
              className="px-4 text-center text-xs"
              style={{ color: colors.neutral.inkMuted, lineHeight: 18 }}
            >
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
          <Text className="text-base" style={{ color: colors.neutral.ink, lineHeight: 24 }}>
            {t('parent.linkStudent.helpContent')}
          </Text>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
