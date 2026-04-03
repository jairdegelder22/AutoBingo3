import { useMemo, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useFonts, FredokaOne_400Regular } from '@expo-google-fonts/fredoka-one';
import HomeScreen from './screens/HomeScreen';
import ApparaatKeuzeScreen from './screens/ApparaatKeuzeScreen';
import SoloSetupScreen from './screens/SoloSetupScreen';
import MultiplayerKeuzeScreen from './screens/MultiplayerKeuzeScreen';
import SyncKeuzeScreen from './screens/SyncKeuzeScreen';
import HostSetupScreen from './screens/HostSetupScreen';
import JoinScreen from './screens/JoinScreen';
import PlayerSetupScreen from './screens/PlayerSetupScreen';
import LobbyScreen from './screens/LobbyScreen';
import WaitingScreen from './screens/WaitingScreen';
import SettingsScreen from './screens/SettingsScreen';
import BingoCardScreen from './screens/BingoCardScreen';
import ButtonTestScreen from './src/screens/ButtonTestScreen';
import SingleDeviceSetupTestScreen from './src/screens/SingleDeviceSetupTestScreen';
import { getPlayerThemes } from './screens/gameFlowConfig';

const SCREEN_COMPONENTS = {
  Home: HomeScreen,
  ApparaatKeuze: ApparaatKeuzeScreen,
  SoloSetup: SoloSetupScreen,
  MultiplayerKeuze: MultiplayerKeuzeScreen,
  SyncKeuze: SyncKeuzeScreen,
  HostSetup: HostSetupScreen,
  Join: JoinScreen,
  SpelerSetup: PlayerSetupScreen,
  Lobby: LobbyScreen,
  Wachten: WaitingScreen,
  Instellingen: SettingsScreen,
  ButtonTest: ButtonTestScreen,
  SingleDeviceSetupTest: SingleDeviceSetupTestScreen,
  Spel: GameScreen,
};

export default function App() {
  const [fontsLoaded] = useFonts({ FredokaOne_400Regular });
  const [stack, setStack] = useState([{ name: 'Home', params: {} }]);
  const currentRoute = stack[stack.length - 1];
  const CurrentScreen = SCREEN_COMPONENTS[currentRoute.name] ?? HomeScreen;

  const navigation = useMemo(() => ({
    canGoBack: stack.length > 1,
    navigate: (name, params = {}) => {
      setStack((current) => [...current, { name, params }]);
    },
    replace: (name, params = {}) => {
      setStack((current) => [
        ...current.slice(0, current.length - 1),
        { name, params },
      ]);
    },
    reset: (name, params = {}) => {
      setStack([{ name, params }]);
    },
    goBack: () => {
      setStack((current) => (current.length > 1 ? current.slice(0, -1) : current));
    },
  }), [stack.length]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
      <StatusBar style="dark" />
      <CurrentScreen navigation={navigation} route={currentRoute} />
    </>
  );
}

function GameScreen({ navigation, route }) {
  const config = route.params?.config ?? {};
  const replayAt = route.params?.replayAt ?? 'initial-game';
  const spelers = config.spelers?.length
    ? config.spelers
    : Array.from({ length: config.aantalSpelersOpDitApparaat ?? 1 }, (_, index) => ({
        naam: `Speler ${index + 1}`,
        skin: index === 0 ? 'rood' : 'blauw',
        playerId: `placeholder-${index + 1}`,
      }));

  return (
    <BingoCardScreen
      key={replayAt}
      thema={config.thema}
      wincondition={config.wincondition}
      diagonaal={config.diagonaal}
      aantalSpelersOpDitApparaat={config.aantalSpelersOpDitApparaat ?? spelers.length}
      kaartOpzet={config.kaartOpzet}
      modus={config.modus}
      syncType={config.syncType}
      spelers={spelers}
      playerThemes={
        config.kaartOpzet === 'ander-thema'
          ? getPlayerThemes(config.thema, config.aantalSpelersOpDitApparaat ?? spelers.length)
          : undefined
      }
      onBack={navigation.goBack}
      onMenu={() => navigation.reset('Home')}
      onReplay={() => navigation.replace('Spel', { config, replayAt: Date.now() })}
    />
  );
}
