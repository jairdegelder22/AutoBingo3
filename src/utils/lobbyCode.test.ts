import {
  decodeLobbyCode,
  formatLobbyCodeForDisplay,
  generateLobbyCode,
  type GameModeId,
  type GameParams,
  type ThemeId,
} from './lobbyCode';

const THEMES: ThemeId[] = ['snelweg', 'stad', 'natuur', 'vakantie'];
const GAME_MODES: GameModeId[] = ['wegenkaart', 'klassiek', 'claim', 'collectief'];

function assert(condition: unknown, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

export function runLobbyCodeTests(): void {
  let checked = 0;

  for (const thema of THEMES) {
    for (const gameMode of GAME_MODES) {
      const params: GameParams = {
        thema,
        gameMode,
        syncType: gameMode === 'wegenkaart' ? 'offline' : 'live',
        seed: checked * 97 + 1234,
        salt: checked,
      };

      const code = generateLobbyCode(params);
      const decoded = decodeLobbyCode(code);

      assert(code.length === 7, `Expected raw code length 7, got ${code}`);
      assert(decoded !== null, `Expected decode to succeed for ${code}`);
      const expectedTheme = params.thema === 'natuur' ? 'platteland' : params.thema;
      assert(decoded?.thema === expectedTheme, `Theme mismatch for ${code}`);
      assert(decoded?.gameMode === params.gameMode, `Game mode mismatch for ${code}`);
      assert(decoded?.syncType === params.syncType, `Sync type mismatch for ${code}`);
      assert(decoded?.seed === params.seed, `Seed mismatch for ${code}`);
      assert(decoded?.salt === params.salt, `Salt mismatch for ${code}`);

      const displayCode = formatLobbyCodeForDisplay(code);
      assert(displayCode.length === 9, `Expected formatted display length 9, got ${displayCode}`);
      assert(decodeLobbyCode(displayCode)?.gameMode === params.gameMode, `Display decode mismatch for ${displayCode}`);

      checked += 1;
    }
  }

  const repeatedA = generateLobbyCode({
    thema: 'snelweg',
    gameMode: 'klassiek',
    syncType: 'live',
    seed: 4242,
    salt: 3,
  });
  const repeatedB = generateLobbyCode({
    thema: 'snelweg',
    gameMode: 'klassiek',
    syncType: 'live',
    seed: 4242,
    salt: 4,
  });

  assert(repeatedA !== repeatedB, 'Expected salt to change the generated code');
  assert(decodeLobbyCode('BAD·CODE') === null, 'Expected corrupt code to decode as null');

  console.log(`Lobby code tests passed (${checked} round-trips).`);
}

if (typeof require !== 'undefined' && typeof module !== 'undefined' && require.main === module) {
  runLobbyCodeTests();
}
