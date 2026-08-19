import { setAudioModeAsync } from 'expo-audio';

let audioModeConfigured = false;
let audioModeConfigurePromise = null;
let lastForcedAudioModeConfiguredAt = 0;

const FORCED_AUDIO_MODE_THROTTLE_MS = 900;

export async function configureAudioPlaybackMode({ force = false } = {}) {
  const now = Date.now();
  const shouldForce = force || (now - lastForcedAudioModeConfiguredAt > FORCED_AUDIO_MODE_THROTTLE_MS);

  if (audioModeConfigured && !shouldForce) {
    return;
  }

  if (audioModeConfigurePromise) {
    return audioModeConfigurePromise;
  }

  audioModeConfigurePromise = setAudioModeAsync({
    playsInSilentMode: true,
    interruptionMode: 'duckOthers',
    allowsRecording: false,
    shouldPlayInBackground: false,
    shouldRouteThroughEarpiece: false,
  })
    .then(() => {
      audioModeConfigured = true;
      if (shouldForce) {
        lastForcedAudioModeConfiguredAt = Date.now();
      }
    })
    .catch((error) => {
      audioModeConfigured = false;
      throw error;
    })
    .finally(() => {
      audioModeConfigurePromise = null;
    });

  return audioModeConfigurePromise;
}

export async function recoverAudioPlaybackMode() {
  return configureAudioPlaybackMode({ force: true });
}
