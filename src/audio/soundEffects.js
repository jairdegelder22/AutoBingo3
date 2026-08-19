import { createAudioPlayer } from 'expo-audio';
import { configureAudioPlaybackMode } from './audioSession';

const SOUND_EFFECTS = {
  bingoCheer: require('../../assets/audio/bingo-cheer.mp3'),
  bingoItemCheck: require('../../assets/audio/bingo-item-check.mp3'),
  bingoItemCheckPitch1: require('../../assets/audio/bingo-item-check-pitch-1.mp3'),
  bingoItemCheckPitch2: require('../../assets/audio/bingo-item-check-pitch-2.mp3'),
  bingoItemCheckPitch3: require('../../assets/audio/bingo-item-check-pitch-3.mp3'),
  bingoItemCheckPitch4: require('../../assets/audio/bingo-item-check-pitch-4.mp3'),
  bingoItemCheckPitch5: require('../../assets/audio/bingo-item-check-pitch-5.mp3'),
  bingoItemCheckPitch6: require('../../assets/audio/bingo-item-check-pitch-6.mp3'),
  bingoItemCheckPitch7: require('../../assets/audio/bingo-item-check-pitch-7.mp3'),
  gameSettingsKlapIn: require('../../assets/audio/game-settings-klap-in.mp3'),
  gameSettingsKlapUit: require('../../assets/audio/game-settings-klap-uit.mp3'),
  glossyButtonClick: require('../../assets/audio/glossy-button-click.mp3'),
  holdDownTicking: require('../../assets/audio/hold-down-ticking.mp3'),
  onlineHornMode: require('../../assets/audio/online-horn-mode.mp3'),
  playHornHonk: require('../../assets/audio/play-horn-honk.wav'),
  scrollGeluid: require('../../assets/audio/scroll-geluid.wav'),
  settingsGearClick: require('../../assets/audio/settings-gear-click.wav'),
  navTabSwitchClick: require('../../assets/audio/nav-tab-switch-click.mp3'),
  skinUnlockBell: require('../../assets/audio/skin-unlock-bell.mp3'),
};

const players = {};
const pooledPlayers = {};
const pooledPlayerIndexes = {};
const SOUND_EFFECT_RECOVERY_DELAY_MS = 24;
const playerPlayTokens = new WeakMap();

function shouldPlay(settings) {
  return (
    settings?.masterSoundEnabled !== false
    && settings?.soundEffectsEnabled !== false
  );
}

function getVolume(settings) {
  const volume = Number(settings?.soundEffectsVolume ?? 1);
  if (Number.isNaN(volume)) {
    return 1;
  }

  return Math.min(1, Math.max(0, volume));
}

function applyPlaybackOptions(player, settings, options = {}) {
  const playbackRate = Number(options.playbackRate ?? 1);
  const resolvedPlaybackRate = Number.isFinite(playbackRate)
    ? Math.min(2, Math.max(0.1, playbackRate))
    : 1;
  const volumeMultiplier = Number(options.volumeMultiplier ?? 1);
  const resolvedVolumeMultiplier = Number.isFinite(volumeMultiplier)
    ? Math.min(1, Math.max(0, volumeMultiplier))
    : 1;

  player.volume = getVolume(settings) * resolvedVolumeMultiplier;

  try {
    player.shouldCorrectPitch = options.shouldCorrectPitch !== false;
  } catch (_error) {
    // Some platforms may not expose pitch correction mutably.
  }

  try {
    player.setPlaybackRate(resolvedPlaybackRate);
  } catch (_error) {
    try {
      player.playbackRate = resolvedPlaybackRate;
    } catch (_innerError) {
      // Non-critical: fall back to the source pitch/rate.
    }
  }
}

function getPlayer(soundName) {
  if (!SOUND_EFFECTS[soundName]) {
    return null;
  }

  if (!players[soundName]) {
    players[soundName] = createAudioPlayer(SOUND_EFFECTS[soundName]);
  }

  return players[soundName];
}

function getPooledPlayer(soundName, poolSize) {
  if (!SOUND_EFFECTS[soundName]) {
    return null;
  }

  const resolvedPoolSize = Math.max(1, poolSize);

  if (!pooledPlayers[soundName]) {
    pooledPlayers[soundName] = Array.from(
      { length: resolvedPoolSize },
      () => createAudioPlayer(SOUND_EFFECTS[soundName])
    );
    pooledPlayerIndexes[soundName] = 0;
  }

  const playerPool = pooledPlayers[soundName];
  const playerIndex = pooledPlayerIndexes[soundName] % playerPool.length;
  pooledPlayerIndexes[soundName] = playerIndex + 1;

  return playerPool[playerIndex];
}

async function preparePlayerForStart(player, settings, options = {}) {
  applyPlaybackOptions(player, settings, options);

  try {
    player.pause();
  } catch (_error) {
    // The player may already be stopped; seeking below is the important reset.
  }

  await player.seekTo(0);
  applyPlaybackOptions(player, settings, options);
}

function invalidatePlayerRecovery(player) {
  playerPlayTokens.set(player, (playerPlayTokens.get(player) ?? 0) + 1);
}

function schedulePlayerRecovery(player, playToken, settings, options = {}) {
  setTimeout(async () => {
    try {
      if (playerPlayTokens.get(player) !== playToken) {
        return;
      }

      const hasAlreadyProgressed = Number(player.currentTime ?? 0) > 0.005;
      const didJustFinish = player.currentStatus?.didJustFinish === true;

      if (player.playing || hasAlreadyProgressed || didJustFinish) {
        return;
      }

      await configureAudioPlaybackMode({ force: true });

      if (playerPlayTokens.get(player) !== playToken) {
        return;
      }

      applyPlaybackOptions(player, settings, options);
      player.play();
    } catch (_error) {
      // Recovery is best-effort; a future tap will reconfigure the session again.
    }
  }, SOUND_EFFECT_RECOVERY_DELAY_MS);
}

export function preloadSoundEffect(soundName) {
  try {
    getPlayer(soundName);
  } catch (_error) {
    // Non-critical: sound effects should never block gameplay.
  }
}

export function preloadPooledSoundEffect(soundName, poolSize = 6) {
  try {
    getPooledPlayer(soundName, poolSize);
  } catch (_error) {
    // Non-critical: sound effects should never block gameplay.
  }
}

export async function restoreSoundEffectsAfterInterruption() {
  try {
    await configureAudioPlaybackMode({ force: true });
    const allPlayers = [
      ...Object.values(players),
      ...Object.values(pooledPlayers).flat(),
    ];

    await Promise.all(allPlayers.map(async (player) => {
      try {
        invalidatePlayerRecovery(player);
        player.pause();
        await player.seekTo(0);
      } catch (_error) {
        // Some player instances may have been invalidated by the interruption.
      }
    }));
  } catch (_error) {
    // The next tap retries the audio session; never block the app on recovery.
  }
}

export async function playSoundEffect(soundName, settings, options = {}) {
  if (!shouldPlay(settings)) {
    return;
  }

  try {
    await configureAudioPlaybackMode();
    const player = getPlayer(soundName);

    if (!player) {
      return;
    }

    player.loop = options.loop === true;
    await preparePlayerForStart(player, settings, options);
    const playToken = (playerPlayTokens.get(player) ?? 0) + 1;
    playerPlayTokens.set(player, playToken);
    player.play();
    schedulePlayerRecovery(player, playToken, settings, options);
  } catch (_error) {
    // Keep UI actions responsive even if audio is unavailable on a device.
  }
}

export async function playPooledSoundEffect(soundName, settings, poolSize = 6, options = {}) {
  if (!shouldPlay(settings)) {
    return;
  }

  try {
    await configureAudioPlaybackMode();
    const player = getPooledPlayer(soundName, poolSize);

    if (!player) {
      return;
    }

    await preparePlayerForStart(player, settings, options);
    const playToken = (playerPlayTokens.get(player) ?? 0) + 1;
    playerPlayTokens.set(player, playToken);
    player.play();
    schedulePlayerRecovery(player, playToken, settings, options);
  } catch (_error) {
    // Keep scrolling smooth even if audio is unavailable on a device.
  }
}

export async function stopSoundEffect(soundName, { reset = true } = {}) {
  try {
    const player = getPlayer(soundName);

    if (!player) {
      return;
    }

    player.pause();
    player.loop = false;
    invalidatePlayerRecovery(player);

    if (reset) {
      await player.seekTo(0);
    }
  } catch (_error) {
    // Keep UI actions responsive even if audio is unavailable on a device.
  }
}
