/**
 * LinkStudentScreen component
 * Allows parents to link a student to their account via access code
 * Validates: Requirements 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12, 9.13
 */

import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input, Modal, Text, useModal } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { useLinkStudent } from '../hooks';
import { extractErrorMessage } from '../services/error-utils';
import { linkStudentSchema } from '../validators/link-student.schema';

export function LinkStudentScreen() {
    const { t } = useTranslation();
    const router = useRouter();
    const [accessCode, setAccessCode] = useState('');
    const [validationError, setValidationError] = useState<string | null>(null);
    const { mutate, isPending, error } = useLinkStudent();
    const helpModalRef = useRef(useModal());

    // Clear validation error when user starts typing
    useEffect(() => {
        if (validationError) {
            setValidationError(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accessCode]);

    const handleSubmit = () => {
        // Validate using Zod schema
        const result = linkStudentSchema.safeParse({ accessCode });

        if (!result.success) {
            const firstError = result.error.issues[0];
            setValidationError(t(firstError.message));
            return;
        }

        // Submit with trimmed code
        mutate(accessCode.trim(), {
            onSuccess: () => {
                router.replace(AppRoute.parent.dashboard);
            },
        });
    };

    const isSubmitDisabled = !accessCode.trim() || isPending;
    const errorMessage = error ? extractErrorMessage(error, t) : null;

    return (
        <View className="flex-1 bg-white px-4 py-6">
            {/* Hero section */}
            <View className="mb-8">
                <Text className="text-2xl font-bold mb-2">
                    {t('parent.linkStudent.title')}
                </Text>
                <Text className="text-base text-gray-600">
                    {t('parent.linkStudent.description')}
                </Text>
            </View>

            {/* Input field */}
            <Input
                label={t('parent.linkStudent.inputLabel')}
                placeholder={t('parent.linkStudent.inputPlaceholder')}
                value={accessCode}
                onChangeText={setAccessCode}
                editable={!isPending}
                testID="access-code-input"
                error={validationError ?? undefined}
            />

            {/* Help link */}
            <View className="mb-6">
                <Button
                    label={t('parent.linkStudent.helpLink')}
                    variant="ghost"
                    size="sm"
                    onPress={() => helpModalRef.current?.present()}
                    testID="help-link"
                />
            </View>

            {/* Error state */}
            {errorMessage && (
                <View className="mb-4 p-3 bg-red-50 rounded" testID="error-message">
                    <Text className="text-red-600 text-sm">
                        {errorMessage}
                    </Text>
                </View>
            )}

            {/* Submit button */}
            <View className="mb-6 relative">
                <Button
                    label={t('parent.linkStudent.submit')}
                    onPress={handleSubmit}
                    disabled={isSubmitDisabled}
                    loading={isPending}
                    testID="submit-button"
                />
            </View>

            {/* Fallback help text */}
            <View className="mt-auto">
                <Text className="text-xs text-gray-500 text-center">
                    {t('parent.linkStudent.fallbackHelp')}
                </Text>
            </View>

            {/* Help modal */}
            <Modal
                ref={helpModalRef.current?.ref}
                snapPoints={['50%']}
                title={t('parent.linkStudent.helpLink')}
            >
                <View className="px-4 pb-6">
                    <Text className="text-base text-gray-700">
                        {t('parent.linkStudent.helpContent')}
                    </Text>
                </View>
            </Modal>
        </View>
    );
}
