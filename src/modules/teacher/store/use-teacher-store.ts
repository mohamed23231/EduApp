import type { SessionInstance } from '../types';
import { create } from 'zustand';
import { createSelectors } from '@/lib/utils';

// ─── Store Types ─────────────────────────────────────────────────────────────

export type TeacherState = {
  // State
  todaySessions: SessionInstance[];
  isLoadingSessions: boolean;
  sessionsError: string | null;

  // Actions
  setTodaySessions: (sessions: SessionInstance[]) => void;
  setLoadingSessions: (isLoading: boolean) => void;
  setSessionsError: (error: string | null) => void;
  updateSessionState: (sessionId: string, state: SessionInstance['state']) => void;
  reset: () => void;
};

// ─── Store Implementation ─────────────────────────────────────────────────────

const _useTeacherStore = create<TeacherState>(set => ({
  // Initial state
  todaySessions: [],
  isLoadingSessions: false,
  sessionsError: null,

  /**
   * Set today's sessions
   */
  setTodaySessions: (sessions: SessionInstance[]) => {
    set({ todaySessions: sessions, sessionsError: null });
  },

  /**
   * Set loading state for sessions
   */
  setLoadingSessions: (isLoading: boolean) => {
    set({ isLoadingSessions: isLoading });
  },

  /**
   * Set error state for sessions
   */
  setSessionsError: (error: string | null) => {
    set({ sessionsError: error });
  },

  /**
   * Update the state of a specific session
   */
  updateSessionState: (sessionId: string, state: SessionInstance['state']) => {
    set(prevState => ({
      todaySessions: prevState.todaySessions.map(session =>
        session.id === sessionId ? { ...session, state } : session,
      ),
    }));
  },

  /**
   * Reset store to initial state
   */
  reset: () => {
    set({
      todaySessions: [],
      isLoadingSessions: false,
      sessionsError: null,
    });
  },
}));

export const useTeacherStore = createSelectors(_useTeacherStore);

// ─── Exported Actions ─────────────────────────────────────────────────────────

export function setTodaySessions(sessions: SessionInstance[]) {
  return _useTeacherStore.getState().setTodaySessions(sessions);
}

export function setLoadingSessions(isLoading: boolean) {
  return _useTeacherStore.getState().setLoadingSessions(isLoading);
}

export function setSessionsError(error: string | null) {
  return _useTeacherStore.getState().setSessionsError(error);
}

export function updateSessionState(sessionId: string, state: SessionInstance['state']) {
  return _useTeacherStore.getState().updateSessionState(sessionId, state);
}

export function resetTeacherStore() {
  return _useTeacherStore.getState().reset();
}
