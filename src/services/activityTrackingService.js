import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { getOrCreateInstallationId } from './appInstallationService';
import { supabase } from './supabaseClient';

const STORAGE_KEY = 'autobingo:daily-activity:v1';
const APP_VERSION = require('../../app.json').expo.version;
const DAY_MS = 24 * 60 * 60 * 1000;

export function activityDate(date) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(date);
  const value = (type) => parts.find((part) => part.type === type).value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

// One row per installation/day. Repeated delivery is safe, including after a crash.
export function createActivityTracker({ storage, send, now = () => new Date() }) {
  let operations = Promise.resolve();

  function record({ mode = null, playerCount = 1, session = null } = {}) {
    const operation = operations.then(async () => {
      let state;
      const stored = await storage.getItem(STORAGE_KEY);
      try {
        state = JSON.parse(stored);
      } catch (_error) {
        state = null;
      }
      if (!state?.days || !state?.acknowledged) {
        state = { days: {}, acknowledged: {} };
      }

      const currentTime = now();
      const day = activityDate(currentTime);
      const cutoff = activityDate(new Date(currentTime.getTime() - 89 * DAY_MS));
      for (const previousDay of Object.keys(state.days)) {
        if (previousDay < cutoff || previousDay > day) {
          delete state.days[previousDay];
          delete state.acknowledged[previousDay];
        }
      }

      const entry = state.days[day] ?? { online_players: 0, offline_players: 0, games: [] };
      if (mode === 'online' || mode === 'offline') {
        const count = Number.isFinite(playerCount) ? Math.min(16, Math.max(1, Math.floor(playerCount))) : 1;
        entry[`${mode}_players`] = Math.max(entry[`${mode}_players`], count);
        if (session?.startedDate === day && !entry.games.some((game) => game.session_id === session.id)
            && entry.games.length < 250) {
          entry.games.push({ session_id: session.id, mode, player_count: count });
        }
      }
      state.days[day] = entry;
      // Persist before networking so airplane mode and app termination do not lose activity.
      await storage.setItem(STORAGE_KEY, JSON.stringify(state));

      const pending = Object.entries(state.days)
        .filter(([date, activity]) => state.acknowledged[date] !== JSON.stringify(activity))
        .map(([date, activity]) => ({ activity_date: date, ...activity }));
      if (!pending.length) {
        return;
      }

      await send(pending);
      for (const { activity_date: date, ...activity } of pending) {
        state.acknowledged[date] = JSON.stringify(activity);
      }
      await storage.setItem(STORAGE_KEY, JSON.stringify(state));
    });
    // A failed upload remains pending and must not block future attempts.
    operations = operation.catch(() => {});
    return operation;
  }

  return { record };
}

export const activityTracker = createActivityTracker({
  storage: AsyncStorage,
  send: async (days) => {
    const installationId = await getOrCreateInstallationId();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const { error } = await supabase.rpc('track_daily_activity', {
        p_installation_id: installationId,
        p_days: days,
        p_platform: Platform.OS,
        p_app_version: APP_VERSION,
      }).abortSignal(controller.signal);
      if (error) throw error;
    } finally {
      clearTimeout(timeout);
    }
  },
});
