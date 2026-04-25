import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { I18nManager, KeyboardAvoidingView, Platform } from 'react-native';
import {
  Button,
  Input,
  PhoneField,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  View,
} from '@/components/ui';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import {
  buildE164Phone,
  DEFAULT_COUNTRY_CODE,
} from '@/shared/utils/phone';
import { NoOrgEmptyState } from '../components';
import { useInviteTeacher } from '../hooks';
import { useManagerStore } from '../store/manager-store';

export function TeacherInviteScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const inviteMutation = useInviteTeacher(activeOrgId);
  const [countryCode, setCountryCode] = useState(DEFAULT_COUNTRY_CODE);
  const [localPhone, setLocalPhone] = useState('');
  const [inviteeEmail, setInviteeEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!activeOrgId) {
    return <NoOrgEmptyState />;
  }

  const submit = async () => {
    const phone = buildE164Phone(countryCode, localPhone);
    const email = inviteeEmail.trim();
    if (!phone && !email) {
      setMessage(t('manager.teachers.inviteValidation', {
        defaultValue: 'Please provide at least a phone number or email address.',
      }));
      setIsSuccess(false);
      return;
    }
    try {
      await inviteMutation.mutateAsync({
        inviteePhone: phone ?? undefined,
        inviteeEmail: email || undefined,
      });
      setLocalPhone('');
      setInviteeEmail('');
      setMessage(t('manager.teachers.inviteSent', { defaultValue: 'Invitation sent successfully.' }));
      setIsSuccess(true);
      setTimeout(() => router.back(), 1500);
    }
    catch (error) {
      setMessage(getApiErrorMessage(
        error,
        t('manager.teachers.inviteError', { defaultValue: 'Unable to send the invitation right now.' }),
      ));
      setIsSuccess(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAFB]">
      <View className="flex-row items-center gap-3 px-6 pt-4 pb-2">
        <Pressable
          onPress={() => router.back()}
          className="size-10 items-center justify-center rounded-full bg-white"
        >
          <Ionicons
            name={I18nManager.isRTL ? 'arrow-forward' : 'arrow-back'}
            size={20}
            color="#0F172A"
          />
        </Pressable>
        <Text className="font-inter flex-1 text-xl font-semibold text-slate-900">
          {t('manager.teachers.inviteTitle', { defaultValue: 'Invite Teacher' })}
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerClassName="px-6 pb-12 pt-4">
          <Text className="font-inter mb-4 text-sm text-slate-500">
            {t('manager.teachers.inviteHint', {
              defaultValue: 'Enter a phone number, email address, or both. The teacher will receive an invitation to join your organization.',
            })}
          </Text>

          <PhoneField
            label={t('manager.teachers.phone', { defaultValue: 'Phone' })}
            countryCode={countryCode}
            localNumber={localPhone}
            onCountryCodeChange={setCountryCode}
            onLocalNumberChange={setLocalPhone}
            testIDPrefix="manager-teacher-invite-phone"
          />
          <Input
            label={t('manager.teachers.email', { defaultValue: 'Email' })}
            value={inviteeEmail}
            onChangeText={setInviteeEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {message
            ? (
                <View className={`mt-3 rounded-xl px-4 py-3 ${isSuccess ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <Text className={`font-inter text-sm ${isSuccess ? 'text-emerald-700' : 'text-red-600'}`}>
                    {message}
                  </Text>
                </View>
              )
            : null}

          <Button
            className="mt-6"
            label={t('manager.teachers.sendInvite', { defaultValue: 'Send invitation' })}
            onPress={submit}
            loading={inviteMutation.isPending}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
