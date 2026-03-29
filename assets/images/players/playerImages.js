// Centrale plek voor alle speler-afbeeldingen en kleurhex-waarden.
// require() moet statisch zijn in Metro — vandaar dit bestand.

export const PLAYER_IMAGES = {
  blauw:      require('./player-blauw.png'),
  geel:       require('./player-geel.png'),
  groen:      require('./player-groen.png'),
  lichtblauw: require('./player-lichtblauw.png'),
  oranje:     require('./player-oranje.png'),
  paars:      require('./player-paars.png'),
  rood:       require('./player-rood.png'),
  roze:       require('./player-roze.png'),
  wit:        require('./player-wit.png'),
  zwart:      require('./player-zwart.png'),
};

export const PLAYER_HEX = {
  blauw:      '#1A5EA8',
  geel:       '#F5C400',
  groen:      '#2E8B3F',
  lichtblauw: '#6EB5FF',
  oranje:     '#E8622A',
  paars:      '#8B2FC9',
  rood:       '#D93B2B',
  roze:       '#E8589E',
  wit:        '#C8C8C8',
  zwart:      '#2A2A2A',
};

export const ALLE_KLEUREN = [
  'rood', 'blauw', 'groen', 'geel',
  'oranje', 'paars', 'roze', 'lichtblauw',
  'zwart', 'wit',
];
