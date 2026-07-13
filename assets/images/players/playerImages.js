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
  regenboog:  require('./player-regenboog.png'),
  koe:        require('./player-koe.png'),
  kerst:      require('./player-kerst.png'),
  politie:    require('./player-politie.png'),
  ambulance:  require('./player-ambulance.png'),
  brandweer:  require('./player-brandweer.png'),
  brons:      require('./player-brons.png'),
  zilver:     require('./player-zilver.png'),
  goud:       require('./player-goud.png'),
  kat:        require('./player-kat.png'),
  hond:       require('./player-hond.png'),
  hartjes:    require('./player-hartjes.png'),
  taxi:       require('./player-taxi.png'),
  vlammen:    require('./player-vlammen.png'),
};

export const PLAYER_ADD_SILHOUETTE_IMAGE = require('./player-add-silhouette.png');
export const PLAYER_FUTURE_SKIN_IMAGE = require('./player-silhouette.png');

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
  regenboog:  '#F25C9B',
  koe:        '#4B5563',
  kerst:      '#1D9A55',
  politie:    '#1A5EA8',
  ambulance:  '#F5F5F5',
  brandweer:  '#D93B2B',
  brons:      '#B87333',
  zilver:     '#AEB7C2',
  goud:       '#E5B73B',
  kat:        '#7C4A2D',
  hond:       '#A46A3F',
  hartjes:    '#E8589E',
  taxi:       '#F5C400',
  vlammen:    '#F06423',
};

export const ALLE_KLEUREN = [
  'rood', 'blauw', 'groen', 'geel',
  'oranje', 'paars', 'roze', 'lichtblauw',
  'zwart', 'wit',
];
