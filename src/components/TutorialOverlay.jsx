import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageBackground, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';
import GlossyButton from './GlossyButton';
import { getResponsiveMetrics } from '../utils/responsive';

const HAND_IMAGE = require('../../assets/images/tutorial/tutorial-hand.png');
const SPEECH_BUBBLE_IMAGE = require('../../assets/images/tutorial/tutorial-speech-bubble.png');
const TUTORIAL_CAR_IMAGE = require('../../assets/images/players/player-rood.png');
export const TUTORIAL_HAND_IMAGE = HAND_IMAGE;
const NOOP = () => {};
const AnimatedImageBackground = Animated.createAnimatedComponent(ImageBackground);

const TUTORIAL_BUBBLE_TEXT_BOX = {
  default: {
    left: 22,
    top: 26,
    width: 56,
    height: 38,
    fontSize: 19,
    lineHeight: 24,
  },
  byPlacement: {
    center: {},
    top: {},
    bottom: {},
  },
  byStepId: {
    'menu-skinshop-challenges': { left: 18, top: 24, width: 62, height: 43, fontSize: 20, lineHeight: 25 },
    'menu-final': { fontSize: 18, lineHeight: 23 },
  },
};

export const GENERAL_TUTORIAL_STEPS = [
  {
    id: 'home-welcome',
    routeName: 'Home',
    text: 'Hey daar! Welkom bij AutoBingo.',
    focus: null,
    hand: null,
    bubble: 'center',
    stagedIntro: true,
    controlsAppearAt: 0.84,
    hideCloseButton: true,
    actionLabel: 'Volgende',
    nextButtonOffsetY: 26,
  },
  {
    id: 'home-play',
    routeName: 'Home',
    target: 'home.play',
    advanceOnRoute: 'SingleDeviceSetupTest',
    text: 'Met deze optie speel je op 1 apparaat, met 1 of 2 spelers.',
    focus: { x: 0.05, y: 0.66, width: 0.43, height: 0.12, radius: 28 },
    targetPadding: 6,
    hand: 'tap',
    bubble: 'top',
    actionLabel: 'Tik op Speel',
    requiresAction: true,
  },
  {
    id: 'setup-theme',
    routeName: 'SingleDeviceSetupTest',
    target: 'setup.theme',
    unlockNextOnAction: 'setup.themeChanged',
    text: 'Kies eerst een thema. Dit bepaalt welke dingen op je bingokaart komen.',
    focus: { x: 0.12, y: 0.12, width: 0.76, height: 0.27, radius: 28 },
    hand: 'swipe',
    bubble: 'bottom',
    coachOffsetY: -112,
    actionLabel: 'Swipe door thema’s',
    continueLabel: 'Volgende',
    nextButtonOffsetY: 34,
    requiresAction: true,
  },
  {
    id: 'setup-player-skin',
    routeName: 'SingleDeviceSetupTest',
    target: 'setup.playerCar',
    focusShape: 'circle',
    advanceOnAction: 'setup.skinPickerOpened',
    text: 'Dit is je auto. Tik erop om een andere skin te kiezen.',
    focus: { x: 0.22, y: 0.41, width: 0.56, height: 0.22, radius: 34 },
    targetOffsetY: 0,
    hand: 'tap',
    bubble: 'top',
    actionLabel: 'Tik op je auto',
    requiresAction: true,
  },
  {
    id: 'setup-skin-picker',
    routeName: 'SingleDeviceSetupTest',
    target: 'setup.skinSelect',
    localCoachOnly: true,
    advanceOnAction: 'setup.skinSelected',
    text: 'Swipe door de auto’s en kies een skin met Selecteer.',
    focus: { x: 0.25, y: 0.75, width: 0.5, height: 0.1, radius: 24 },
    hand: 'tap',
    handOffsetY: 34,
    bubble: 'top',
    actionLabel: 'Kies Selecteer',
    requiresAction: true,
    coachPlacement: 'top',
  },
  {
    id: 'setup-player',
    routeName: 'SingleDeviceSetupTest',
    target: 'setup.playerName',
    text: 'Hier kun je je naam aanpassen. Handig als je met meerdere spelers speelt.',
    focus: { x: 0.23, y: 0.58, width: 0.54, height: 0.08, radius: 18 },
    targetPadding: 16,
    hand: 'tap',
    handOffsetY: 2,
    unlockNextOnAction: 'setup.playerNameFocused',
    advanceOnAction: 'setup.playerNameDone',
    hideHandWhenUnlocked: true,
    coachPlacement: 'top',
    coachOffsetY: -32,
    bubble: 'top',
    actionLabel: 'Volgende',
    nextButtonBottom: 24,
  },
  {
    id: 'setup-add-player',
    routeName: 'SingleDeviceSetupTest',
    target: 'setup.addPlayer',
    focusShape: 'circle',
    handOffsetY: 26,
    coachOffsetY: -64,
    advanceOnAction: 'setup.playerAdded',
    advanceToStepOnAction: {
      'setup.skipAddPlayer': 'setup-rules',
    },
    text: 'Speel je samen? Voeg dan een tweede speler toe.',
    focus: { x: 0.57, y: 0.45, width: 0.26, height: 0.17, radius: 28 },
    hand: 'tap',
    bubble: 'top',
    actionLabel: 'Voeg speler toe',
    alternateActionLabel: 'Ik speel alleen',
    alternateActionName: 'setup.skipAddPlayer',
    alternateActionVariant: 'red',
    requiresAction: true,
  },
  {
    id: 'setup-second-player-skin',
    routeName: 'SingleDeviceSetupTest',
    target: 'setup.secondPlayerCar',
    focusShape: 'circle',
    advanceOnAction: 'setup.skinPickerOpened',
    text: 'Speler 2 kan ook een eigen auto kiezen.',
    focus: { x: 0.22, y: 0.41, width: 0.56, height: 0.22, radius: 34 },
    targetOffsetY: 0,
    hand: 'tap',
    handOffsetX: 0,
    handOffsetY: 0,
    coachOffsetY: -78,
    bubble: 'top',
    actionLabel: 'Tik op auto 2',
    requiresAction: true,
  },
  {
    id: 'setup-second-skin-picker',
    routeName: 'SingleDeviceSetupTest',
    target: 'setup.skinSelect',
    localCoachOnly: true,
    advanceOnAction: 'setup.skinSelected',
    text: 'Kies ook voor speler 2 een skin met Selecteer.',
    focus: { x: 0.25, y: 0.75, width: 0.5, height: 0.1, radius: 24 },
    hand: 'tap',
    handOffsetY: 34,
    bubble: 'top',
    actionLabel: 'Kies Selecteer',
    requiresAction: true,
    coachPlacement: 'top',
  },
  {
    id: 'setup-second-player-name',
    routeName: 'SingleDeviceSetupTest',
    target: 'setup.secondPlayerName',
    text: 'Ook speler 2 kan een eigen naam invullen.',
    focus: { x: 0.23, y: 0.58, width: 0.54, height: 0.08, radius: 18 },
    targetPadding: 16,
    hand: 'tap',
    handOffsetY: 2,
    unlockNextOnAction: 'setup.secondPlayerNameFocused',
    advanceOnAction: 'setup.secondPlayerNameDone',
    hideHandWhenUnlocked: true,
    coachPlacement: 'top',
    coachOffsetY: -32,
    bubble: 'top',
    actionLabel: 'Volgende',
    nextButtonBottom: 24,
  },
  {
    id: 'setup-rules',
    routeName: 'SingleDeviceSetupTest',
    target: 'setup.rules',
    handOffsetX: 72,
    handOffsetY: 2,
    coachPlacement: 'top',
    advanceOnAction: 'setup.rulesOpened',
    text: 'Pas hier de spelregels van je bingo aan.',
    focus: { x: 0.12, y: 0.86, width: 0.76, height: 0.1, radius: 28 },
    hand: 'tap',
    bubble: 'top',
    actionLabel: 'Open spelregels',
    requiresAction: true,
  },
  {
    id: 'setup-rules-detail',
    routeName: 'SingleDeviceSetupTest',
    target: 'setup.rulesDiagonal',
    advanceOnAction: 'setup.diagonalChanged',
    text: 'Tik op Niet om diagonaal bingo uit te zetten.',
    focus: { x: 0.12, y: 0.42, width: 0.76, height: 0.2, radius: 24 },
    hand: 'tap',
    handOffsetX: 64,
    handOffsetY: 4,
    bubble: 'top',
    actionLabel: 'Tik een regel aan',
    requiresAction: true,
  },
  {
    id: 'setup-rules-close',
    routeName: 'SingleDeviceSetupTest',
    target: 'setup.rules',
    handOffsetX: 78,
    handOffsetY: 8,
    coachPlacement: 'top',
    coachOffsetY: 330,
    advanceOnAction: 'setup.rulesClosed',
    text: 'Tik bovenaan op Spelregels om dit menu weer te sluiten.',
    focus: { x: 0.12, y: 0.12, width: 0.76, height: 0.1, radius: 28 },
    hand: 'tap',
    bubble: 'top',
    actionLabel: 'Sluit Spelregels',
    requiresAction: true,
  },
  {
    id: 'setup-start',
    routeName: 'SingleDeviceSetupTest',
    target: 'setup.start',
    advanceOnRoute: 'Spel',
    text: 'Alles klaar? Start dan de bingo.',
    focus: { x: 0.23, y: 0.72, width: 0.54, height: 0.11, radius: 28 },
    hand: 'tap',
    handOffsetX: 44,
    coachOffsetY: -62,
    bubble: 'top',
    actionLabel: 'Tik op Speel',
    requiresAction: true,
  },
  {
    id: 'game-board',
    routeName: 'Spel',
    target: 'game.boardArea',
    text: 'Tijdens de autorit houd je je ogen open voor dingen op het bord.',
    focus: { x: 0.04, y: 0.28, width: 0.92, height: 0.45, radius: 30 },
    hand: null,
    bubble: 'bottom',
    actionLabel: 'Volgende',
    blockFocusTouches: true,
  },
  {
    id: 'game-tap-cell',
    routeName: 'Spel',
    target: 'game.cell.0',
    advanceOnAction: 'game.cellTapped',
    text: 'Zie je iets onderweg? Tik dan het vakje aan.',
    focus: { x: 0.14, y: 0.33, width: 0.19, height: 0.1, radius: 18 },
    hand: 'tap',
    bubble: 'bottom',
    actionLabel: 'Tik een vakje aan',
    requiresAction: true,
  },
  {
    id: 'game-hold-cell',
    routeName: 'Spel',
    target: 'game.cell.0',
    advanceOnAction: 'game.cellHeld',
    text: 'Per ongeluk getikt? Houd het vakje ingedrukt om het terug te zetten.',
    focus: { x: 0.14, y: 0.33, width: 0.19, height: 0.1, radius: 18 },
    hand: 'hold',
    bubble: 'bottom',
    actionLabel: 'Houd ingedrukt',
    requiresAction: true,
  },
  {
    id: 'game-finish',
    routeName: 'Spel',
    target: 'game.boardArea',
    advanceOnAction: 'game.bingoShown',
    text: 'Maak een rij vol. Dan heb je bingo!',
    focus: { x: 0.07, y: 0.34, width: 0.86, height: 0.09, radius: 20 },
    hand: null,
    bubble: 'bottom',
    actionLabel: 'Maak bingo',
    requiresAction: true,
  },
  {
    id: 'game-winner-actions',
    routeName: 'Spel',
    text: 'Goed gedaan, bingo! Kies Speel, Instellingen of Hoofdmenu.',
    focus: { x: 0.14, y: 0.53, width: 0.72, height: 0.36, radius: 28 },
    finishOnAction: 'game.winnerMenuSelected',
    hand: null,
    bubble: 'top',
    actionLabel: 'Klaar',
    hideNextButton: true,
    coachOffsetY: -104,
  },
];

export const MENU_TUTORIAL_STEPS = [
  {
    id: 'menu-welcome',
    routeName: 'Home',
    text: 'Hey daar! Welkom bij AutoBingo.',
    focus: null,
    hand: null,
    bubble: 'center',
    stagedIntro: true,
    controlsAppearAt: 0.84,
    hideCloseButton: true,
    actionLabel: 'Volgende',
    nextButtonOffsetY: 26,
  },
  {
    id: 'menu-main-options',
    routeName: 'Home',
    text: 'Hier kan je kiezen tussen spelen op 1 apparaat en online spelen.',
    focus: { x: 0.05, y: 0.62, width: 0.9, height: 0.18, radius: 30 },
    hand: null,
    bubble: 'top',
    coachOffsetY: -78,
    actionLabel: 'Volgende',
    blockFocusTouches: true,
  },
  {
    id: 'menu-open-skinshop',
    routeName: 'Home',
    target: 'home.skinshopTab',
    advanceOnAction: 'home.skinshopOpened',
    text: 'Onderin kun je naar de Skinshop. Tik of swipe naar links.',
    focus: { x: 0, y: 0.84, width: 0.34, height: 0.16, radius: 28 },
    targetPadding: 8,
    hand: 'tap',
    bubble: 'top',
    coachOffsetY: -84,
    actionLabel: 'Open Skinshop',
    requiresAction: true,
  },
  {
    id: 'menu-skinshop-basics',
    routeName: 'Home',
    text: 'Hier zie je je autoskins. Basiskleuren kun je direct gebruiken.',
    focus: { x: 0.05, y: 0.09, width: 0.9, height: 0.69, radius: 30 },
    hand: null,
    bubble: 'bottom',
    coachOffsetY: -76,
    actionLabel: 'Volgende',
    blockFocusTouches: true,
  },
  {
    id: 'menu-skinshop-scroll',
    routeName: 'Home',
    target: 'home.skinshopScroll',
    advanceOnAction: 'home.skinshopScrolled',
    text: 'Je kan ook omlaag scrollen om meer skins te bekijken.',
    focus: { x: 0.05, y: 0.12, width: 0.9, height: 0.66, radius: 30 },
    hand: 'scrollDown',
    bubble: 'bottom',
    coachOffsetY: -76,
    actionLabel: 'Scroll omlaag',
    continueLabel: 'Volgende',
    requiresAction: true,
  },
  {
    id: 'menu-skinshop-challenges',
    routeName: 'Home',
    text: 'Sommige skins speel je vrij met challenges door AutoBingo vaker te spelen.',
    focus: { x: 0.05, y: 0.18, width: 0.9, height: 0.56, radius: 30 },
    hand: null,
    bubble: 'bottom',
    coachOffsetY: -76,
    actionLabel: 'Volgende',
    blockFocusTouches: true,
  },
  {
    id: 'menu-challenge-skin',
    routeName: 'Home',
    target: 'home.challengeSkin',
    advanceOnAction: 'home.challengeSkinOpened',
    text: 'Tik eens op een skin met een slotje.',
    focus: { x: 0.05, y: 0.24, width: 0.9, height: 0.24, radius: 28 },
    targetPadding: 8,
    hand: 'tap',
    bubble: 'bottom',
    coachOffsetY: -76,
    actionLabel: 'Tik op slotje',
    requiresAction: true,
  },
  {
    id: 'menu-challenge-detail',
    routeName: 'Home',
    text: 'Hier zie je welke challenge je moet halen om deze skin vrij te spelen.',
    focus: { x: 0.04, y: 0.54, width: 0.92, height: 0.24, radius: 30 },
    hand: null,
    bubble: 'top',
    coachOffsetY: -92,
    actionLabel: 'Volgende',
    blockFocusTouches: true,
  },
  {
    id: 'menu-premium-note',
    routeName: 'Home',
    target: 'home.premium',
    text: "Door Premium aan te schaffen krijg je toegang tot extra thema's en kun je zelf online lobby's hosten.",
    focus: { x: 0.03, y: 0.03, width: 0.16, height: 0.09, radius: 28 },
    targetPadding: 4,
    targetOffsetX: 8,
    hand: null,
    bubble: 'center',
    hideCloseButton: true,
    actionLabel: 'Volgende',
    blockFocusTouches: true,
  },
  {
    id: 'menu-open-theme-cards',
    routeName: 'Home',
    target: 'home.themeCardsTab',
    advanceOnAction: 'home.themeCardsOpened',
    text: 'Helemaal rechts vind je de thema’s. Tik of swipe daarheen.',
    focus: { x: 0.66, y: 0.84, width: 0.34, height: 0.16, radius: 28 },
    targetPadding: 8,
    hand: 'tap',
    bubble: 'top',
    coachOffsetY: -84,
    actionLabel: 'Open thema’s',
    requiresAction: true,
  },
  {
    id: 'menu-theme-cards',
    routeName: 'Home',
    text: 'Hier kun je alle thema’s bekijken en zien welke items bij elk thema horen.',
    focus: { x: 0.05, y: 0.12, width: 0.9, height: 0.68, radius: 30 },
    hand: null,
    bubble: 'bottom',
    coachOffsetY: -76,
    actionLabel: 'Volgende',
    blockFocusTouches: true,
  },
  {
    id: 'menu-settings-note',
    routeName: 'Home',
    text: 'Via het tandwiel kun je instellingen aanpassen, zoals geluid, trilling en deze uitleg.',
    focus: { x: 0.85, y: 0.02, width: 0.09, height: 0.058, radius: 22 },
    hand: null,
    bubble: 'center',
    actionLabel: 'Volgende',
    blockFocusTouches: true,
  },
  {
    id: 'menu-final',
    routeName: 'Home',
    text: 'Dit was de uitleg over het hoofdmenu van AutoBingo. Wil je stoppen, of wil je ook zien hoe je AutoBingo speelt?',
    focus: null,
    hand: null,
    bubble: 'center',
    coachOffsetY: 1,
    forceVisibleAfterMs: 520,
    stackedAlternateAction: true,
    actionLabel: 'Uitleg stoppen',
    alternateActionLabel: 'Hoe speel je\nAutoBingo?',
    alternateActionName: 'tutorial.startGeneral',
    alternateActionVariant: 'yellow',
    blockFocusTouches: true,
  },
];

export const JOIN_TUTORIAL_STEPS = [
  {
    id: 'join-welcome',
    routeName: 'Home',
    text: 'Je kunt AutoBingo ook online met anderen spelen.',
    focus: null,
    hand: null,
    bubble: 'center',
    stagedIntro: true,
    controlsAppearAt: 0.84,
    actionLabel: 'Volgende',
    nextButtonOffsetY: 26,
  },
  {
    id: 'join-host-or-join-note',
    routeName: 'Home',
    text: 'Online spelen kan door zelf te hosten of door te joinen. Joinen is altijd gratis.',
    focus: null,
    hand: null,
    bubble: 'center',
    actionLabel: 'Volgende',
    nextButtonOffsetY: 26,
  },
  {
    id: 'join-free-note',
    routeName: 'Home',
    text: 'Normaal vraag je de lobbycode aan de host.',
    focus: null,
    hand: null,
    bubble: 'center',
    actionLabel: 'Volgende',
    nextButtonOffsetY: 26,
  },
  {
    id: 'join-online-button',
    routeName: 'Home',
    target: 'home.online',
    advanceOnAction: 'home.onlineOpened',
    text: 'Tik eerst op Online.',
    focus: { x: 0.52, y: 0.66, width: 0.43, height: 0.12, radius: 28 },
    targetPadding: 8,
    hand: 'tap',
    bubble: 'top',
    coachOffsetY: -88,
    actionLabel: 'Tik op Online',
    requiresAction: true,
  },
  {
    id: 'join-join-button',
    routeName: 'Home',
    target: 'home.onlineJoin',
    advanceOnAction: 'home.joinPlateOpened',
    text: 'Tik daarna op Join om een lobbycode in te voeren.',
    focus: { x: 0.54, y: 0.67, width: 0.36, height: 0.07, radius: 18 },
    targetPadding: 10,
    hand: 'tap',
    bubble: 'top',
    actionLabel: 'Tik op Join',
    requiresAction: true,
  },
  {
    id: 'join-code-plate',
    routeName: 'Home',
    target: 'home.joinPlate',
    advanceOnAction: 'home.tutorialJoinSubmitted',
    text: 'Voor deze uitleg gebruiken we oefencode UITLEG12.',
    focus: { x: 0.04, y: 0.42, width: 0.92, height: 0.18, radius: 28 },
    targetPadding: 10,
    hand: 'tap',
    handOffsetY: 20,
    bubble: 'top',
    coachOffsetY: -72,
    actionLabel: 'Typ UITLEG12',
    requiresAction: true,
  },
  {
    id: 'join-lobby-code',
    routeName: 'Lobby',
    target: 'lobby.codePlate',
    text: 'Hier zie je de lobbycode. Zo weet je zeker dat je in de goede lobby zit.',
    focus: { x: 0.1, y: 0.13, width: 0.8, height: 0.14, radius: 28 },
    targetPadding: 10,
    keepFocusVisible: true,
    hand: null,
    bubble: 'bottom',
    coachOffsetY: -76,
    actionLabel: 'Volgende',
    nextButtonBottom: 16,
  },
  {
    id: 'join-lobby-overview',
    routeName: 'Lobby',
    target: 'lobby.playerSetup',
    text: 'In de lobby kun je je naam en autokleur aanpassen. De host start het spel zodra iedereen klaar is.',
    focus: { x: 0.08, y: 0.32, width: 0.84, height: 0.42, radius: 30 },
    targetPadding: 12,
    hand: null,
    bubble: 'bottom',
    coachOffsetY: -76,
    actionLabel: 'Volgende',
    nextButtonBottom: 16,
  },
  {
    id: 'join-lobby-player-table',
    routeName: 'Lobby',
    target: 'lobby.playerTable',
    text: 'In deze spelerstabel zie je wie er allemaal in de lobby zitten.',
    focus: { x: 0.08, y: 0.62, width: 0.84, height: 0.24, radius: 28 },
    targetPadding: 10,
    keepFocusVisible: true,
    hand: null,
    bubble: 'top',
    coachOffsetY: -48,
    actionLabel: 'Volgende',
    nextButtonBottom: 16,
  },
  {
    id: 'join-finish',
    routeName: 'Lobby',
    text: 'Dit was de uitleg voor het joinen van een lobby. Klik op Klaar om terug te gaan.',
    focus: null,
    hand: null,
    bubble: 'bottom',
    coachOffsetY: -76,
    actionLabel: 'Klaar',
    nextButtonBottom: 16,
  },
];

export const HOST_TUTORIAL_STEPS = [
  {
    id: 'host-welcome',
    routeName: 'Home',
    text: 'Met online hosten maak je zelf een AutoBingo lobby.',
    focus: null,
    hand: null,
    bubble: 'center',
    stagedIntro: true,
    controlsAppearAt: 0.84,
    actionLabel: 'Volgende',
    nextButtonOffsetY: 26,
  },
  {
    id: 'host-premium-note',
    routeName: 'Home',
    text: 'Alleen de host heeft Premium nodig. Vrienden en familie kunnen gratis joinen.',
    focus: null,
    hand: null,
    bubble: 'center',
    actionLabel: 'Volgende',
    nextButtonOffsetY: 26,
  },
  {
    id: 'host-online-button',
    routeName: 'Home',
    target: 'home.online',
    advanceOnAction: 'home.onlineOpened',
    text: 'Tik eerst op Online.',
    focus: { x: 0.52, y: 0.66, width: 0.43, height: 0.12, radius: 28 },
    targetPadding: 8,
    hand: 'tap',
    bubble: 'center',
    actionLabel: 'Tik op Online',
    requiresAction: true,
  },
  {
    id: 'host-host-button',
    routeName: 'Home',
    target: 'home.onlineHost',
    advanceOnAction: 'home.hostPressed',
    text: 'Tik daarna op Host om een eigen lobby aan te maken.',
    focus: { x: 0.11, y: 0.67, width: 0.36, height: 0.07, radius: 18 },
    targetPadding: 10,
    hand: 'tap',
    bubble: 'center',
    actionLabel: 'Tik op Host',
    requiresAction: true,
  },
  {
    id: 'host-theme',
    routeName: 'HostSetup',
    target: 'host.theme',
    unlockNextOnAction: 'host.themeChanged',
    text: 'Kies eerst een thema voor je online lobby.',
    focus: { x: 0.12, y: 0.12, width: 0.76, height: 0.27, radius: 28 },
    hand: 'swipe',
    bubble: 'bottom',
    coachOffsetY: -112,
    actionLabel: 'Swipe door thema’s',
    continueLabel: 'Volgende',
    nextButtonOffsetY: 34,
    requiresAction: true,
  },
  {
    id: 'host-spelmodus-open',
    routeName: 'HostSetup',
    target: 'host.spelmodus',
    advanceOnAction: 'host.spelmodusOpened',
    text: 'Tik op Spelmodus om te kiezen hoe jullie samen spelen.',
    focus: { x: 0.2, y: 0.48, width: 0.6, height: 0.16, radius: 28 },
    targetPadding: 8,
    hand: 'tap',
    bubble: 'top',
    coachOffsetY: -62,
    actionLabel: 'Open Spelmodus',
    requiresAction: true,
  },
  {
    id: 'host-spelmodus-collectief',
    routeName: 'HostSetup',
    target: 'host.spelmodus.collectief',
    advanceOnAction: 'host.spelmodusSelected',
    text: 'Kies voor deze uitleg Collectief.',
    focus: { x: 0.52, y: 0.56, width: 0.4, height: 0.16, radius: 26 },
    targetPadding: 8,
    targetOffsetY: -18,
    hand: 'tap',
    bubble: 'top',
    coachOffsetY: -92,
    actionLabel: 'Kies Collectief',
    requiresAction: true,
  },
  {
    id: 'host-rules-open',
    routeName: 'HostSetup',
    target: 'host.rules',
    advanceOnAction: 'host.rulesOpened',
    text: 'Open Spelregels om de regels van je lobby aan te passen.',
    focus: { x: 0.12, y: 0.86, width: 0.76, height: 0.1, radius: 28 },
    targetPadding: 8,
    introDelayMs: 360,
    hand: 'tap',
    handOffsetX: 72,
    handOffsetY: 2,
    bubble: 'top',
    coachOffsetY: -70,
    actionLabel: 'Open Spelregels',
    requiresAction: true,
  },
  {
    id: 'host-rules-diagonal',
    routeName: 'HostSetup',
    target: 'host.rulesDiagonal',
    advanceOnAction: 'host.diagonalChanged',
    text: 'Tik op Niet om diagonaal bingo uit te zetten.',
    focus: { x: 0.12, y: 0.54, width: 0.76, height: 0.22, radius: 24 },
    targetPadding: 12,
    hand: 'tap',
    handOffsetX: 44,
    handOffsetY: 18,
    bubble: 'top',
    coachOffsetY: -92,
    actionLabel: 'Tik op Niet',
    requiresAction: true,
  },
  {
    id: 'host-rules-close',
    routeName: 'HostSetup',
    target: 'host.rules',
    advanceOnAction: 'host.rulesClosed',
    text: 'Tik bovenaan op Spelregels om dit menu weer te sluiten.',
    focus: { x: 0.12, y: 0.12, width: 0.76, height: 0.1, radius: 28 },
    targetPadding: 8,
    targetOffsetY: 20,
    hand: 'tap',
    handOffsetX: 78,
    handOffsetY: 8,
    bubble: 'top',
    coachPlacement: 'top',
    coachOffsetY: 330,
    actionLabel: 'Sluit Spelregels',
    requiresAction: true,
  },
  {
    id: 'host-create-lobby',
    routeName: 'HostSetup',
    target: 'host.createLobby',
    advanceOnAction: 'host.createLobbyPressed',
    text: 'Alles klaar? Maak dan je lobby aan.',
    focus: { x: 0.16, y: 0.68, width: 0.68, height: 0.11, radius: 28 },
    targetPadding: 8,
    hand: 'tap',
    bubble: 'top',
    coachOffsetY: -76,
    actionLabel: 'Maak lobby aan',
    requiresAction: true,
  },
  {
    id: 'host-confirm-create-lobby',
    routeName: 'HostSetup',
    target: 'host.confirmYes',
    advanceOnAction: 'host.confirmCreateLobbyPressed',
    text: 'Tik op Ja om de oefenlobby te openen.',
    focus: { x: 0.52, y: 0.55, width: 0.34, height: 0.08, radius: 24 },
    targetPadding: 10,
    hand: 'tap',
    handOffsetX: 34,
    handOffsetY: 4,
    bubble: 'top',
    coachOffsetY: -80,
    modalCoach: true,
    actionLabel: 'Tik op Ja',
    requiresAction: true,
  },
  {
    id: 'host-lobby-code',
    routeName: 'Lobby',
    target: 'lobby.codePlate',
    text: 'Dit is een voorbeeldcode voor de uitleg. Deze code is niet echt.',
    focus: { x: 0.1, y: 0.13, width: 0.8, height: 0.14, radius: 28 },
    targetPadding: 10,
    keepFocusVisible: true,
    hand: null,
    bubble: 'bottom',
    coachOffsetY: -76,
    actionLabel: 'Volgende',
    nextButtonBottom: 16,
  },
  {
    id: 'host-lobby-free-join',
    routeName: 'Lobby',
    target: 'lobby.codePlate',
    text: 'Normaal kun je deze code delen met vrienden of familie zodat ze kunnen joinen.',
    focus: { x: 0.1, y: 0.13, width: 0.8, height: 0.14, radius: 28 },
    targetPadding: 10,
    keepFocusVisible: true,
    hand: null,
    bubble: 'bottom',
    coachOffsetY: -76,
    actionLabel: 'Volgende',
    nextButtonBottom: 16,
  },
  {
    id: 'host-lobby-fake-note',
    routeName: 'Lobby',
    target: 'lobby.codePlate',
    text: 'Alleen hosten vraagt Premium. Joinen met een lobbycode is gratis.',
    focus: { x: 0.1, y: 0.13, width: 0.8, height: 0.14, radius: 28 },
    targetPadding: 10,
    keepFocusVisible: true,
    hand: null,
    bubble: 'bottom',
    coachOffsetY: -76,
    actionLabel: 'Volgende',
    nextButtonBottom: 16,
  },
  {
    id: 'host-lobby-player-setup',
    routeName: 'Lobby',
    target: 'lobby.playerSetup',
    text: 'Ook als host kun je hier je naam en autokleur aanpassen.',
    focus: { x: 0.08, y: 0.32, width: 0.84, height: 0.34, radius: 30 },
    targetPadding: 12,
    hand: null,
    bubble: 'bottom',
    coachOffsetY: -76,
    actionLabel: 'Volgende',
    nextButtonBottom: 16,
  },
  {
    id: 'host-lobby-player-table',
    routeName: 'Lobby',
    target: 'lobby.playerTable',
    text: 'Dit overzicht laat zien wie er in de lobby zitten, welke kleur en naam spelers hebben.',
    focus: { x: 0.08, y: 0.57, width: 0.84, height: 0.25, radius: 28 },
    targetPadding: 10,
    hand: null,
    bubble: 'top',
    coachOffsetY: -54,
    actionLabel: 'Volgende',
    nextButtonBottom: 16,
  },
  {
    id: 'host-lobby-bad-connection-player',
    routeName: 'Lobby',
    target: 'lobby.badConnectionPlayer',
    text: 'Deze testspeler heeft slechte verbinding. Dat zie je aan het wifi-icoon.',
    focus: { x: 0.5, y: 0.58, width: 0.34, height: 0.2, radius: 28 },
    targetPadding: 12,
    hand: null,
    bubble: 'top',
    coachOffsetY: -54,
    actionLabel: 'Volgende',
    nextButtonBottom: 16,
  },
  {
    id: 'host-lobby-kick-player',
    routeName: 'Lobby',
    target: 'lobby.badConnectionRemove',
    advanceOnAction: 'lobby.badConnectionRemoved',
    text: 'Als host kun je zo’n speler verwijderen via het kruisje.',
    focus: { x: 0.72, y: 0.6, width: 0.12, height: 0.08, radius: 18 },
    targetPadding: 12,
    hand: 'tap',
    handOffsetX: 8,
    handOffsetY: 6,
    bubble: 'top',
    coachOffsetY: -54,
    actionLabel: 'Verwijder speler',
    requiresAction: true,
  },
  {
    id: 'host-lobby-rules-tab',
    routeName: 'Lobby',
    target: 'lobby.rulesTab',
    advanceOnAction: 'lobby.rulesOpened',
    text: 'In de lobby kun je voor of na een potje nog spelregels aanpassen.',
    focus: { x: 0.08, y: 0.84, width: 0.84, height: 0.1, radius: 28 },
    targetPadding: 8,
    hand: 'tap',
    handOffsetX: 64,
    handOffsetY: 4,
    bubble: 'top',
    coachOffsetY: -80,
    actionLabel: 'Open Spelregels',
    requiresAction: true,
  },
  {
    id: 'host-lobby-rules-note',
    routeName: 'Lobby',
    text: 'In deze spelregels kun je alles weer aanpassen, net als voordat je de lobby maakte.',
    focus: { x: 0.05, y: 0.28, width: 0.9, height: 0.66, radius: 34 },
    hand: null,
    bubble: 'top',
    coachOffsetY: -80,
    actionLabel: 'Volgende',
    nextButtonBottom: 16,
    blockFocusTouches: true,
  },
  {
    id: 'host-lobby-rules-mode-theme',
    routeName: 'Lobby',
    target: 'lobby.rulesModeTheme',
    text: 'Bovenaan kun je ook spelmodus en thema aanpassen. Dat hoeft nu niet.',
    focus: { x: 0.08, y: 0.28, width: 0.84, height: 0.26, radius: 26 },
    targetPadding: 10,
    hand: null,
    bubble: 'bottom',
    coachPlacement: 'top',
    coachOffsetY: -118,
    actionLabel: 'Volgende',
    nextButtonBottom: 16,
    blockFocusTouches: true,
  },
  {
    id: 'host-lobby-start',
    routeName: 'Lobby',
    target: 'lobby.startButton',
    advanceOnAction: 'lobby.startPressed',
    text: 'In een echte lobby tik je op Start spel zodra iedereen klaar is.',
    focus: { x: 0.08, y: 0.75, width: 0.84, height: 0.1, radius: 28 },
    targetPadding: 8,
    hand: 'tap',
    bubble: 'top',
    coachOffsetY: -86,
    actionLabel: 'Tik op Start spel',
    requiresAction: true,
  },
  {
    id: 'host-game-board',
    routeName: 'Spel',
    target: 'game.boardArea',
    text: 'In Collectief werk je samen op dezelfde bingokaart.',
    focus: { x: 0.09, y: 0.24, width: 0.82, height: 0.42, radius: 30 },
    hand: null,
    bubble: 'bottom',
    coachOffsetY: -92,
    actionLabel: 'Volgende',
    blockFocusTouches: true,
  },
  {
    id: 'host-game-tap-cell',
    routeName: 'Spel',
    target: 'game.cell.0',
    advanceOnAction: 'game.cellTapped',
    text: 'Als jij iets aanklikt, dan ziet de rest van de lobby dat ook.',
    focus: { x: 0.14, y: 0.33, width: 0.19, height: 0.1, radius: 18 },
    hand: 'tap',
    bubble: 'bottom',
    actionLabel: 'Tik een vakje aan',
    requiresAction: true,
  },
  {
    id: 'host-game-other-player',
    routeName: 'Spel',
    target: 'game.boardArea',
    text: 'Anderen kunnen ook vakjes aanvinken. Zo vullen jullie samen de kaart.',
    focus: { x: 0.09, y: 0.24, width: 0.82, height: 0.42, radius: 30 },
    hand: null,
    bubble: 'bottom',
    actionLabel: 'Volgende',
    blockFocusTouches: true,
  },
  {
    id: 'host-game-finish',
    routeName: 'Spel',
    target: 'game.boardArea',
    advanceOnAction: 'game.bingoShown',
    text: 'Maak nu bingo door een rij vol te krijgen.',
    focus: { x: 0.09, y: 0.24, width: 0.82, height: 0.42, radius: 30 },
    hand: null,
    bubble: 'bottom',
    actionLabel: 'Maak bingo',
    requiresAction: true,
  },
  {
    id: 'game-winner-play-info',
    routeName: 'Spel',
    text: 'Met Speel start je opnieuw met dezelfde regels, maar met een nieuwe bingokaart.',
    focus: { x: 0.14, y: 0.53, width: 0.72, height: 0.36, radius: 28 },
    hand: null,
    bubble: 'top',
    actionLabel: 'Volgende',
    nextButtonOffsetY: 18,
    coachOffsetY: -140,
    blockFocusTouches: true,
  },
  {
    id: 'game-winner-lobby-info',
    routeName: 'Spel',
    text: 'Met de knop Lobby neem ga jij en alle spelers terug naar de lobby.',
    focus: { x: 0.14, y: 0.53, width: 0.72, height: 0.36, radius: 28 },
    hand: null,
    bubble: 'top',
    actionLabel: 'Volgende',
    nextButtonOffsetY: 18,
    coachOffsetY: -140,
    blockFocusTouches: true,
  },
  {
    id: 'game-winner-home-info',
    routeName: 'Spel',
    text: 'Met Hoofdmenu stop je de lobby. Alle spelers verlaten dan ook de lobby.',
    focus: { x: 0.14, y: 0.53, width: 0.72, height: 0.36, radius: 28 },
    hand: null,
    bubble: 'top',
    actionLabel: 'Volgende',
    nextButtonOffsetY: 18,
    coachOffsetY: -140,
    blockFocusTouches: true,
  },
  {
    id: 'game-winner-home-action',
    routeName: 'Spel',
    text: 'Tik nu op Hoofdmenu om de uitleg te stoppen.',
    focus: { x: 0.14, y: 0.53, width: 0.72, height: 0.36, radius: 28 },
    finishOnAction: 'game.winnerMenuSelected',
    finishWithoutReveal: true,
    hand: 'tap',
    handOffsetX: 18,
    handOffsetY: 146,
    bubble: 'top',
    actionLabel: 'Tik op Hoofdmenu',
    hideNextButton: true,
    requiresAction: true,
    coachOffsetY: -104,
  },
];

export const TUTORIAL_FLOWS = {
  general: GENERAL_TUTORIAL_STEPS,
  menu: MENU_TUTORIAL_STEPS,
  join: JOIN_TUTORIAL_STEPS,
  host: HOST_TUTORIAL_STEPS,
};

export const TUTORIAL_STEPS = GENERAL_TUTORIAL_STEPS;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function rectsOverlap(a, b, margin = 0) {
  if (!a || !b) {
    return false;
  }

  return !(
    a.x + a.width < b.x - margin
    || a.x > b.x + b.width + margin
    || a.y + a.height < b.y - margin
    || a.y > b.y + b.height + margin
  );
}

function getCoachPlacement({
  baseBubbleTop,
  bubbleHeight,
  bubbleLeft,
  bubbleWidth,
  carSize,
  carOffsetY,
  focusRect,
  height,
  metrics,
  width,
}) {
  let nextBubbleTop = baseBubbleTop;
  const minTop = metrics.sy(38);
  const maxTop = height - bubbleHeight - metrics.sy(20);
  const margin = metrics.s(14);
  const buildRects = (top) => {
    const bubble = {
      x: bubbleLeft,
      y: top,
      width: bubbleWidth,
      height: bubbleHeight,
    };
    const car = {
      x: Math.min(width - carSize * 0.72, bubbleLeft + bubbleWidth * 0.68),
      y: top + bubbleHeight * 0.72 + carOffsetY,
      width: carSize * 0.72,
      height: carSize,
    };

    return { bubble, car };
  };

  if (focusRect) {
    const current = buildRects(nextBubbleTop);
    const overlapsFocus = rectsOverlap(current.bubble, focusRect, margin)
      || rectsOverlap(current.car, focusRect, margin);

    if (overlapsFocus) {
      const belowFocusTop = focusRect.y + focusRect.height + margin;
      const aboveFocusTop = focusRect.y - bubbleHeight - margin;
      const belowFits = belowFocusTop <= maxTop;
      const aboveFits = aboveFocusTop >= minTop;

      if (belowFits) {
        nextBubbleTop = belowFocusTop;
      } else if (aboveFits) {
        nextBubbleTop = aboveFocusTop;
      } else if (focusRect.y < height * 0.5) {
        nextBubbleTop = maxTop;
      } else {
        nextBubbleTop = minTop;
      }
    }
  }

  return clamp(nextBubbleTop, minTop, maxTop);
}

function getFocusRect(focus, width, height) {
  if (!focus) {
    return null;
  }

  return {
    x: Math.round(width * focus.x),
    y: Math.round(height * focus.y),
    width: Math.round(width * focus.width),
    height: Math.round(height * focus.height),
    radius: focus.radius ?? 24,
  };
}

function hasSameCoachCarPlacement(previousStep, nextStep) {
  if (!previousStep || !nextStep) {
    return false;
  }

  return (
    (previousStep.bubble ?? null) === (nextStep.bubble ?? null)
    && (previousStep.coachPlacement ?? null) === (nextStep.coachPlacement ?? null)
    && (previousStep.coachOffsetY ?? 0) === (nextStep.coachOffsetY ?? 0)
    && getStepCarOffsetY(previousStep) === getStepCarOffsetY(nextStep)
    && !previousStep.localCoachOnly
    && !nextStep.localCoachOnly
  );
}

function getStepCarOffsetY(step) {
  if (step?.carOffsetY != null) {
    return step.carOffsetY;
  }

  if (step?.id?.startsWith('menu-') && step.id !== 'menu-welcome') {
    return -18;
  }

  return 0;
}

function hasSamePersistentFocus(previousStep, nextStep) {
  if (!previousStep?.keepFocusVisible || !nextStep?.keepFocusVisible) {
    return false;
  }

  return (
    (previousStep.target ?? null) === (nextStep.target ?? null)
    && JSON.stringify(previousStep.focus ?? null) === JSON.stringify(nextStep.focus ?? null)
    && (previousStep.focusShape ?? null) === (nextStep.focusShape ?? null)
  );
}

function runTiming(value, toValue, duration, easing = Easing.out(Easing.cubic)) {
  return Animated.timing(value, {
    toValue,
    duration,
    easing,
    useNativeDriver: true,
  });
}

function HighlightMask({ focusRect, shape }) {
  const { width, height } = useWindowDimensions();
  const maskId = useMemo(() => `tutorial-hole-${Math.round(focusRect.x)}-${Math.round(focusRect.y)}-${shape}`, [focusRect.x, focusRect.y, shape]);
  const circleRadius = Math.max(focusRect.width, focusRect.height) / 2;
  const circleCx = focusRect.x + focusRect.width / 2;
  const circleCy = focusRect.y + focusRect.height / 2;
  const rectRadius = clamp(focusRect.radius ?? 24, 0, Math.min(focusRect.width, focusRect.height) / 2);

  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Defs>
        <Mask id={maskId}>
          <Rect x="0" y="0" width={width} height={height} fill="#ffffff" />
          {shape === 'circle' ? (
            <Circle cx={circleCx} cy={circleCy} r={circleRadius} fill="#000000" />
          ) : (
            <Rect
              x={focusRect.x}
              y={focusRect.y}
              width={focusRect.width}
              height={focusRect.height}
              rx={rectRadius}
              ry={rectRadius}
              fill="#000000"
            />
          )}
        </Mask>
      </Defs>
      <Rect x="0" y="0" width={width} height={height} fill="rgba(0, 0, 0, 0.64)" mask={`url(#${maskId})`} />
    </Svg>
  );
}

export default function TutorialOverlay({
  active,
  step,
  stepIndex,
  totalSteps,
  targetRects = {},
  nextUnlocked = false,
  fontFamily,
  introColor = null,
  onNext,
  onSkip,
  onAction,
}) {
  const { width, height } = useWindowDimensions();
  const [displayStep, setDisplayStep] = useState(step);
  const renderStep = displayStep ?? step;
  const handProgress = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const carOpacityProgress = useRef(new Animated.Value(0)).current;
  const highlightOpacityProgress = useRef(new Animated.Value(0)).current;
  const introFadeKeyRef = useRef(null);
  const introFadeTimerRef = useRef(null);
  const measuredFocusRect = renderStep?.target ? targetRects[renderStep.target] : null;
  const focusRect = useMemo(() => {
    if (measuredFocusRect) {
      const pad = renderStep?.targetPadding ?? 8;
      const offsetX = renderStep?.targetOffsetX ?? 0;
      const offsetY = renderStep?.targetOffsetY ?? 0;
      return {
        x: Math.max(0, measuredFocusRect.x + offsetX - pad),
        y: Math.max(0, measuredFocusRect.y + offsetY - pad),
        width: Math.min(width, measuredFocusRect.width + pad * 2),
        height: Math.min(height, measuredFocusRect.height + pad * 2),
        radius: renderStep?.focusShape === 'circle'
          ? Math.max(measuredFocusRect.width, measuredFocusRect.height)
          : (renderStep?.targetRadius ?? renderStep?.focus?.radius ?? 24),
      };
    }

    return getFocusRect(renderStep?.focus, width, height);
  }, [height, measuredFocusRect, renderStep, width]);

  useEffect(() => {
    if (!active || !step) {
      if (introFadeTimerRef.current) {
        clearTimeout(introFadeTimerRef.current);
        introFadeTimerRef.current = null;
      }
      contentOpacity.stopAnimation();
      carOpacityProgress.stopAnimation();
      highlightOpacityProgress.stopAnimation();
      contentOpacity.setValue(0);
      carOpacityProgress.setValue(0);
      highlightOpacityProgress.setValue(0);
      setDisplayStep(null);
      introFadeKeyRef.current = null;
      return;
    }

    if (!displayStep) {
      setDisplayStep(step);
      contentOpacity.setValue(0);
      carOpacityProgress.setValue(0);
      highlightOpacityProgress.setValue(0);
      const delayMs = step.introDelayMs ?? 0;
      const startFade = () => {
        introFadeTimerRef.current = null;
        Animated.parallel([
          runTiming(contentOpacity, 1, step.stagedIntro ? 1900 : 420),
          runTiming(carOpacityProgress, 1, step.stagedIntro ? 520 : 420),
          runTiming(highlightOpacityProgress, 1, step.stagedIntro ? 520 : 420),
        ]).start();
      };
      if (delayMs > 0) {
        if (introFadeTimerRef.current) {
          clearTimeout(introFadeTimerRef.current);
        }
        introFadeTimerRef.current = setTimeout(startFade, delayMs);
      } else {
        startFade();
      }
      return;
    }

    if (displayStep.id === step.id) {
      return;
    }

    contentOpacity.stopAnimation();
    carOpacityProgress.stopAnimation();
    highlightOpacityProgress.stopAnimation();
    if (introFadeTimerRef.current) {
      clearTimeout(introFadeTimerRef.current);
      introFadeTimerRef.current = null;
    }
    const keepCarVisible = hasSameCoachCarPlacement(displayStep, step);
    const keepHighlightVisible = hasSamePersistentFocus(displayStep, step);
    Animated.parallel([
      runTiming(contentOpacity, 0, 220, Easing.in(Easing.quad)),
      keepCarVisible
        ? runTiming(carOpacityProgress, 1, 1)
        : runTiming(carOpacityProgress, 0, 220, Easing.in(Easing.quad)),
      keepHighlightVisible
        ? runTiming(highlightOpacityProgress, 1, 1)
        : runTiming(highlightOpacityProgress, 0, 220, Easing.in(Easing.quad)),
    ]).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setDisplayStep(step);
      contentOpacity.setValue(0);
      carOpacityProgress.setValue(keepCarVisible ? 1 : 0);
      highlightOpacityProgress.setValue(keepHighlightVisible ? 1 : 0);
      const delayMs = step.introDelayMs ?? 0;
      const startFade = () => {
        introFadeTimerRef.current = null;
        Animated.parallel([
          runTiming(contentOpacity, 1, step.stagedIntro ? 1900 : 420),
          keepCarVisible
            ? runTiming(carOpacityProgress, 1, 1)
            : runTiming(carOpacityProgress, 1, step.stagedIntro ? 520 : 420),
          keepHighlightVisible
            ? runTiming(highlightOpacityProgress, 1, 1)
            : runTiming(highlightOpacityProgress, 1, step.stagedIntro ? 520 : 420),
        ]).start();
      };
      if (delayMs > 0) {
        if (introFadeTimerRef.current) {
          clearTimeout(introFadeTimerRef.current);
        }
        introFadeTimerRef.current = setTimeout(startFade, delayMs);
      } else {
        startFade();
      }
    });
  }, [active, carOpacityProgress, contentOpacity, displayStep, highlightOpacityProgress, introColor, step]);

  useEffect(() => {
    handProgress.stopAnimation();
    handProgress.setValue(0);

    if (!active || !renderStep?.hand) {
      return undefined;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(handProgress, {
          toValue: 1,
          duration: renderStep.hand === 'hold' ? 900 : 620,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(handProgress, {
          toValue: 0,
          duration: renderStep.hand === 'hold' ? 420 : 520,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(260),
      ])
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [active, handProgress, renderStep?.hand, renderStep?.id]);

  useEffect(() => {
    if (!active || !renderStep?.forceVisibleAfterMs) {
      return undefined;
    }

    const timer = setTimeout(() => {
      contentOpacity.setValue(1);
      carOpacityProgress.setValue(1);
      highlightOpacityProgress.setValue(1);
    }, renderStep.forceVisibleAfterMs);

    return () => clearTimeout(timer);
  }, [
    active,
    carOpacityProgress,
    contentOpacity,
    highlightOpacityProgress,
    renderStep?.forceVisibleAfterMs,
    renderStep?.id,
  ]);

  if (!active || !renderStep || renderStep.localCoachOnly) {
    return null;
  }

  const metrics = getResponsiveMetrics(width, height);
  const bubbleWidth = Math.min(width * 0.9, metrics.contentMaxWidth);
  const bubbleHeight = bubbleWidth * 0.74;
  const carSize = metrics.s(190, 132, metrics.isTablet ? 246 : 190);
  const baseBubbleTop = renderStep.coachPlacement === 'top'
    ? clamp(height * 0.08, 58, height * 0.18)
    : renderStep.bubble === 'bottom'
    ? clamp(height - bubbleHeight - metrics.sy(84), height * 0.5, height - bubbleHeight - metrics.sy(56))
    : renderStep.bubble === 'center'
      ? clamp(height * 0.25, 112, height * 0.36)
      : clamp((focusRect?.y ?? height * 0.35) - bubbleHeight - metrics.sy(18), metrics.sy(54), height - bubbleHeight - metrics.sy(20));
  const requestedBubbleTop = clamp(baseBubbleTop + metrics.sy(renderStep.coachOffsetY ?? 0), metrics.sy(38), height - bubbleHeight - metrics.sy(20));
  const bubbleLeft = Math.min(width - bubbleWidth - metrics.s(10), Math.max(metrics.s(10), width * 0.5 - bubbleWidth * 0.54));
  const carOffsetY = metrics.sy(getStepCarOffsetY(renderStep));
  const bubbleTop = getCoachPlacement({
    baseBubbleTop: requestedBubbleTop,
    bubbleHeight,
    bubbleLeft,
    bubbleWidth,
    carOffsetY,
    carSize,
    focusRect,
    height,
    metrics,
    width,
  });
  const carLeft = Math.min(width - carSize * 0.72, bubbleLeft + bubbleWidth * 0.68);
  let carTop = bubbleTop + bubbleHeight * 0.72 + carOffsetY;
  const estimatedNextButtonHeight = renderStep.stackedAlternateAction ? metrics.sy(142) : metrics.sy(64);
  let nextButtonTop = clamp(
    bubbleTop + bubbleHeight + metrics.sy(30) + metrics.sy(renderStep.nextButtonOffsetY ?? 0),
    metrics.sy(116),
    height - estimatedNextButtonHeight - metrics.sy(18)
  );
  const coachControlGap = metrics.sy(10);
  const carBottom = carTop + carSize * 0.86;

  if (renderStep.nextButtonBottom == null && carBottom + coachControlGap > nextButtonTop) {
    const pushedButtonTop = carBottom + coachControlGap;

    if (pushedButtonTop <= height - estimatedNextButtonHeight - metrics.sy(18)) {
      nextButtonTop = pushedButtonTop;
    } else {
      carTop = Math.max(
        bubbleTop + bubbleHeight * 0.58,
        nextButtonTop - carSize * 0.86 - coachControlGap
      );
    }
  }
  let nextButtonPosition = renderStep.nextButtonBottom != null
    ? { bottom: metrics.sy(renderStep.nextButtonBottom) }
    : { top: nextButtonTop };

  if (focusRect && !renderStep.hideNextButton) {
    const buttonTop = nextButtonPosition.top ?? (height - nextButtonPosition.bottom - estimatedNextButtonHeight);
    const buttonRect = {
      x: width * 0.5 - Math.min(width * 0.76, metrics.s(280)) / 2,
      y: buttonTop,
      width: Math.min(width * 0.76, metrics.s(280)),
      height: estimatedNextButtonHeight,
    };

    if (rectsOverlap(buttonRect, focusRect, metrics.sy(10))) {
      const belowTop = focusRect.y + focusRect.height + metrics.sy(14);
      const aboveTop = focusRect.y - estimatedNextButtonHeight - metrics.sy(14);
      const maxButtonTop = height - estimatedNextButtonHeight - metrics.sy(18);

      if (belowTop <= maxButtonTop) {
        nextButtonPosition = { top: belowTop };
      } else if (aboveTop >= metrics.sy(74)) {
        nextButtonPosition = { top: aboveTop };
      } else {
        nextButtonPosition = { top: maxButtonTop };
      }
    }
  }
  const handSize = metrics.s(108, 82, metrics.isTablet ? 138 : 108);
  const handLeft = (focusRect ? focusRect.x + focusRect.width * 0.58 - handSize * 0.28 : width * 0.54) + metrics.sx(renderStep.handOffsetX ?? 0);
  const handTop = (focusRect ? focusRect.y + focusRect.height * 0.4 - handSize * 0.22 : height * 0.54) + metrics.sy(renderStep.handOffsetY ?? 0);
  const tapTranslateY = handProgress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [metrics.sy(-14), metrics.sy(14), metrics.sy(-14)],
  });
  const tapScale = handProgress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [1, 0.84, 1],
  });
  const swipeTranslateX = handProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [metrics.sx(44), metrics.sx(-44)],
  });
  const scrollTranslateY = handProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [metrics.sy(46), metrics.sy(-46)],
  });
  const holdScale = handProgress.interpolate({
    inputRange: [0, 0.18, 1],
    outputRange: [1, 0.9, 0.9],
  });
  const holdOpacity = handProgress.interpolate({
    inputRange: [0, 0.18, 0.88, 1],
    outputRange: [1, 1, 1, 0.72],
  });
  const tapTranslateX = handProgress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [metrics.sx(-8), metrics.sx(9), metrics.sx(-8)],
  });
  const handTransform = renderStep.hand === 'swipe'
    ? [{ translateX: swipeTranslateX }]
    : renderStep.hand === 'scrollDown'
      ? [{ translateY: scrollTranslateY }]
    : renderStep.hand === 'hold'
      ? [{ scale: holdScale }]
      : [{ translateX: tapTranslateX }, { translateY: tapTranslateY }, { scale: tapScale }];
  const contentTranslateY = contentOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });
  const solidIntroColor = renderStep?.id === 'home-welcome' ? introColor : null;
  const stagedIntro = Boolean(renderStep.stagedIntro);
  const carOpacity = carOpacityProgress;
  const bubbleOpacity = stagedIntro
    ? contentOpacity.interpolate({
        inputRange: [0, 0.26, 0.54, 1],
        outputRange: [0, 0, 1, 1],
      })
    : contentOpacity;
  const controlsOpacity = stagedIntro
    ? contentOpacity.interpolate({
        inputRange: [0, renderStep.controlsAppearAt ?? 0.74, 1],
        outputRange: [0, 0, 1],
      })
    : contentOpacity;
  const handIntroOpacity = renderStep.handDelayIntro
    ? contentOpacity.interpolate({
        inputRange: [0, renderStep.handAppearAt ?? 0.76, 1],
        outputRange: [0, 0, 1],
      })
    : contentOpacity;
  const hasAlternateAction = Boolean(renderStep.alternateActionLabel && renderStep.alternateActionName);
  const useStackedAlternateAction = hasAlternateAction && renderStep.stackedAlternateAction;
  const highlightOpacity = highlightOpacityProgress;
  const introControlOpacity = controlsOpacity;
  const rootPointerEvents = 'box-none';
  const handleNextPress = (event) => {
    if (renderStep?.stagedIntro) {
      if (introFadeTimerRef.current) {
        clearTimeout(introFadeTimerRef.current);
        introFadeTimerRef.current = null;
      }
      contentOpacity.stopAnimation();
      Animated.timing(contentOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) {
          onNext?.(event);
        }
      });
      return;
    }

    onNext?.(event);
  };

  return (
    <View pointerEvents={rootPointerEvents} style={styles.layer}>
      {solidIntroColor ? (
        <View pointerEvents="none" style={[styles.fullSolid, { backgroundColor: solidIntroColor }]} />
      ) : focusRect ? (
        <>
          <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { opacity: highlightOpacity }]}>
            <HighlightMask focusRect={focusRect} shape={renderStep.focusShape} />
          </Animated.View>
          <Pressable onPress={NOOP} style={[styles.touchBlocker, { left: 0, top: 0, right: 0, height: focusRect.y }]} />
          <Pressable onPress={NOOP} style={[styles.touchBlocker, { left: 0, top: focusRect.y, width: focusRect.x, height: focusRect.height }]} />
          <Pressable onPress={NOOP} style={[styles.touchBlocker, { left: focusRect.x + focusRect.width, top: focusRect.y, right: 0, height: focusRect.height }]} />
          <Pressable onPress={NOOP} style={[styles.touchBlocker, { left: 0, top: focusRect.y + focusRect.height, right: 0, bottom: 0 }]} />
          {renderStep.blockFocusTouches ? (
            <Pressable onPress={NOOP} style={[styles.touchBlocker, { left: focusRect.x, top: focusRect.y, width: focusRect.width, height: focusRect.height }]} />
          ) : null}
        </>
      ) : (
        <Pressable style={styles.fullDim} onPress={NOOP} />
      )}

      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
        ]}
      >
        {renderStep.modalCoach ? null : (
          <TutorialCoachContent
            step={renderStep}
            fontFamily={fontFamily}
            bubbleWidth={bubbleWidth}
            bubbleHeight={bubbleHeight}
            bubbleLeft={bubbleLeft}
            bubbleTop={bubbleTop}
            carSize={carSize}
            carLeft={carLeft}
            carTop={carTop}
            bubbleOpacity={bubbleOpacity}
            carOpacity={carOpacity}
            bubbleTranslateY={contentTranslateY}
          />
        )}
      </Animated.View>

      {renderStep.hand && !(renderStep.hideHandWhenUnlocked && nextUnlocked) ? (
        <Animated.Image
          pointerEvents="none"
          source={HAND_IMAGE}
          resizeMode="contain"
          style={[
            styles.hand,
            {
              width: handSize,
              height: handSize,
              left: handLeft,
              top: handTop,
              opacity: renderStep.hand === 'hold' ? holdOpacity : handIntroOpacity,
              transform: handTransform,
            },
          ]}
        />
      ) : null}

      {!renderStep.hideCloseButton ? (
        <View style={[styles.topBar, styles.interactiveOverlayControl]} pointerEvents="box-none">
          <View style={styles.closeButtonSizer}>
            <GlossyButton
              label="Sluit"
              variant="red"
              size="normal"
              heightOverride={38}
              horizontalPadding={14}
              labelFontScale={0.72}
              onPress={onSkip}
            />
          </View>
        </View>
      ) : null}

      {useStackedAlternateAction ? (
        <Animated.View pointerEvents="box-none" style={[styles.stackedActionWrap, styles.interactiveOverlayControl, nextButtonPosition, { opacity: introControlOpacity }]}>
          <View style={styles.stackedActionButton}>
            <GlossyButton
              label={renderStep.actionLabel ?? 'Klaar'}
              variant="green"
              size="normal"
              heightOverride={58}
              horizontalPadding={32}
              labelFontScale={0.84}
              onPress={handleNextPress}
            />
          </View>
          <View style={styles.stackedActionButton}>
            <GlossyButton
              label={renderStep.alternateActionLabel}
              variant={renderStep.alternateActionVariant ?? 'yellow'}
              size="normal"
              heightOverride={64}
              horizontalPadding={26}
              labelFontScale={0.8}
              labelNumberOfLines={2}
              onPress={() => onAction?.(renderStep.alternateActionName)}
            />
          </View>
        </Animated.View>
      ) : (!renderStep.hideNextButton && (!renderStep.requiresAction || nextUnlocked)) ? (
        <Animated.View pointerEvents="box-none" style={[styles.nextButtonWrap, styles.interactiveOverlayControl, nextButtonPosition, { opacity: introControlOpacity }]}>
          <View style={styles.nextButtonSizer}>
            <GlossyButton
              label={renderStep.continueLabel ?? renderStep.actionLabel ?? 'Volgende'}
              variant="green"
              size="normal"
              heightOverride={58}
              horizontalPadding={32}
              labelFontScale={0.9}
              onPress={handleNextPress}
            />
          </View>
        </Animated.View>
      ) : null}

      {hasAlternateAction && !useStackedAlternateAction ? (
        <View pointerEvents="box-none" style={styles.alternateButtonWrap}>
          <View style={styles.alternateButtonSizer}>
            <GlossyButton
              label={renderStep.alternateActionLabel}
              variant={renderStep.alternateActionVariant ?? 'red'}
              size="normal"
              heightOverride={58}
              horizontalPadding={28}
              labelFontScale={0.82}
              onPress={() => onAction?.(renderStep.alternateActionName)}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function TutorialCoachContent({
  step,
  fontFamily,
  bubbleWidth,
  bubbleHeight,
  bubbleLeft,
  bubbleTop,
  carSize,
  carLeft,
  carTop,
  bubbleOpacity = 1,
  carOpacity = 1,
  bubbleTranslateY = 0,
}) {
  if (!step) {
    return null;
  }

  const textBoxControls = {
    ...TUTORIAL_BUBBLE_TEXT_BOX.default,
    ...(TUTORIAL_BUBBLE_TEXT_BOX.byPlacement[step.bubble] ?? {}),
    ...(TUTORIAL_BUBBLE_TEXT_BOX.byStepId[step.id] ?? {}),
  };
  const textBoxStyle = {
    left: `${textBoxControls.left}%`,
    top: `${textBoxControls.top}%`,
    width: `${textBoxControls.width}%`,
    height: `${textBoxControls.height}%`,
  };

  return (
    <>
      <AnimatedImageBackground
        pointerEvents="none"
        source={SPEECH_BUBBLE_IMAGE}
        resizeMode="contain"
        imageStyle={styles.bubbleImageMirrored}
        style={[
          styles.bubble,
          {
            width: bubbleWidth,
            height: bubbleHeight,
            left: bubbleLeft,
            top: bubbleTop,
            opacity: bubbleOpacity,
            transform: [{ translateY: bubbleTranslateY }],
          },
        ]}
      >
        <View
          style={[
            styles.bubbleTextBox,
            textBoxStyle,
          ]}
        >
          <Text
            numberOfLines={4}
            adjustsFontSizeToFit
            minimumFontScale={0.62}
            style={[
              styles.bubbleText,
              {
                fontFamily,
                fontSize: textBoxControls.fontSize,
                lineHeight: textBoxControls.lineHeight,
              },
            ]}
          >
            {step.text}
          </Text>
        </View>
      </AnimatedImageBackground>

      <Animated.Image
        pointerEvents="none"
        source={TUTORIAL_CAR_IMAGE}
        resizeMode="contain"
        style={[
          styles.car,
          {
            width: carSize,
            height: carSize,
            left: carLeft,
            top: carTop,
            opacity: carOpacity,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10040,
    elevation: 10040,
  },
  dim: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
  },
  touchBlocker: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  fullDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
  },
  fullSolid: {
    ...StyleSheet.absoluteFillObject,
  },
  bubble: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleImageMirrored: {
    transform: [{ scaleX: -1 }],
  },
  bubbleTextBox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    width: '100%',
    color: '#111111',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    letterSpacing: 0,
  },
  car: {
    position: 'absolute',
  },
  hand: {
    position: 'absolute',
  },
  topBar: {
    position: 'absolute',
    top: 14,
    left: 14,
    right: 14,
    alignItems: 'flex-start',
  },
  interactiveOverlayControl: {
    zIndex: 20,
    elevation: 20,
  },
  closeButtonSizer: {
    width: 88,
  },
  nextButtonWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 74,
  },
  nextButtonSizer: {
    width: '54%',
    minWidth: 186,
    maxWidth: 270,
  },
  stackedActionWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 62,
    gap: 10,
  },
  stackedActionButton: {
    width: '72%',
    minWidth: 250,
    maxWidth: 350,
  },
  alternateButtonWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 24,
    alignItems: 'center',
    paddingHorizontal: 80,
  },
  alternateButtonSizer: {
    width: '70%',
    minWidth: 230,
    maxWidth: 330,
  },
  footer: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    minHeight: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  stepPill: {
    minWidth: 62,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.34)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.28)',
  },
  stepText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: 0,
  },
  nextButton: {
    minWidth: 124,
    maxWidth: 164,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    backgroundColor: '#F5C400',
    borderWidth: 3,
    borderColor: '#8B5B00',
  },
  nextText: {
    color: '#4A2800',
    fontSize: 17,
    lineHeight: 21,
    letterSpacing: 0,
    textAlign: 'center',
  },
  lockPill: {
    minWidth: 142,
    maxWidth: 190,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 17,
    backgroundColor: 'rgba(245, 196, 0, 0.88)',
    borderWidth: 3,
    borderColor: '#8B5B00',
  },
  lockText: {
    color: '#4A2800',
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: 0,
    textAlign: 'center',
  },
});
