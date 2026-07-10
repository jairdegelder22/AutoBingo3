import { useEffect, useState } from 'react';
import { checkOnlineConnection } from '../services/liveLobbyService';

export default function useOnlineConnectionStatus(enabled, intervalMs = 5000) {
  const [isOnline, setIsOnline] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    let active = true;
    let intervalId = null;

    if (!enabled) {
      setIsOnline(true);
      setHasChecked(false);
      return undefined;
    }

    async function runCheck() {
      const nextOnline = await checkOnlineConnection();
      if (!active) {
        return;
      }
      setIsOnline(nextOnline);
      setHasChecked(true);
    }

    void runCheck();
    intervalId = setInterval(() => {
      void runCheck();
    }, intervalMs);

    return () => {
      active = false;
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [enabled, intervalMs]);

  return {
    isOnline,
    hasChecked,
    isOffline: enabled && hasChecked && !isOnline,
  };
}
