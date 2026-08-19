import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Image, ImageBackground, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Circle, Defs, Mask, Rect } from 'react-native-svg';
import GlossyButton from './GlossyButton';

const HAND_IMAGE = require('../../assets/images/tutorial/tutorial-hand.png');
const SPEECH_BUBBLE_IMAGE = require('../../assets/images/tutorial/tutorial-speech-bubble.png');
const TUTORIAL_CAR_IMAGE = require('../../assets/images/tutorial/tutorial-car-red.png');
export const TUTORIAL_HAND_IMAGE = HAND_IMAGE;
const NOOP = () => {};

export const TUTORIAL_STEPS = [
  {
    id: 'home-welcome',
    routeName: 'Home',
    text: 'Hey daar! Welkom bij Auto Bingo.',
    focus: null,
    hand: null,
    bubble: 'center',
    actionLabel: 'Volgende',
  },
  {
    id: 'home-play',
    routeName: 'Home',
    target: 'home.play',
    advanceOnRoute: 'SingleDeviceSetupTest',
    text: 'Met deze optie speel je op 1 apparaat, met 1 of 2 spelers.',
    focus: { x: 0.05, y: 0.66, width: 0.43, height: 0.12, radius: 0 },
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
    actionLabel: 'Swipe door thema’s',
    continueLabel: 'Volgende',
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

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
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
  onNext,
  onSkip,
  onAction,
}) {
  const { width, height } = useWindowDimensions();
  const [displayStep, setDisplayStep] = useState(step);
  const renderStep = displayStep ?? step;
  const handProgress = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(1)).current;
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
          : 0,
      };
    }

    return getFocusRect(renderStep?.focus, width, height);
  }, [height, measuredFocusRect, renderStep, width]);

  useEffect(() => {
    if (!active || !step) {
      contentOpacity.stopAnimation();
      contentOpacity.setValue(0);
      setDisplayStep(null);
      return;
    }

    if (!displayStep) {
      setDisplayStep(step);
      contentOpacity.setValue(0);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      return;
    }

    if (displayStep.id === step.id) {
      return;
    }

    const quickSwap = displayStep.id === 'home-play' || step.id === 'home-play';
    contentOpacity.stopAnimation();
    Animated.timing(contentOpacity, {
      toValue: 0,
      duration: quickSwap ? 70 : 150,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) {
        return;
      }

      setDisplayStep(step);
      contentOpacity.setValue(0);
      Animated.timing(contentOpacity, {
        toValue: 1,
        duration: quickSwap ? 140 : 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    });
  }, [active, contentOpacity, displayStep, step]);

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

  if (!active || !renderStep || renderStep.localCoachOnly) {
    return null;
  }

  const bubbleWidth = Math.min(width * 0.9, 430);
  const bubbleHeight = bubbleWidth * 0.74;
  const carSize = Math.min(width * 0.38, 190);
  const baseBubbleTop = renderStep.coachPlacement === 'top'
    ? clamp(height * 0.08, 58, height * 0.18)
    : renderStep.bubble === 'bottom'
    ? clamp(height - bubbleHeight - 84, height * 0.5, height - bubbleHeight - 56)
    : renderStep.bubble === 'center'
      ? clamp(height * 0.25, 112, height * 0.36)
      : clamp((focusRect?.y ?? height * 0.35) - bubbleHeight - 18, 54, height - bubbleHeight - 20);
  const bubbleTop = clamp(baseBubbleTop + (renderStep.coachOffsetY ?? 0), 38, height - bubbleHeight - 20);
  const bubbleLeft = Math.min(width - bubbleWidth - 10, Math.max(10, width * 0.5 - bubbleWidth * 0.54));
  const carLeft = Math.min(width - carSize * 0.72, bubbleLeft + bubbleWidth * 0.68);
  const carTop = bubbleTop + bubbleHeight * 0.72;
  const nextButtonTop = clamp(bubbleTop + bubbleHeight + 30 + (renderStep.nextButtonOffsetY ?? 0), 116, height - 82);
  const nextButtonPosition = renderStep.nextButtonBottom != null
    ? { bottom: renderStep.nextButtonBottom }
    : { top: nextButtonTop };
  const handSize = Math.min(width * 0.23, 108);
  const handLeft = (focusRect ? focusRect.x + focusRect.width * 0.58 - handSize * 0.28 : width * 0.54) + (renderStep.handOffsetX ?? 0);
  const handTop = (focusRect ? focusRect.y + focusRect.height * 0.4 - handSize * 0.22 : height * 0.54) + (renderStep.handOffsetY ?? 0);
  const tapTranslateY = handProgress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [-14, 14, -14],
  });
  const tapScale = handProgress.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [1, 0.84, 1],
  });
  const swipeTranslateX = handProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [44, -44],
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
    outputRange: [-8, 9, -8],
  });
  const handTransform = renderStep.hand === 'swipe'
    ? [{ translateX: swipeTranslateX }]
    : renderStep.hand === 'hold'
      ? [{ scale: holdScale }]
      : [{ translateX: tapTranslateX }, { translateY: tapTranslateY }, { scale: tapScale }];
  const contentTranslateY = contentOpacity.interpolate({
    inputRange: [0, 1],
    outputRange: [8, 0],
  });
  const hasAlternateAction = Boolean(renderStep.alternateActionLabel && renderStep.alternateActionName);
  const rootPointerEvents = 'box-none';
  const highlightOpacity = renderStep.id === 'home-play' ? 1 : contentOpacity;

  return (
    <View pointerEvents={rootPointerEvents} style={styles.layer}>
      {focusRect ? (
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
        <Pressable style={styles.fullDim} onPress={onNext} />
      )}

      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: contentOpacity,
            transform: [{ translateY: contentTranslateY }],
          },
        ]}
      >
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
        />
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
              opacity: renderStep.hand === 'hold' ? holdOpacity : contentOpacity,
              transform: handTransform,
            },
          ]}
        />
      ) : null}

      <View style={styles.topBar} pointerEvents="box-none">
        <Pressable style={styles.closeButton} onPress={onSkip}>
          <Text style={[styles.closeText, { fontFamily }]}>Sluit</Text>
        </Pressable>
      </View>

      {(!renderStep.hideNextButton && (!renderStep.requiresAction || nextUnlocked)) ? (
        <View pointerEvents="box-none" style={[styles.nextButtonWrap, nextButtonPosition]}>
          <View style={styles.nextButtonSizer}>
            <GlossyButton
              label={renderStep.continueLabel ?? renderStep.actionLabel ?? 'Volgende'}
              variant="green"
              size="normal"
              heightOverride={50}
              horizontalPadding={26}
              labelFontScale={0.82}
              onPress={onNext}
            />
          </View>
        </View>
      ) : null}

      {hasAlternateAction ? (
        <View pointerEvents="box-none" style={styles.alternateButtonWrap}>
          <View style={styles.alternateButtonSizer}>
            <GlossyButton
              label={renderStep.alternateActionLabel}
              variant={renderStep.alternateActionVariant ?? 'red'}
              size="normal"
              heightOverride={50}
              horizontalPadding={20}
              labelFontScale={0.72}
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
}) {
  if (!step) {
    return null;
  }

  return (
    <>
      <ImageBackground
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
          },
        ]}
      >
        <View style={styles.bubbleTextBox}>
          <Text
            numberOfLines={4}
            adjustsFontSizeToFit
            minimumFontScale={0.62}
            style={[
              styles.bubbleText,
              { fontFamily },
            ]}
          >
            {step.text}
          </Text>
        </View>
      </ImageBackground>

      <Image
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
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  layer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9800,
    elevation: 9800,
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
    left: '22%',
    top: '30%',
    width: '48%',
    height: '32%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    color: '#111111',
    fontSize: 19,
    lineHeight: 24,
    textAlign: 'center',
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
  closeButton: {
    height: 42,
    minWidth: 82,
    borderRadius: 21,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.38)',
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    letterSpacing: 0,
  },
  nextButtonWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: 74,
  },
  nextButtonSizer: {
    width: '46%',
    minWidth: 156,
    maxWidth: 230,
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
    width: '62%',
    minWidth: 190,
    maxWidth: 280,
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
