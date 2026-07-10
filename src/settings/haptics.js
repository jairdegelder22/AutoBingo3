import * as ExpoHaptics from 'expo-haptics';

let hapticsEnabled = true;

export const ImpactFeedbackStyle = ExpoHaptics.ImpactFeedbackStyle;
export const NotificationFeedbackType = ExpoHaptics.NotificationFeedbackType;

export function setHapticsEnabled(enabled) {
  hapticsEnabled = enabled !== false;
}

export function getHapticsEnabled() {
  return hapticsEnabled;
}

export function impactAsync(style) {
  if (!hapticsEnabled) {
    return Promise.resolve();
  }

  return ExpoHaptics.impactAsync(style);
}

export function notificationAsync(type) {
  if (!hapticsEnabled) {
    return Promise.resolve();
  }

  return ExpoHaptics.notificationAsync(type);
}

export function selectionAsync() {
  if (!hapticsEnabled) {
    return Promise.resolve();
  }

  return ExpoHaptics.selectionAsync();
}
