# AutoBingo — CLAUDE.md
> Dit bestand stuurt alle designbeslissingen in Claude Code. Lees dit eerst bij elke nieuwe taak.

---

## 🎯 App Filosofie: Anti-Brainrot

AutoBingo is bewust ontworpen als tegengif voor schermverslaving.
Het doel is kinderen naar buiten te laten kijken — de echte wereld in, niet dieper de telefoon in.

Dit heeft directe gevolgen voor hoe de app eruitziet en aanvoelt:

- **Geen oneindige scroll, geen autoplay, geen algoritmische spanning**
- **Beloningen zijn eerlijk** — een Bingo! is iets wat je écht verdient door te kijken
- **Rustige momenten zijn oké** — de app hoeft niet constant iets te doen
- **Cartoony maar kalm** — speels en warm, niet druk of overweldigend
- **Schermtijd is een middel, niet het doel** — de app verdwijnt als het spel klaar is

> Als een animatie of feature voelt als TikTok of een casino: verwijder hem.
> Als hij voelt als een kinderprentenboek of een gezelschapsspel: houd hem.

---

## 🎨 Visuele Identiteit

### Stijlrichting
De app voelt als een hoogwaardig kartonnen gezelschapsspel — warm, tastbaar, nostalgisch.
Denk aan een vintage wegbingo kaart uit de jaren 90: crème karton, duidelijke rasterlijnen, lieve illustraties.

Digitaal vertaald: **isometrisch, toy-like, Pixar-adjacent** — precies zoals de iconen.
Objecten hebben volume en diepte. Nooit flat. Nooit fotorealistisch.

### Lichtbron
Altijd vanuit linksboven. Bovenkant en linkerkant van elementen zijn lichter.
Onderkant en rechterkant zijn donkerder. Dit geldt voor knoppen, kaarten én iconen.

---

## 🎨 Kleurenpalet

| Naam         | Hex       | Gebruik                                      |
|--------------|-----------|----------------------------------------------|
| Crème        | `#EBF4E8` | Achtergrondkleur — de "karton" basiskleur     |
| Rood         | `#D93B2B` | Primaire accentkleur, CTA knoppen             |
| Blauw        | `#1A5EA8` | Cobalt blauw — vensters, secundaire elementen |
| Geel         | `#F5C400` | Golden yellow — accenten, wielen, highlights  |
| Groen        | `#2E8B3F` | Positieve feedback, succesmomenten            |
| Oranje       | `#E8622A` | Warmte-accent, secundaire knoppen             |
| Donkerblauw  | `#2D2B55` | Zware tekst, actieve states                   |
| Lichtblauw   | `#6EB5FF` | Zachte highlights, lichte achtergronden       |

**Gebruik nooit** pure zwart (#000000) of pure wit (#FFFFFF) als oppervlakten.
Gebruik `#2D2B55` voor donkere tekst en `#EBF4E8` of `#FFFDF7` voor lichte vlakken.

---

## ✏️ Typografie

| Gebruik         | Font           | Gewicht      |
|-----------------|----------------|--------------|
| Titels / Labels | Fredoka One    | Regular (400) — dit font heeft al karakter |
| Body tekst      | Nunito         | Bold (700)   |
| Kleine tekst    | Nunito         | SemiBold (600) |

- Nooit dunne weights (Light, Thin) — past niet bij de stijl
- Nooit system fonts of Inter/Roboto
- Letter spacing op titels: licht positief (+0.5 tot +1px) voor leesbaarheid

---

## 🧱 UI Componenten

### Knoppen
```
borderRadius: 20-24px
minHeight: 56px
paddingHorizontal: 24px
backgroundColor: #D93B2B (primair) of #F5C400 (secundair)

// Licht-donker effect alsof de knop volume heeft:
// Bovenkant iets lichter, onderkant iets donkerder
// Gebruik een subtiele box shadow naar onder, geen naar boven

shadowColor: '#2D2B55'
shadowOffset: { width: 0, height: 4 }
shadowOpacity: 0.2
shadowRadius: 6

// Altijd haptic feedback bij press
// Altijd scale animatie (zie Animaties)
```

### Kaarten / Panelen
```
backgroundColor: '#FFFDF7'        // Bijna wit, warmer dan wit
borderRadius: 20px
borderWidth: 2
borderColor: '#E8D5B0'            // Lichte karton-kleur rand

shadowColor: '#2D2B55'
shadowOffset: { width: 0, height: 6 }
shadowOpacity: 0.12
shadowRadius: 10
```

### Bingo kaart vakjes
```
backgroundColor: '#FFFDF7'
borderRadius: 12px
borderWidth: 1.5
borderColor: '#D4C4A0'            // Zachte rasterlijnen, als karton

// Afgevinkt:
backgroundColor: '#F5C400'        // Golden yellow fill
borderColor: '#D4A800'            // Iets donkerder geel

// Animatie bij aantikken: bounce + golden fill (zie Animaties)
```

### Headers
```
backgroundColor: themakleur       // Per thema anders
paddingTop: safe area inset
paddingHorizontal: 24px
paddingBottom: 16px

// Witte vette Fredoka One tekst
// Terug knop altijd linksboven als ← (witte kleur)
```

---

## ✨ Animaties

**Filosofie: beloningsgevoel zonder chaos.**
Animaties mogen speels zijn, maar nooit snel of druk. Denk aan een speelgoedauto die stevig beweegt, niet aan een TikTok-transitie.

```
// Scherm fade-in
opacity: 0 → 1
duration: 500ms
easing: easeOut

// Knop press
scale: 1 → 0.95 → 1
duration: 150ms
easing: easeInOut
// + Haptic impact (light)

// Vakje aantikken (bingo kaart)
scale: 1 → 1.15 → 1
duration: 300ms
easing: spring (damping 10, stiffness 200)
// + Kleurverandering naar golden yellow
// + Haptic impact (medium)

// BINGO! animatie
// Confetti burst + scale van de tekst + vrolijk geluid
// Scherm niet overspoeld — confetti kalmeert na 2 seconden vanzelf
// Geen looping animaties, geen pulserend scherm

// Mascotte animaties (Reanimated)
// idle: subtiele up-down beweging (2s loop, amplitude 4px)
// driving: lichte heen-weer wiebelbeweging
// bingo: kort enthousiaste sprong, daarna rust
```

**Gebruik altijd React Native Reanimated.**
Nooit `Animated` van React Native core.
Nooit abrupte overgangen. Altijd vloeiend en subtiel.

---

## 🖼️ Iconen & Illustraties

De iconen zijn isometrisch, three-quarter perspectief, toy-like.
Bij het bouwen van schermen: geef iconen altijd voldoende ruimte. Ze zijn het hart van de app.

```
// Icoon in bingo vakje:
width: 60-70% van het vakje
resizeMode: 'contain'
// Geen extra border of achtergrond achter het icoon
// Het icoon heeft zelf al transparante achtergrond

// Icoon in lijsten/selectie schermen:
// Lichte crème achtergrond (#EBF4E8) als "kaartje"
// borderRadius: 16px
// padding: 12px rondom icoon
```

---

## 📐 Layout & Spacing

```
// Scherm padding
paddingHorizontal: 24px
paddingTop: 16px (onder header)
paddingBottom: 24px + safe area

// Ruimte tussen elementen
gap / marginBottom: 16px standaard
                    24px tussen secties
                    8px binnen een sectie

// Bingo kaart grid
// 4x4 grid
// gap tussen vakjes: 8px
// Kaart neemt 90% van de schermbreedte in

// Nooit elementen op elkaar pressen
// Liever minder op het scherm dan te vol
```

---

## 🔊 Geluid & Feedback

```
// Aantikken vakje:    kort klik-geluidje + medium haptic
// Fout (al aangevinkt): nee-geluidje + warning haptic
// BINGO!:             vrolijk fanfare + confetti + success haptic
// Nieuw spel:         kort whoosh-geluidje

// Geluid altijd uit te zetten via instellingen
// Geen achtergrondmuziek (anti-brainrot principe)
// Haptic feedback altijd beschikbaar, ook zonder geluid
```

---

## 🏗️ App Structuur

```
// Framework
React Native + Expo (SDK 54)
Navigatie: React Navigation (Stack + Bottom Tab indien nodig)
Data: AsyncStorage voor lokale opslag (scores, instellingen, premium status)
Animaties: React Native Reanimated (NIET de oude Animated API)
Aankopen: RevenueCat (later)
Haptics: Expo Haptics
Geluid: Expo Audio

// Mappenstructuur
/screens      — schermcomponenten
/components   — herbruikbare UI componenten
/data         — themes.js en andere statische data
/assets       — iconen, fonts, geluiden
/hooks        — custom hooks (useHaptics, useSound, etc.)
```

---

## 💻 Code Stijl

- Clean en leesbare code
- Nederlandse commentaar en variabelenamen zijn prima
- Componenten in aparte bestanden in `/screens` of `/components`
- Geen onnodige dependencies toevoegen
- Stijl altijd via StyleSheet.create, nooit inline styles
- Elke screen heeft een fade-in animatie (zie Animaties)
- Elke knop heeft haptic feedback

---

## ⛔ Nooit Doen

- **Geen autoplay** van iets na een bingo — wacht op gebruikersinput
- **Geen pulserende elementen** die continu aandacht trekken
- **Geen neon kleuren** — niet bij de warme stijl
- **Geen flat design** — elementen hebben altijd volume en diepte
- **Geen American vehicle design** in iconen — Europees, compact, rond
- **Geen grijze wielen** op voertuigen — altijd golden yellow (#F5C400)
- **Geen outline/stroke** op iconen
- **Geen looping bingo-animatie** — het feest duurt even, dan is het klaar
- **Geen dark mode** (voorlopig) — crème achtergrond is de identiteit
- **Geen Inter, Roboto of system fonts**
