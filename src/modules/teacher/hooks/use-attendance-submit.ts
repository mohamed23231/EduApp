/**
 * useAttendanceSubmit hook
 * Owns the confirmation-modal state and submit flow for the attendance sheet,
 * keeping the screen wrapper lean.
 */

import type { SessionInstance } from '../types';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { extractErrorMessage } from '../services';

type ConfirmModalState = {
  visible: boolean;
  title: string;
  message: string;
  variant: 'default' | 'destructive' | 'success';
  hideCancelButton: boolean;
  onConfirm: () => void;
};

const INITIAL_CONFIRM: ConfirmModalState = {
  visible: false,
  title: '',
  message: '',
  variant: 'default',
  hideCancelButton: false,
  onConfirm: () => {},
};

type SubmitDeps = {
  session: SessionInstance | null | undefined;
  submitAttendance: () => Promise<void>;
};

export function useAttendanceSubmit({ session, submitAttendance }: SubmitDeps) {
  const { t } = useTranslation();
  const router = useRouter();
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>(INITIAL_CONFIRM);

  const dismissConfirm = () => setConfirmModal(prev => ({ ...prev, visible: false }));

  const showError = (message: string) => {
    setConfirmModal({
      visible: true,
      title: t('teacher.attendance.error'),
      message,
      variant: 'destructive',
      hideCancelButton: true,
      onConfirm: dismissConfirm,
    });
  };

  const handleSubmit = async () => {
    if (!session) {
      showError(t('teacher.common.genericError'));
      return;
    }
    if (session.state !== 'ACTIVE') {
      showError(t('teacher.attendance.sessionNotActive'));
      return;
    }
    try {
      await submitAttendance();
      setConfirmModal({
        visible: true,
        title: t('teacher.attendance.submitSuccess'),
        message: '',
        variant: 'success',
        hideCancelButton: true,
        onConfirm: () => {
          dismissConfirm();
          router.back();
        },
      });
    }
    catch (err) {
      showError(extractErrorMessage(err, t, 'teacher.common.genericError'));
    }
  };

  return { confirmModal, dismissConfirm, handleSubmit };
}
