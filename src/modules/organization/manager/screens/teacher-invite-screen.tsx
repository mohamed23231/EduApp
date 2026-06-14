import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import {
  Input,
  PhoneField,
  PressButton,
  Text,
  TopBar,
} from '@/components/ui';
import colors from '@/components/ui/colors';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { buildE164Phone, DEFAULT_COUNTRY_CODE } from '@/shared/utils/phone';
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
      await inviteMutation.mutateAsync({ inviteePhone: phone ?? undefined, inviteeEmail: email || undefined });
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
    <View className="flex-1" style={{ backgroundColor: colors.neutral.paper }}>
      <TopBar
        title={t('manager.teachers.inviteTitle', { defaultValue: 'Invite Teacher' })}
        onBack={() => router.back()}
      />

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 48, paddingTop: 16, gap: 0 }}>
          {/* Hint */}
          <Text style={{ fontSize: 13, color: colors.neutral.inkMuted, fontWeight: '500', marginBottom: 20, lineHeight: 20 }}>
            {t('manager.teachers.inviteHint', {
              defaultValue: 'Enter a phone number, email address, or both. The teacher will receive an invitation to join your organization.',
            })}
          </Text>

          {/* Form card */}
          <View style={{ backgroundColor: colors.neutral.card, borderRadius: 24, padding: 20, borderWidth: 1.5, borderColor: colors.neutral.rule, gap: 4 }}>
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
          </View>

          {/* Feedback banner */}
          {message && (
            <View style={{
              marginTop: 12,
              borderRadius: 14,
              paddingHorizontal: 16,
              paddingVertical: 12,
              backgroundColor: isSuccess ? colors.semantic.presentSoft : colors.semantic.absentSoft,
              borderWidth: 1,
              borderColor: isSuccess ? colors.semantic.present : colors.semantic.absent,
            }}
            >
              <Text style={{ fontSize: 13, fontWeight: '600', color: isSuccess ? colors.semantic.presentInk : colors.semantic.absentInk }}>
                {message}
              </Text>
            </View>
          )}

          {/* CTA */}
          <PressButton
            variant="primary"
            size="lg"
            fullWidth
            label={t('manager.teachers.sendInvite', { defaultValue: 'Send invitation' })}
            onPress={submit}
            loading={inviteMutation.isPending}
            style={{ marginTop: 20 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
