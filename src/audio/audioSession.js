import { setAudioModeAsync } from 'expo-audio';

let audioModeConfigured = false;
let audioModeConfigurePromise = null;

export async function configureAudioPlaybackMode({ force = false } = {}) {
  if (audioModeConfigured && !force) {
    return;
  }

  if (audioModeConfigurePromise && !force) {
    return audioModeConfigurePromise;
  }

  audioModeConfigurePromise = setAudioModeAsync({
    playsInSilentMode: true,
  })
    .then(() => {
      audioModeConfigured = true;
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
