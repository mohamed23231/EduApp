/**
 * useSessionActions hook
 * Handles start, end, and attendance navigation for session cards.
 * Extracted from DashboardScreen to keep component lean.
 */

import * as Burnt from 'burnt';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useModal } from '@/components/ui';
import { AppRoute } from '@/core/navigation/routes';
import { endSession, extractErrorMessage, startSession } from '../services';
import { updateSessionState } from '../store/use-teacher-store';

export function useSessionActions(refetchSessions: () => Promise<void>) {
  const { t } = useTranslation();
  const router = useRouter();
  const [isStartingId, setIsStartingId] = useState<string | null>(null);
  const [isEndingId, setIsEndingId] = useState<string | null>(null);
  const [pendingEndId, setPendingEndId] = useState<string | null>(null);
  const confirmEndModal = useModal();

  const handleStartSession = useCallback(async (sessionId: string) => {
    try {
      setIsStartingId(sessionId);
      const updated = await startSession(sessionId);
      updateSessionState(sessionId, updated.state);
      Burnt.toast({ title: t('teacher.sessions.startSession'), preset: 'done', haptic: 'success' });
    }
    catch {
      Burnt.toast({ title: t('teacher.common.genericError'), preset: 'error', haptic: 'error' });
    }
    finally {
      setIsStartingId(null);
    }
  }, [t]);

  const handleEndSessionRequest = useCallback((instanceId: string) => {
    setPendingEndId(instanceId);
    confirmEndModal.present();
  }, [confirmEndModal]);

  const handleEndSessionConfirm = useCallback(async () => {
    if (!pendingEndId)
      return;
    confirmEndModal.dismiss();
    try {
      setIsEndingId(pendingEndId);
      const updated = await endSession(pendingEndId);
      updateSessionState(pendingEndId, updated.state);
      Burnt.toast({ title: t('teacher.sessions.endSessionSuccess'), preset: 'done', haptic: 'success' });
      refetchSessions();
    }
    catch {
      Burnt.toast({ title: t('teacher.common.genericError'), preset: 'error', haptic: 'error' });
    }
    finally {
      setIsEndingId(null);
      setPendingEndId(null);
    }
  }, [pendingEndId, confirmEndModal, t, refetchSessions]);

  const handleMarkAttendance = useCallback(
    (instanceId: string) => router.push(AppRoute.teacher.attendance(instanceId) as any),
    [router],
  );

  const handleCancelEnd = useCallback(() => {
    confirmEndModal.dismiss();
    setPendingEndId(null);
  }, [confirmEndModal]);

  return {
    isStartingId,
    isEndingId,
    confirmEndModal,
    handleStartSession,
    handleEndSessionRequest,
    handleEndSessionConfirm,
    handleMarkAttendance,
    handleCancelEnd,
  };
}
