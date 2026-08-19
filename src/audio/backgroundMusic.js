import { createAudioPlayer } from 'expo-audio';
import { configureAudioPlaybackMode } from './audioSession';

const TRACKS = {
  home: {
    source: require('../../assets/audio/home-background-theme.mp3'),
    volume: 0.10,
  },
  game: {
    source: require('../../assets/audio/game-background-theme.mp3'),
    volume: 0.10,
  },
};

const FADE_OUT_DURATION_MS = 850;
const FADE_IN_DURATION_MS = 1800;
const FADE_STEP_MS = 50;

const players = {};
const fadePromises = {};
const fadeInPromises = {};
const fadeTokens = {};
const fadeInTokens = {};
const playbackRecoveryTokens = {};
let currentTrackName = null;
let gameMusicStoppedForBingo = false;
let gameMusicShouldFadeIn = false;

function cancelTrackFades(trackName) {
  if (!trackName) {
    return;
  }

  fadeTokens[trackName] = (fadeTokens[trackName] ?? 0) + 1;
  fadeInTokens[trackName] = (fadeInTokens[trackName] ?? 0) + 1;
  fadePromises[trackName] = null;
  fadeInPromises[trackName] = null;
}

function getPlayer(trackName) {
  const track = TRACKS[trackName];

  if (!track) {
    return null;
  }

  if (!players[trackName]) {
    players[trackName] = createAudioPlayer(track.source);
    players[trackName].loop = true;
    players[trackName].volume = track.volume;
  }

  return players[trackName];
}

function shouldPlayMusic(settings) {
  return (
    settings?.masterSoundEnabled !== false
    && settings?.musicEnabled !== false
  );
}

function stopBackgroundMusicImmediately(trackName = currentTrackName) {
  if (!trackName || !players[trackName]) {
    return;
  }

  cancelTrackFades(trackName);
  playbackRecoveryTokens[trackName] = (playbackRecoveryTokens[trackName] ?? 0) + 1;

  try {
    players[trackName].pause();
    players[trackName].volume = TRACKS[trackName]?.volume ?? 0.35;
  } catch (_error) {
    // Non-critical: music should never block app navigation.
  }

  if (currentTrackName === trackName) {
    currentTrackName = null;
  }
}

function stopAllBackgroundMusicImmediately() {
  Object.keys(TRACKS).forEach((trackName) => {
    stopBackgroundMusicImmediately(trackName);
  });
}

export async function fadeOutBackgroundMusic(trackName = currentTrackName, durationMs = FADE_OUT_DURATION_MS) {
  if (!trackName || !players[trackName]) {
    return;
  }

  playbackRecoveryTokens[trackName] = (playbackRecoveryTokens[trackName] ?? 0) + 1;

  if (fadePromises[trackName]) {
    return fadePromises[trackName];
  }

  const player = players[trackName];
  const startVolume = Number(player.volume ?? TRACKS[trackName]?.volume ?? 0.35);
  const steps = Math.max(1, Math.ceil(durationMs / FADE_STEP_MS));
  const stepMs = durationMs / steps;
  const fadeToken = (fadeTokens[trackName] ?? 0) + 1;
  fadeTokens[trackName] = fadeToken;
  fadeInTokens[trackName] = (fadeInTokens[trackName] ?? 0) + 1;
  fadeInPromises[trackName] = null;

  fadePromises[trackName] = new Promise((resolve) => {
    let step = 0;

    const interval = setInterval(() => {
      if (fadeTokens[trackName] !== fadeToken) {
        clearInterval(interval);
        fadePromises[trackName] = null;
        resolve();
        return;
      }

      step += 1;
      const progress = Math.min(1, step / steps);
      player.volume = startVolume * (1 - progress);

      if (progress >= 1) {
        clearInterval(interval);

        try {
          player.pause();
          player.volume = TRACKS[trackName]?.volume ?? 0.35;
        } catch (_error) {
          // Non-critical: music should never block app navigation.
        }

        if (currentTrackName === trackName) {
          currentTrackName = null;
        }

        fadePromises[trackName] = null;
        resolve();
      }
    }, stepMs);
  });

  return fadePromises[trackName];
}

export function fadeOutHomeBackgroundMusic(durationMs = FADE_OUT_DURATION_MS) {
  return fadeOutBackgroundMusic('home', durationMs);
}

function fadeInBackgroundMusic(trackName, durationMs = FADE_IN_DURATION_MS) {
  const player = players[trackName];
  const targetVolume = TRACKS[trackName]?.volume ?? 0.35;

  if (!player) {
    return Promise.resolve();
  }

  if (fadeInPromises[trackName]) {
    return fadeInPromises[trackName];
  }

  const steps = Math.max(1, Math.ceil(durationMs / FADE_STEP_MS));
  const stepMs = durationMs / steps;
  const fadeToken = (fadeInTokens[trackName] ?? 0) + 1;
  fadeInTokens[trackName] = fadeToken;
  player.volume = 0;

  fadeInPromises[trackName] = new Promise((resolve) => {
    let step = 0;

    const interval = setInterval(() => {
      if (fadeInTokens[trackName] !== fadeToken) {
        clearInterval(interval);
        fadeInPromises[trackName] = null;
        resolve();
        return;
      }

      step += 1;
      const linearProgress = Math.min(1, step / steps);
      const smoothProgress = linearProgress * linearProgress * (3 - 2 * linearProgress);
      player.volume = targetVolume * smoothProgress;

      if (linearProgress >= 1) {
        clearInterval(interval);
        player.volume = targetVolume;
        fadeInPromises[trackName] = null;
        resolve();
      }
    }, stepMs);
  });

  return fadeInPromises[trackName];
}

function schedulePlaybackRecovery(trackName, settings) {
  const player = players[trackName];

  if (!player || !shouldPlayMusic(settings)) {
    return;
  }

  const recoveryToken = (playbackRecoveryTokens[trackName] ?? 0) + 1;
  playbackRecoveryTokens[trackName] = recoveryToken;

  [140, 520, 1100].forEach((delayMs) => {
    setTimeout(async () => {
      try {
        if (playbackRecoveryTokens[trackName] !== recoveryToken) {
          return;
        }

        if (currentTrackName !== trackName || (trackName === 'game' && gameMusicStoppedForBingo)) {
          return;
        }

        if (player.playing) {
          return;
        }

        await configureAudioPlaybackMode({ force: true });

        if (playbackRecoveryTokens[trackName] !== recoveryToken || currentTrackName !== trackName) {
          return;
        }

        player.loop = true;

        if (!fadeInPromises[trackName] && !fadePromises[trackName]) {
          player.volume = TRACKS[trackName]?.volume ?? 0.35;
        }

        player.play();
      } catch (_error) {
        // A later recovery attempt or route change can try again.
      }
    }, delayMs);
  });
}

export async function playBackgroundMusic(trackName, settings) {
  if (!shouldPlayMusic(settings)) {
    stopAllBackgroundMusicImmediately();
    return;
  }

  if (!TRACKS[trackName]) {
    await fadeOutBackgroundMusic(currentTrackName);
    return;
  }

  if (trackName === 'game' && gameMusicStoppedForBingo) {
    return;
  }

  try {
    await configureAudioPlaybackMode();

    const previousTrackName = currentTrackName;

    if (currentTrackName && currentTrackName !== trackName) {
      await fadeOutBackgroundMusic(currentTrackName);
    }

    const player = getPlayer(trackName);

    if (!player) {
      return;
    }

    cancelTrackFades(trackName);
    currentTrackName = trackName;
    player.loop = true;
    const shouldFadeIn = (
      (previousTrackName === 'game' && trackName === 'home')
      || (trackName === 'game' && gameMusicShouldFadeIn)
    );

    player.volume = shouldFadeIn ? 0 : TRACKS[trackName].volume;

    if (!player.playing) {
      player.play();
    }

    schedulePlaybackRecovery(trackName, settings);

    if (shouldFadeIn) {
      if (trackName === 'game') {
        gameMusicShouldFadeIn = false;
      }

      void fadeInBackgroundMusic(trackName);
    }
  } catch (_error) {
    // Music should never block app navigation.
  }
}

export async function playHomeBackgroundMusic(settings) {
  await playBackgroundMusic('home', settings);
}

export async function playGameBackgroundMusic(settings) {
  await playBackgroundMusic('game', settings);
}

export async function resetGameBackgroundMusicForNewRound() {
  gameMusicStoppedForBingo = false;
  gameMusicShouldFadeIn = true;
  playbackRecoveryTokens.game = (playbackRecoveryTokens.game ?? 0) + 1;
  fadeTokens.game = (fadeTokens.game ?? 0) + 1;
  fadeInTokens.game = (fadeInTokens.game ?? 0) + 1;
  fadePromises.game = null;
  fadeInPromises.game = null;

  try {
    await configureAudioPlaybackMode();
    const player = getPlayer('game');
    player.volume = 0;
    await player.seekTo(0);
  } catch (_error) {
    // Non-critical: music should never block app navigation.
  }
}

export function stopGameBackgroundMusicForBingo() {
  gameMusicStoppedForBingo = true;
  return fadeOutBackgroundMusic('game');
}

export function pauseBackgroundMusic() {
  return fadeOutBackgroundMusic(currentTrackName);
}

export function pauseHomeBackgroundMusic() {
  return fadeOutBackgroundMusic('home');
}

export async function restoreBackgroundMusicAfterInterruption(settings) {
  try {
    await configureAudioPlaybackMode({ force: true });

    if (!shouldPlayMusic(settings)) {
      stopAllBackgroundMusicImmediately();
      return;
    }

    if (!currentTrackName || !TRACKS[currentTrackName]) {
      return;
    }

    if (currentTrackName === 'game' && gameMusicStoppedForBingo) {
      return;
    }

    const trackName = currentTrackName;
    const player = getPlayer(trackName);

    if (!player) {
      return;
    }

    player.loop = true;

    if (!fadePromises[trackName] && !fadeInPromises[trackName]) {
      player.volume = TRACKS[trackName].volume;
    }

    if (!player.playing) {
      player.play();
    }
  } catch (_error) {
    // Interruption recovery should never block the app.
  }
}
