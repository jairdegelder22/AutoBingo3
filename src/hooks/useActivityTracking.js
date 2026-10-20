import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { activityDate, activityTracker } from '../services/activityTrackingService';

export default function useActivityTracking(enabled, mode = null, playerCount = 1, gameKey = null) {
  const sessionRef = useRef(null);
  useEffect(() => {
    sessionRef.current = mode ? {
      id: `game-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`,
      startedDate: activityDate(new Date()),
    } : null;
  }, [mode, gameKey]);

  useEffect(() => {
    if (!enabled || __DEV__) return undefined;

    const record = () => {
      if (AppState.currentState === 'active') {
        void activityTracker.record({ mode, playerCount, session: sessionRef.current }).catch(() => {});
      }
    };
    record();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') record();
    });
    // Retry offline uploads and detect midnight during long sessions.
    // Unchanged days are handled locally, without a network request.
    const interval = setInterval(record, 5 * 60 * 1000);
    return () => {
      subscription.remove();
      clearInterval(interval);
    };
  }, [enabled, mode, playerCount, gameKey]);
}
