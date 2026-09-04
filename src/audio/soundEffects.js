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
  playHornHonk: require('../../assets/audio/play-horn-honk.mp3'),
  skinAmbulance: require('../../assets/audio/skin-horns/skin-ambulance.mp3'),
  skinBeach: require('../../assets/audio/skin-horns/skin-beach.mp3'),
  skinCow: require('../../assets/audio/skin-horns/skin-cow.mp3'),
  skinDog: require('../../assets/audio/skin-horns/skin-dog.mp3'),
  skinHorn2: require('../../assets/audio/skin-horns/skin-horn-2.mp3'),
  skinHorn3: require('../../assets/audio/skin-horns/skin-horn-3.mp3'),
  skinHotRod: require('../../assets/audio/skin-horns/skin-hot-rod.mp3'),
  skinIceCream: require('../../assets/audio/skin-horns/skin-ice-cream.mp3'),
  skinCat: require('../../assets/audio/skin-horns/skin-cat.mp3'),
  skinKerst: require('../../assets/audio/skin-horns/skin-kerst.mp3'),
  skinLove: require('../../assets/audio/skin-horns/skin-love.mp3'),
  skinMaanrijder: require('../../assets/audio/skin-horns/skin-maanrijder.mp3'),
  skinMedal: require('../../assets/audio/skin-horns/skin-medal.mp3'),
  skinMonstertruck: require('../../assets/audio/skin-horns/skin-monstertruck.mp3'),
  skinNeonCar: require('../../assets/audio/skin-horns/skin-neon-car.mp3'),
  skinOldSupercar: require('../../assets/audio/skin-horns/skin-old-supercar.mp3'),
  skinPirate: require('../../assets/audio/skin-horns/skin-pirate.mp3'),
  skinPolice: require('../../assets/audio/skin-horns/skin-police.mp3'),
  skinRainbow: require('../../assets/audio/skin-horns/skin-rainbow.mp3'),
  skinRidder: require('../../assets/audio/skin-horns/skin-ridder.mp3'),
  skinSafari: require('../../assets/audio/skin-horns/skin-safari.mp3'),
  skinSneeuwschuiver: require('../../assets/audio/skin-horns/skin-sneeuwschuiver.mp3'),
  skinSupercar2: require('../../assets/audio/skin-horns/skin-supercar-2.mp3'),
  skinSupercar: require('../../assets/audio/skin-horns/skin-supercar.mp3'),
  skinTaxi: require('../../assets/audio/skin-horns/skin-taxi.mp3'),
  skinTrain: require('../../assets/audio/skin-horns/skin-train.mp3'),
  skinFlames: require('../../assets/audio/skin-horns/skin-flames.mp3'),
  scrollGeluid: require('../../assets/audio/scroll-geluid.mp3'),
  settingsGearClick: require('../../assets/audio/settings-gear-click.mp3'),
  navTabSwitchClick: require('../../assets/audio/nav-tab-switch-click.mp3'),
  skinUnlockBell: require('../../assets/audio/skin-unlock-bell.mp3'),
};

const players = {};
const pooledPlayers = {};
const pooledPlayerIndexes = {};
const SOUND_EFFECT_RECOVERY_DELAY_MS = 24;
const POOLED_PLAYER_RESERVATION_MS = 80;
const playerPlayTokens = new WeakMap();
const playerRecoveryTimeouts = new WeakMap();
const reservedPooledPlayers = new WeakSet();

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
    try {
      players[soundName].loop = false;
      players[soundName].pause();
      void players[soundName].seekTo(0);
    } catch (_error) {
      // Preloading should never make a sound or block the UI.
    }
  }

  return players[soundName];
}

function getPooledPlayer(soundName, poolSize) {
  if (!SOUND_EFFECTS[soundName]) {
    return null;
  }

  const resolvedPoolSize = Math.max(1, poolSize);

  if (!pooledPlayers[soundName]) {
    pooledPlayers[soundName] = [];
    pooledPlayerIndexes[soundName] = 0;
  }

  const playerPool = pooledPlayers[soundName];
  const availablePlayer = playerPool.find((player) => !player.playing && !reservedPooledPlayers.has(player));

  if (availablePlayer) {
    reservedPooledPlayers.add(availablePlayer);
    return availablePlayer;
  }

  if (playerPool.length < resolvedPoolSize) {
    const player = createAudioPlayer(SOUND_EFFECTS[soundName]);
    playerPool.push(player);
    reservedPooledPlayers.add(player);
    return player;
  }

  const playerIndex = pooledPlayerIndexes[soundName] % playerPool.length;
  pooledPlayerIndexes[soundName] = playerIndex + 1;

  reservedPooledPlayers.add(playerPool[playerIndex]);
  return playerPool[playerIndex];
}

function ensurePooledPlayers(soundName, poolSize) {
  if (!SOUND_EFFECTS[soundName]) {
    return;
  }

  const resolvedPoolSize = Math.max(1, poolSize);

  if (!pooledPlayers[soundName]) {
    pooledPlayers[soundName] = [];
    pooledPlayerIndexes[soundName] = 0;
  }

  while (pooledPlayers[soundName].length < resolvedPoolSize) {
    const player = createAudioPlayer(SOUND_EFFECTS[soundName]);
    try {
      player.loop = false;
      player.pause();
      void player.seekTo(0);
    } catch (_error) {
      // Preloading should never make a sound or block the UI.
    }
    pooledPlayers[soundName].push(player);
  }
}

function getPlayersForSound(soundName) {
  return [
    players[soundName],
    ...(pooledPlayers[soundName] ?? []),
  ].filter(Boolean);
}

function clearPlayerRecovery(player) {
  const timeoutIds = playerRecoveryTimeouts.get(player);

  if (!timeoutIds) {
    return;
  }

  timeoutIds.forEach((timeoutId) => clearTimeout(timeoutId));
  playerRecoveryTimeouts.delete(player);
}

function stopPlayer(player, { reset = true } = {}) {
  clearPlayerRecovery(player);
  invalidatePlayerRecovery(player);

  try {
    player.pause();
    player.loop = false;
  } catch (_error) {
    // The player can be mid-dispose or unavailable on a platform.
  }

  if (reset) {
    try {
      const seekResult = player.seekTo(0);
      if (seekResult?.catch) {
        void seekResult.catch(() => {});
      }
    } catch (_error) {
      // Reset is best-effort for a sound that is already being stopped.
    }
  }
}

function stopExclusiveSoundEffects(soundNames = [], exceptPlayer = null) {
  soundNames.forEach((soundName) => {
    getPlayersForSound(soundName).forEach((player) => {
      if (player && player !== exceptPlayer) {
        stopPlayer(player);
      }
    });
  });
}

async function preparePlayerForStart(player, settings, options = {}) {
  clearPlayerRecovery(player);
  invalidatePlayerRecovery(player);
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
  const timeoutId = setTimeout(async () => {
    try {
      const timeoutIds = playerRecoveryTimeouts.get(player);
      timeoutIds?.delete(timeoutId);

      if (timeoutIds?.size === 0) {
        playerRecoveryTimeouts.delete(player);
      }

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

  const timeoutIds = playerRecoveryTimeouts.get(player) ?? new Set();
  timeoutIds.add(timeoutId);
  playerRecoveryTimeouts.set(player, timeoutIds);
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
    ensurePooledPlayers(soundName, poolSize);
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
        clearPlayerRecovery(player);
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
    await configureAudioPlaybackMode({ force: options.forceAudioMode === true });
    const player = getPlayer(soundName);

    if (!player) {
      return;
    }

    stopExclusiveSoundEffects(options.exclusiveSoundNames, player);

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

  let player = null;

  try {
    await configureAudioPlaybackMode();
    player = getPooledPlayer(soundName, poolSize);

    if (!player) {
      return;
    }

    clearPlayerRecovery(player);
    invalidatePlayerRecovery(player);
    await preparePlayerForStart(player, settings, options);
    const playToken = (playerPlayTokens.get(player) ?? 0) + 1;
    playerPlayTokens.set(player, playToken);
    player.play();
    setTimeout(() => {
      reservedPooledPlayers.delete(player);
    }, POOLED_PLAYER_RESERVATION_MS);
    schedulePlayerRecovery(player, playToken, settings, options);
  } catch (_error) {
    if (player) {
      reservedPooledPlayers.delete(player);
    }
    // Keep scrolling smooth even if audio is unavailable on a device.
  }
}

export async function stopSoundEffect(soundName, { reset = true } = {}) {
  try {
    const player = getPlayer(soundName);

    if (!player) {
      return;
    }

    stopPlayer(player, { reset });
  } catch (_error) {
    // Keep UI actions responsive even if audio is unavailable on a device.
  }
}
