# UI Templates

Snelle referentie voor knoppen en circular fade-transities in AutoBingo.

## Glossy Knop

Gebruik altijd de gedeelde `GlossyButton` voor primaire acties, modal-acties en grote CTA's.

```jsx
import GlossyButton from '../src/components/GlossyButton';

<GlossyButton
  label="Start spel"
  variant="blue"
  size="large"
  disabled={!canContinue}
  onPress={handlePress}
  heightOverride={66}
  horizontalPadding={48}
  labelOffsetY={-1}
/>
```

Varianten:

- `blue`: navigatie, lobby aanmaken, start/continue acties.
- `green`: bevestigen, doorgaan, ja.
- `red`: annuleren, nee, stoppen, verwijderen.
- `yellow`: beloning, bingo, opvallende positieve actie.

Veelgebruikte maten:

```jsx
// Grote footer-CTA
<GlossyButton
  label="Start spel"
  variant="blue"
  size="large"
  heightOverride={66}
  onPress={handlePress}
/>

// Twee knoppen in een popup
<View style={styles.modalActions}>
  <View style={styles.modalActionButton}>
    <GlossyButton label="Nee" variant="red" heightOverride={54} onPress={onCancel} />
  </View>
  <View style={styles.modalActionButton}>
    <GlossyButton label="Ja" variant="green" heightOverride={54} onPress={onConfirm} />
  </View>
</View>
```

```jsx
modalActions: {
  flexDirection: 'row',
  gap: 14,
},
modalActionButton: {
  flex: 1,
},
```

## Circular Fade

Gebruik deze flow wanneer een knop het scherm moet vullen met zijn eigen kleur en daarna een route opent.

Patroon:

1. Start de lokale `CircularReveal` vanuit de tap-positie. Gebruik knopmidden alleen als fallback.
2. Start een lokale `CircularReveal` vanuit die knop.
3. Navigeer in `onComplete`.
4. Geef aan de volgende route een `transition` mee.
5. Zet de enter/uncover origin altijd op het schermmidden. Nieuwe pagina's openen nooit vanuit de oude klikpositie.

### Imports

```jsx
import { useEffect, useRef, useState } from 'react';
import { useWindowDimensions, View } from 'react-native';
import CircularReveal from '../components/CircularReveal';
```

Pas het importpad aan als het bestand dieper in `src/` staat.

### Helper

```jsx
function measureViewCenter(ref, fallback) {
  return new Promise((resolve) => {
    const node = ref.current;
    if (!node?.measureInWindow) {
      resolve(fallback);
      return;
    }

    node.measureInWindow((x, y, width, height) => {
      resolve({
        x: x + width / 2,
        y: y + height / 2,
      });
    });
  });
}
```

### Template

```jsx
const REVEAL_COLOR = '#1A7BD4';

function ExampleScreen({ navigation }) {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const actionButtonRef = useRef(null);
  const revealRef = useRef(null);
  const [pendingReveal, setPendingReveal] = useState(null);

  useEffect(() => {
    if (!pendingReveal) {
      return;
    }

    requestAnimationFrame(() => {
      revealRef.current?.reveal();
    });
  }, [pendingReveal]);

  async function handleActionPress(event) {
    if (pendingReveal) {
      return;
    }

    const origin = (
      typeof event?.nativeEvent?.pageX === 'number'
      && typeof event?.nativeEvent?.pageY === 'number'
    )
      ? { x: event.nativeEvent.pageX, y: event.nativeEvent.pageY }
      : await measureViewCenter(actionButtonRef, {
        x: screenWidth / 2,
        y: screenHeight / 2,
      });

    setPendingReveal({
      originX: origin.x,
      originY: origin.y,
      routeName: 'DoelRoute',
      transitionKey: `doelroute-${Date.now()}`,
      params: {
        // eigen route params hier
      },
    });
  }

  return (
    <>
      <View ref={actionButtonRef} collapsable={false}>
        <GlossyButton
          label="Open"
          variant="blue"
          disabled={Boolean(pendingReveal)}
          onPress={handleActionPress}
        />
      </View>

      {pendingReveal ? (
        <CircularReveal
          key={pendingReveal.transitionKey}
          ref={revealRef}
          color={REVEAL_COLOR}
          originX={pendingReveal.originX}
          originY={pendingReveal.originY}
          onComplete={() => {
            navigation.navigate(pendingReveal.routeName, {
              ...pendingReveal.params,
              transition: {
                color: REVEAL_COLOR,
                originX: screenWidth / 2,
                originY: screenHeight / 2,
                routeName: pendingReveal.routeName,
                pauseMs: 280,
                transitionKey: pendingReveal.transitionKey,
              },
            });
            setPendingReveal(null);
          }}
        />
      ) : null}
    </>
  );
}
```

### Variabelen Per Gebruik

- `REVEAL_COLOR`: kleur van de knop/reveal. Gebruik meestal de knopkleur.
- `actionButtonRef`: wrapper om de knop heen. Zet `collapsable={false}`, anders kan meten op Android falen.
- `originX` / `originY` op de lokale `CircularReveal`: waar de kleur begint. Gebruik de tap-positie via `event.nativeEvent.pageX/pageY`.
- `transition.originX` / `transition.originY`: waar de nieuwe pagina weer open/uncovered wordt. Gebruik altijd `screenWidth / 2` en `screenHeight / 2`.
- `routeName`: doelroute, bijvoorbeeld `'Lobby'` of `'Spel'`.
- `pauseMs`: wachttijd zodat assets/preload en de cover goed voelen. Meestal `220-320`.
- `transitionKey`: uniek per overgang, meestal `${routeName}-${Date.now()}`.

### Kleuren Die We Nu Gebruiken

```js
const CREATE_LOBBY_REVEAL_BLUE = '#1A7BD4';
const START_GAME_REVEAL_GREEN = '#159B3B';
```

Houd de reveal-kleur dicht bij de `GlossyButton` variant:

- `blue`: `#1A7BD4`
- `green`: `#159B3B`
- `red`: `#C01818` of `#E03030`
- `yellow`: `#F5C400`
