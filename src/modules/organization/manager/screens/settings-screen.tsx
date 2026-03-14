import type { OrganizationDetails } from '../types/manager.types';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Button, Input, SafeAreaView, ScrollView, Text, View } from '@/components/ui';
import { getApiErrorMessage } from '@/shared/services/api-utils';
import { useOrganization, useOrganizations, useUpdateOrg } from '../hooks';
import { useManagerStore } from '../store/manager-store';

function UsageBar({ label, current, limit }: { label: string; current: number; limit: number | null | undefined }) {
  const percent = !limit || limit <= 0 ? 0 : Math.min(100, Math.round((current / limit) * 100));
  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between">
        <Text className="font-inter text-sm text-slate-700">{label}</Text>
        <Text className="font-inter text-sm text-slate-500">
          {current}
          /
          {limit ?? '∞'}
        </Text>
      </View>
      <View className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
        <View className="h-2 rounded-full bg-emerald-600" style={{ width: `${percent}%` }} />
      </View>
    </View>
  );
}

function OrgEditForm({ org }: { org: OrganizationDetails }) {
  const { t } = useTranslation();
  const updateMutation = useUpdateOrg();
  const [values, setValues] = useState({
    name: org.name,
    phoneE164: org.phoneE164 ?? '',
    email: org.email ?? '',
    address: org.address ?? '',
  });
  const [message, setMessage] = useState<string | null>(null);

  const usage = useMemo(() => [
    { label: t('manager.settings.usage.students', { defaultValue: 'Students' }), current: org.currentStudents, limit: org.limits?.maxStudents },
    { label: t('manager.settings.usage.teachers', { defaultValue: 'Teachers' }), current: org.currentTeachers, limit: org.limits?.maxTeachers },
    { label: t('manager.settings.usage.templates', { defaultValue: 'Session templates' }), current: org.currentSessions, limit: org.limits?.maxSessions },
    { label: t('manager.settings.usage.minutes', { defaultValue: 'Session minutes' }), current: org.currentSessionMinutes, limit: org.limits?.maxSessionMinutes },
  ], [org, t]);

  const entitlementDateLine = (() => {
    if (org.entitlementSource === 'trial' && org.trial?.endDate) {
      return t('manager.settings.trialEndDate', { defaultValue: 'Trial ends: {{date}}', date: org.trial.endDate });
    }
    if (org.entitlementSource === 'subscription' && org.trial) {
      return t('manager.settings.subscriptionDates', { defaultValue: 'Subscription: {{start}} — {{end}}', start: org.trial.startDate, end: org.trial.endDate });
    }
    return null;
  })();

  const submit = async () => {
    try {
      await updateMutation.mutateAsync({ orgId: org.id, input: values });
      setMessage(t('manager.settings.updated', { defaultValue: 'Organization settings updated.' }));
    }
    catch (error) {
      setMessage(getApiErrorMessage(error, t('manager.settings.updateError', { defaultValue: 'Unable to update organization settings.' })));
    }
  };

  return (
    <>
      <View className="mt-5 rounded-[28px] bg-white p-5">
        <Input label={t('manager.settings.fields.name', { defaultValue: 'Organization name' })} value={values.name} onChangeText={name => setValues(c => ({ ...c, name }))} />
        <Input label={t('manager.settings.fields.phone', { defaultValue: 'Phone' })} value={values.phoneE164} onChangeText={phoneE164 => setValues(c => ({ ...c, phoneE164 }))} />
        <Input label={t('manager.settings.fields.email', { defaultValue: 'Email' })} value={values.email} onChangeText={email => setValues(c => ({ ...c, email }))} />
        <Input label={t('manager.settings.fields.address', { defaultValue: 'Address' })} value={values.address} onChangeText={address => setValues(c => ({ ...c, address }))} multiline />
        {message ? <Text className="font-inter mt-2 text-sm text-slate-500">{message}</Text> : null}
        <Button className="mt-3" label={t('manager.settings.save', { defaultValue: 'Save settings' })} onPress={submit} loading={updateMutation.isPending} />
      </View>
      <View className="mt-5 rounded-[28px] bg-white p-5">
        <Text className="font-inter text-lg font-semibold text-slate-900">{t('manager.settings.usage.title', { defaultValue: 'Usage' })}</Text>
        <Text className="font-inter mt-1 text-sm text-slate-500">{t('manager.settings.usage.source', { defaultValue: 'Source: {{source}}', source: org.entitlementSource ?? 'trial' })}</Text>
        {entitlementDateLine ? <Text className="font-inter mt-1 text-sm text-slate-500">{entitlementDateLine}</Text> : null}
        {usage.map(item => <UsageBar key={item.label} label={item.label} current={item.current} limit={item.limit} />)}
      </View>
    </>
  );
}

export function SettingsScreen() {
  const { t } = useTranslation();
  const activeOrgId = useManagerStore.use.activeOrgId();
  const setActiveOrgId = useManagerStore.use.setActiveOrgId();
  const organizationsQuery = useOrganizations();
  const organizationQuery = useOrganization(activeOrgId);

  useEffect(() => {
    if (!activeOrgId && organizationsQuery.data?.data[0]) {
      setActiveOrgId(organizationsQuery.data.data[0].id);
    }
  }, [activeOrgId, organizationsQuery.data, setActiveOrgId]);

  if (organizationQuery.isLoading) {
    return <SafeAreaView className="flex-1 items-center justify-center bg-[#f5f1e8]"><ActivityIndicator size="large" /></SafeAreaView>;
  }

  if (organizationQuery.isError) {
    return (
      <SafeAreaView className="flex-1 bg-[#f5f1e8]">
        <ScrollView contentContainerClassName="px-6 py-6">
          <Text className="font-inter text-3xl font-semibold text-slate-900">{t('manager.settings.title', { defaultValue: 'Settings' })}</Text>
          <View className="mt-5 items-center gap-3 py-6">
            <Ionicons name="alert-circle-outline" size={32} color="#DC2626" />
            <Text className="font-inter text-sm text-red-600">{t('manager.settings.errorLoading', { defaultValue: 'Failed to load organization settings.' })}</Text>
            <Button variant="outline" size="sm" label={t('manager.settings.errorRetry', { defaultValue: 'Retry' })} fullWidth={false} onPress={() => organizationQuery.refetch()} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#f5f1e8]">
      <ScrollView contentContainerClassName="px-6 py-6">
        <Text className="font-inter text-3xl font-semibold text-slate-900">{t('manager.settings.title', { defaultValue: 'Settings' })}</Text>
        <Text className="font-inter mt-2 text-base text-slate-500">{t('manager.settings.subtitle', { defaultValue: 'Keep organization details current and watch entitlement usage at a glance.' })}</Text>
        {organizationQuery.data && <OrgEditForm org={organizationQuery.data} />}
      </ScrollView>
    </SafeAreaView>
  );
}
