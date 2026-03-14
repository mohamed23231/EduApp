import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Text, View } from '@/components/ui';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { useInviteTeacher } from '../hooks';
import { useManagerStore } from '../store/manager-store';

export function InviteTeacherModal() {
  const { t } = useTranslation();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const inviteMutation = useInviteTeacher(activeOrgId);
  const [values, setValues] = useState({ inviteePhone: '', inviteeEmail: '' });
  const [message, setMessage] = useState<string | null>(null);

  const submit = async () => {
    const phone = values.inviteePhone.trim();
    const email = values.inviteeEmail.trim();
    if (!phone && !email) {
      setMessage(t('manager.teachers.inviteValidation', 'Phone or email is required'));
      return;
    }
    try {
      await inviteMutation.mutateAsync({
        inviteePhone: phone || undefined,
        inviteeEmail: email || undefined,
      });
      setValues({ inviteePhone: '', inviteeEmail: '' });
      setMessage(t('manager.teachers.inviteSent', 'Invitation sent'));
    }
    catch (error) {
      setMessage(getApiErrorMessage(error, t('manager.teachers.inviteError', 'Failed to send invitation')));
    }
  };

  return (
    <View className="mt-5 rounded-[28px] bg-white p-5">
      <Text className="font-inter text-lg font-semibold text-slate-900">
        {t('manager.teachers.inviteTitle', 'Invite Teacher')}
      </Text>
      <Input
        label={t('manager.teachers.phone', 'Phone')}
        value={values.inviteePhone}
        onChangeText={inviteePhone => setValues(c => ({ ...c, inviteePhone }))}
      />
      <Input
        label={t('manager.teachers.email', 'Email')}
        value={values.inviteeEmail}
        onChangeText={inviteeEmail => setValues(c => ({ ...c, inviteeEmail }))}
      />
      {message
        ? <Text className="font-inter mt-2 text-sm text-slate-500">{message}</Text>
        : null}
      <Button
        className="mt-3"
        label={t('manager.teachers.sendInvite', 'Send Invitation')}
        onPress={submit}
        loading={inviteMutation.isPending}
      />
    </View>
  );
}
