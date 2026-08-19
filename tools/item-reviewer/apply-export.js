const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const exportPath = process.argv[2];

if (!exportPath) {
  console.error('Usage: node tools/item-reviewer/apply-export.js <item-review-export.json>');
  process.exit(1);
}

const review = JSON.parse(fs.readFileSync(exportPath, 'utf8'));
const outputPath = path.join(root, 'screens', 'themeIcons.js');

const folderThemeIds = {
  Bergen: 'bergen',
  Platteland: 'platteland',
  Snelweg: 'snelweg',
  Vakantie: 'vakantie',
  Verkeersborden: 'verkeersborden',
  Voertuigen: 'voertuigen',
  Winter: 'winter',
  stad: 'stad',
};

const defaultBalanceByItemId = {
  'man op grasmaaier': { weight: 1 },
  quad: { weight: 1 },
  tractor: { weight: 5 },
};
const dutchTrainItemId = 'trein';
const genericTrainItemId = 'oranje trein';

function quote(value) {
  return JSON.stringify(value);
}

function toRequirePath(imagePath) {
  return imagePath.replace('../../assets/', '../assets/');
}

function getThemeIdFromImagePath(imagePath) {
  const parts = imagePath.split('/');
  const folder = parts[parts.length - 2];
  return folderThemeIds[folder] ?? null;
}

function normalizeWeight(value, itemId) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return defaultBalanceByItemId[itemId]?.weight ?? 3;
  }

  if (numericValue <= 1.5 && !Number.isInteger(numericValue)) {
    if (numericValue < 0.85) {
      return 1;
    }
    if (numericValue > 1.2) {
      return 5;
    }
    return 3;
  }

  return Math.max(1, Math.min(5, Math.round(numericValue)));
}

function normalizeThemeWeights(themeWeights, itemId) {
  if (!themeWeights || typeof themeWeights !== 'object' || Array.isArray(themeWeights)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(themeWeights)
      .map(([themeId, weight]) => [themeId, normalizeWeight(weight, itemId)])
      .filter(([themeId]) => typeof themeId === 'string' && themeId.length > 0),
  );
}

function buildItem(item) {
  const activeThemes = [...new Set(item.themes ?? [])];
  const excludedThemes = [...new Set(item.excludedThemes ?? [])];
  const weight = normalizeWeight(item.weight, item.id);
  const themeWeights = Object.fromEntries(
    Object.entries(normalizeThemeWeights(item.themeWeights, item.id))
      .filter(([themeId]) => activeThemes.includes(themeId)),
  );
  const images = (item.images ?? []).map((imagePath) => ({
    themeId: getThemeIdFromImagePath(imagePath),
    requirePath: toRequirePath(imagePath),
  }));
  const defaultImage = images[0];
  const iconsByTheme = new Map();

  for (const image of images) {
    if (image.themeId && !iconsByTheme.has(image.themeId)) {
      iconsByTheme.set(image.themeId, image.requirePath);
    }
  }

  return {
    id: item.id,
    name: item.name,
    themes: activeThemes,
    excludedThemes,
    weight,
    themeWeights,
    nederlands: item.nederlands === true,
    defaultIcon: defaultImage.requirePath,
    generalIcon: null,
    iconsByTheme,
  };
}

function mergeGenericTrainIntoDutchTrain(catalogItems) {
  const dutchTrain = catalogItems.find((item) => item.id === dutchTrainItemId);
  const genericTrain = catalogItems.find((item) => item.id === genericTrainItemId);

  if (!dutchTrain || !genericTrain) {
    return catalogItems;
  }

  dutchTrain.name = 'trein';
  dutchTrain.generalIcon = genericTrain.defaultIcon;
  dutchTrain.themes = [...new Set([...dutchTrain.themes, ...genericTrain.themes])];
  dutchTrain.excludedThemes = [...new Set([...dutchTrain.excludedThemes, ...genericTrain.excludedThemes])];
  dutchTrain.weight = Math.max(dutchTrain.weight, genericTrain.weight);
  dutchTrain.themeWeights = {
    ...genericTrain.themeWeights,
    ...dutchTrain.themeWeights,
  };

  return catalogItems.filter((item) => item.id !== genericTrainItemId);
}

const items = mergeGenericTrainIntoDutchTrain(review.items
  .filter((item) => !item.removed)
  .map(buildItem))
  .sort((left, right) => left.name.localeCompare(right.name, 'nl'));

const lines = [];
lines.push('// Generated from item-review-export.json by tools/item-reviewer/apply-export.js.');
lines.push('// Keep require() calls static so React Native can bundle the item images.');
lines.push('const ITEM_CATALOG = [');

for (const item of items) {
  lines.push('  {');
  lines.push(`    id: ${quote(item.id)},`);
  lines.push(`    name: ${quote(item.name)},`);
  lines.push(`    themes: ${quote(item.themes)},`);
  lines.push(`    excludedThemes: ${quote(item.excludedThemes)},`);
  lines.push(`    weight: ${item.weight},`);
  lines.push(`    themeWeights: ${quote(item.themeWeights)},`);
  lines.push(`    defaultIcon: require(${quote(item.defaultIcon)}),`);
  if (item.generalIcon) {
    lines.push(`    generalIcon: require(${quote(item.generalIcon)}),`);
  }
  lines.push('    iconsByTheme: {');
  for (const [themeId, requirePath] of item.iconsByTheme.entries()) {
    lines.push(`      ${themeId}: require(${quote(requirePath)}),`);
  }
  lines.push('    },');
  lines.push('  },');
}

lines.push('];');
lines.push('');
lines.push('const GENERAL_THEME_ID = \'algemeen\';');
lines.push('const THEME_SPECIFIC_RATIO = 0.6;');
lines.push('const DEFAULT_DIFFICULTY_MIX = { easy: 9, medium: 5, hard: 2 };');
lines.push('const BOARD_4X4_BLOCKER_POSITIONS = [10, 12, 7, 1, 4, 13, 15];');
lines.push('const MIX_LIMITS_BY_THEME = {');
lines.push('  default: { verkeersborden: 3, voertuigen: 4 },');
lines.push('  verkeersborden: { voertuigen: 4 },');
lines.push('  voertuigen: { verkeersborden: 3 },');
lines.push('};');
lines.push('const NETHERLANDS_SPECIFIC_ITEM_IDS = new Set([');
for (const item of items.filter((entry) => entry.nederlands)) {
  lines.push(`  ${quote(item.id)},`);
}
lines.push(']);');
lines.push('');
lines.push('function isItemExplicitlyInTheme(item, theme) {');
lines.push('  return item.themes.includes(theme);');
lines.push('}');
lines.push('');
lines.push('function isItemAvailableForTheme(item, theme) {');
lines.push('  if (theme === GENERAL_THEME_ID) {');
lines.push('    return isItemExplicitlyInTheme(item, GENERAL_THEME_ID);');
lines.push('  }');
lines.push('');
lines.push('  if (item.excludedThemes.includes(theme)) {');
lines.push('    return false;');
lines.push('  }');
lines.push('');
lines.push('  return isItemExplicitlyInTheme(item, theme) || isItemExplicitlyInTheme(item, GENERAL_THEME_ID);');
lines.push('}');
lines.push('');
lines.push('function getIconForTheme(item, theme, options = {}) {');
lines.push('  if (options.nederlands === false && item.generalIcon) {');
lines.push('    return item.generalIcon;');
lines.push('  }');
lines.push('');
lines.push('  return item.iconsByTheme[theme] ?? item.defaultIcon;');
lines.push('}');
lines.push('');
lines.push('function includeItemForOptions(item, options = {}) {');
lines.push('  return options.nederlands !== false || !NETHERLANDS_SPECIFIC_ITEM_IDS.has(item.id) || Boolean(item.generalIcon);');
lines.push('}');
lines.push('');
lines.push('export function getThemeItems(theme, options = {}) {');
lines.push('  const resolvedTheme = theme || \'snelweg\';');
lines.push('  const directItems = ITEM_CATALOG.filter((item) => (');
lines.push('    isItemAvailableForTheme(item, resolvedTheme) && includeItemForOptions(item, options)');
lines.push('  ));');
lines.push('');
lines.push('  if (directItems.length > 0) {');
lines.push('    return directItems;');
lines.push('  }');
lines.push('');
lines.push('  return ITEM_CATALOG.filter((item) => (');
lines.push('    isItemAvailableForTheme(item, \'snelweg\') && includeItemForOptions(item, options)');
lines.push('  ));');
lines.push('}');
lines.push('');
lines.push('export function getThemeIcons(theme, options = {}) {');
lines.push('  const resolvedTheme = theme || \'snelweg\';');
lines.push('  return getThemeItems(resolvedTheme, options).map((item) => getIconForTheme(item, resolvedTheme, options));');
lines.push('}');
lines.push('');
lines.push('function createSeededRandom(seed = 0) {');
lines.push('  let state = seed >>> 0;');
lines.push('');
lines.push('  return function seededRandom() {');
lines.push('    state = (state * 1664525 + 1013904223) >>> 0;');
lines.push('    return state / 4294967296;');
lines.push('  };');
lines.push('}');
lines.push('');
lines.push('function shuffleWithSeed(items, seed) {');
lines.push('  const next = [...items];');
lines.push('  const random = createSeededRandom(seed);');
lines.push('');
lines.push('  for (let index = next.length - 1; index > 0; index -= 1) {');
lines.push('    const swapIndex = Math.floor(random() * (index + 1));');
lines.push('    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];');
lines.push('  }');
lines.push('');
lines.push('  return next;');
lines.push('}');
lines.push('');
lines.push('function getRecentItemPenalty(item, options = {}) {');
lines.push('  const recentItemIds = Array.isArray(options.recentItemIds) ? options.recentItemIds : [];');
lines.push('  const recentIndex = recentItemIds.indexOf(item.id);');
lines.push('');
lines.push('  if (recentIndex < 0) {');
lines.push('    return 1;');
lines.push('  }');
lines.push('');
lines.push('  return recentIndex < 16 ? 0.32 : 0.58;');
lines.push('}');
lines.push('');
lines.push('function getThemeSelectionWeight(item, theme) {');
lines.push('  return item.themeWeights[theme] ?? item.weight;');
lines.push('}');
lines.push('');
lines.push('function getItemSelectionWeight(item, theme, options = {}) {');
lines.push('  return Math.max(0.05, (getThemeSelectionWeight(item, theme) / 3) * getRecentItemPenalty(item, options));');
lines.push('}');
lines.push('');
lines.push('function getDifficultyBucket(item, theme) {');
lines.push('  const weight = getThemeSelectionWeight(item, theme);');
lines.push('');
lines.push('  if (weight >= 4) {');
lines.push('    return \'easy\';');
lines.push('  }');
lines.push('');
lines.push('  if (weight <= 2) {');
lines.push('    return \'hard\';');
lines.push('  }');
lines.push('');
lines.push('  return \'medium\';');
lines.push('}');
lines.push('');
lines.push('function getDifficultyTargets(count) {');
lines.push('  if (count === 16) {');
lines.push('    return { ...DEFAULT_DIFFICULTY_MIX };');
lines.push('  }');
lines.push('');
lines.push('  if (count <= 3) {');
lines.push('    return { easy: count, medium: 0, hard: 0 };');
lines.push('  }');
lines.push('');
lines.push('  const hard = Math.max(1, Math.round(count * 0.125));');
lines.push('  const easy = Math.max(1, Math.round(count * 0.56));');
lines.push('  return { easy, medium: Math.max(0, count - easy - hard), hard };');
lines.push('}');
lines.push('');
lines.push('function splitByDifficulty(items, theme) {');
lines.push('  return items.reduce((groups, item) => {');
lines.push('    groups[getDifficultyBucket(item, theme)].push(item);');
lines.push('    return groups;');
lines.push('  }, { easy: [], medium: [], hard: [] });');
lines.push('}');
lines.push('');
lines.push('function weightedShuffleWithSeed(items, seed, theme, options = {}) {');
lines.push('  const random = createSeededRandom(seed);');
lines.push('');
lines.push('  return [...items]');
lines.push('    .map((item) => ({');
lines.push('      item,');
lines.push('      rank: Math.log(Math.max(random(), 0.0000001)) / getItemSelectionWeight(item, theme, options),');
lines.push('    }))');
lines.push('    .sort((left, right) => {');
lines.push('      const rankDifference = right.rank - left.rank;');
lines.push('      if (rankDifference !== 0) {');
lines.push('        return rankDifference;');
lines.push('      }');
lines.push('');
lines.push('      return left.item.id.localeCompare(right.item.id);');
lines.push('    })');
lines.push('    .map((entry) => entry.item);');
lines.push('}');
lines.push('');
lines.push('function getBucketSeedOffset(bucket) {');
lines.push('  return bucket === \'easy\' ? 17 : bucket === \'medium\' ? 31 : 47;');
lines.push('}');
lines.push('');
lines.push('function appendBucketItems(target, candidates, desiredCount, theme, seed, options = {}) {');
lines.push('  if (desiredCount <= 0) {');
lines.push('    return target;');
lines.push('  }');
lines.push('');
lines.push('  const shuffledThemeItems = weightedShuffleWithSeed(');
lines.push('    candidates.filter((item) => isItemExplicitlyInTheme(item, theme)),');
lines.push('    seed,');
lines.push('    theme,');
lines.push('    options');
lines.push('  );');
lines.push('  const shuffledGeneralItems = weightedShuffleWithSeed(');
lines.push('    candidates.filter((item) => (');
lines.push('      isItemExplicitlyInTheme(item, GENERAL_THEME_ID) && !isItemExplicitlyInTheme(item, theme)');
lines.push('    )),');
lines.push('    seed + 101,');
lines.push('    theme,');
lines.push('    options');
lines.push('  );');
lines.push('  const shuffledFallbackItems = weightedShuffleWithSeed(candidates, seed + 202, theme, options);');
lines.push('  const targetLength = target.length + desiredCount;');
lines.push('  const themeTargetLength = target.length + Math.ceil(desiredCount * THEME_SPECIFIC_RATIO);');
lines.push('');
lines.push('  appendBalancedUniqueItems(target, shuffledThemeItems, themeTargetLength, theme);');
lines.push('  appendBalancedUniqueItems(target, shuffledGeneralItems, targetLength, theme);');
lines.push('  appendBalancedUniqueItems(target, shuffledThemeItems, targetLength, theme);');
lines.push('  appendBalancedUniqueItems(target, shuffledFallbackItems, targetLength, theme);');
lines.push('');
lines.push('  return target;');
lines.push('}');
lines.push('');
lines.push('function selectBalancedItemsByDifficulty(availableItems, theme, count, seed, options = {}) {');
lines.push('  const targets = getDifficultyTargets(count);');
lines.push('  const groups = splitByDifficulty(availableItems, theme);');
lines.push('  const selectedItems = [];');
lines.push('');
lines.push('  for (const bucket of [\'easy\', \'medium\', \'hard\']) {');
lines.push('    appendBucketItems(');
lines.push('      selectedItems,');
lines.push('      groups[bucket],');
lines.push('      targets[bucket],');
lines.push('      theme,');
lines.push('      seed + getBucketSeedOffset(bucket),');
lines.push('      options');
lines.push('    );');
lines.push('  }');
lines.push('');
lines.push('  if (selectedItems.length < count) {');
lines.push('    appendBalancedUniqueItems(');
lines.push('      selectedItems,');
lines.push('      weightedShuffleWithSeed(availableItems, seed + 303, theme, options),');
lines.push('      count,');
lines.push('      theme');
lines.push('    );');
lines.push('  }');
lines.push('');
lines.push('  if (selectedItems.length < count) {');
lines.push('    appendUniqueItems(');
lines.push('      selectedItems,');
lines.push('      weightedShuffleWithSeed(availableItems, seed + 404, theme, options),');
lines.push('      count');
lines.push('    );');
lines.push('  }');
lines.push('');
lines.push('  return selectedItems.slice(0, count);');
lines.push('}');
lines.push('');
lines.push('function arrangeItemsForBoard(selectedItems, theme, seed) {');
lines.push('  if (selectedItems.length !== 16) {');
lines.push('    return shuffleWithSeed(selectedItems, seed + 505);');
lines.push('  }');
lines.push('');
lines.push('  const hardItems = selectedItems.filter((item) => getDifficultyBucket(item, theme) === \'hard\');');
lines.push('  const mediumItems = selectedItems.filter((item) => getDifficultyBucket(item, theme) === \'medium\');');
lines.push('  const easyItems = selectedItems.filter((item) => getDifficultyBucket(item, theme) === \'easy\');');
lines.push('  const blockers = shuffleWithSeed([...hardItems, ...mediumItems], seed + 606);');
lines.push('  const easyQueue = shuffleWithSeed(easyItems, seed + 707);');
lines.push('  const board = Array(16).fill(null);');
lines.push('');
lines.push('  for (let index = 0; index < BOARD_4X4_BLOCKER_POSITIONS.length && blockers.length > 0; index += 1) {');
lines.push('    board[BOARD_4X4_BLOCKER_POSITIONS[index]] = blockers.shift();');
lines.push('  }');
lines.push('');
lines.push('  for (let index = 0; index < board.length; index += 1) {');
lines.push('    if (!board[index]) {');
lines.push('      board[index] = easyQueue.shift() ?? blockers.shift() ?? null;');
lines.push('    }');
lines.push('  }');
lines.push('');
lines.push('  return board.filter(Boolean);');
lines.push('}');
lines.push('');
lines.push('function appendUniqueItems(target, candidates, limit) {');
lines.push('  const usedIds = new Set(target.map((item) => item.id));');
lines.push('');
lines.push('  for (const item of candidates) {');
lines.push('    if (target.length >= limit) {');
lines.push('      break;');
lines.push('    }');
lines.push('');
lines.push('    if (!usedIds.has(item.id)) {');
lines.push('      target.push(item);');
lines.push('      usedIds.add(item.id);');
lines.push('    }');
lines.push('  }');
lines.push('');
lines.push('  return target;');
lines.push('}');
lines.push('');
lines.push('function getMixCategory(item, theme) {');
lines.push('  if (theme !== \'verkeersborden\' && item.themes.includes(\'verkeersborden\')) {');
lines.push('    return \'verkeersborden\';');
lines.push('  }');
lines.push('');
lines.push('  if (theme !== \'voertuigen\' && item.themes.includes(\'voertuigen\')) {');
lines.push('    return \'voertuigen\';');
lines.push('  }');
lines.push('');
lines.push('  return \'basis\';');
lines.push('}');
lines.push('');
lines.push('function getMixLimits(theme) {');
lines.push('  return MIX_LIMITS_BY_THEME[theme] ?? MIX_LIMITS_BY_THEME.default;');
lines.push('}');
lines.push('');
lines.push('function createMixCounts(items, theme) {');
lines.push('  return items.reduce((counts, item) => {');
lines.push('    const category = getMixCategory(item, theme);');
lines.push('    counts[category] = (counts[category] ?? 0) + 1;');
lines.push('    return counts;');
lines.push('  }, {});');
lines.push('}');
lines.push('');
lines.push('function canAppendForMix(item, theme, counts, limits) {');
lines.push('  const category = getMixCategory(item, theme);');
lines.push('  const limit = limits[category];');
lines.push('  return typeof limit !== \'number\' || (counts[category] ?? 0) < limit;');
lines.push('}');
lines.push('');
lines.push('function appendBalancedUniqueItems(target, candidates, limit, theme) {');
lines.push('  const usedIds = new Set(target.map((item) => item.id));');
lines.push('  const limits = getMixLimits(theme);');
lines.push('  const counts = createMixCounts(target, theme);');
lines.push('');
lines.push('  for (const item of candidates) {');
lines.push('    if (target.length >= limit) {');
lines.push('      break;');
lines.push('    }');
lines.push('');
lines.push('    if (usedIds.has(item.id) || !canAppendForMix(item, theme, counts, limits)) {');
lines.push('      continue;');
lines.push('    }');
lines.push('');
lines.push('    const category = getMixCategory(item, theme);');
lines.push('    target.push(item);');
lines.push('    usedIds.add(item.id);');
lines.push('    counts[category] = (counts[category] ?? 0) + 1;');
lines.push('  }');
lines.push('');
lines.push('  return target;');
lines.push('}');
lines.push('');
lines.push('export function getRandomItems(theme, count = 16, seed = 0, options = {}) {');
lines.push('  const resolvedTheme = theme || \'snelweg\';');
lines.push('  const availableItems = getThemeItems(resolvedTheme, options);');
lines.push('');
lines.push('  if (availableItems.length === 0) {');
lines.push('    return [];');
lines.push('  }');
lines.push('');
lines.push('  const selectedItems = selectBalancedItemsByDifficulty(availableItems, resolvedTheme, count, seed, options);');
lines.push('  const arrangedItems = arrangeItemsForBoard(selectedItems, resolvedTheme, seed);');
lines.push('');
lines.push('  return arrangedItems.slice(0, count).map((item) => ({');
lines.push('    id: item.id,');
lines.push('    icon: getIconForTheme(item, resolvedTheme, options),');
lines.push('  }));');
lines.push('}');
lines.push('');
lines.push('export function getRandomIcons(theme, count = 16, seed = 0, options = {}) {');
lines.push('  return getRandomItems(theme, count, seed, options).map((item) => item.icon);');
lines.push('}');
lines.push('');

fs.writeFileSync(outputPath, `${lines.join('\n')}`);
console.log(`Wrote ${items.length} active catalog items to ${path.relative(root, outputPath)}`);
