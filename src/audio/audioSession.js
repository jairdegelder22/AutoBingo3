import { setAudioModeAsync } from 'expo-audio';

let audioModeConfigured = false;

export async function configureAudioPlaybackMode({ force = false } = {}) {
  if (audioModeConfigured && !force) {
    return;
  }

  audioModeConfigured = true;
  await setAudioModeAsync({
    playsInSilentMode: true,
  });
}
