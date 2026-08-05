const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const imagesRoot = path.join(root, 'assets', 'images');
const outputPath = path.join(__dirname, 'items.js');
const newItemsFolder = 'NieuweItems';
const netherlandsSpecificItemIds = new Set([
  'ambulance',
  'brandweerauto',
  'brievenbus',
  'fietspad',
  'fietspaddestoel',
  'nederlandse vlag',
  'politie auto',
  'politieagent',
  'trein',
  'victor veilig',
  'weg met groene lijn',
]);

const themes = [
  { id: 'algemeen', label: 'Algemeen' },
  { id: 'snelweg', label: 'Snelweg', folder: 'Snelweg' },
  { id: 'stad', label: 'Stad', folder: 'stad' },
  { id: 'platteland', label: 'Platteland', folder: 'Platteland' },
  { id: 'vakantie', label: 'Vakantie', folder: 'Vakantie' },
  { id: 'winter', label: 'Winter', folder: 'Winter' },
  { id: 'bergen', label: 'Bergen', folder: 'Bergen' },
  { id: 'voertuigen', label: 'Voertuigen', folder: 'Voertuigen' },
  { id: 'verkeersborden', label: 'Verkeersborden', folder: 'Verkeersborden' },
];

const itemThemeFolders = themes.filter((theme) => theme.folder);
const byName = new Map();

function getDisplayName(file) {
  return path.basename(file, path.extname(file)).replace(/-/g, ' ');
}

function createItem(id, name) {
  return {
    id,
    name,
    originalNames: [name],
    originalThemes: [],
    themes: [],
    nederlands: netherlandsSpecificItemIds.has(id),
    isNew: false,
    images: [],
  };
}

for (const theme of itemThemeFolders) {
  const folderPath = path.join(imagesRoot, theme.folder);
  if (!fs.existsSync(folderPath)) {
    continue;
  }

  const files = fs
    .readdirSync(folderPath)
    .filter((file) => file.toLowerCase().endsWith('.png'))
    .sort((left, right) => left.localeCompare(right, 'nl'));

  for (const file of files) {
    const baseName = getDisplayName(file);
    const id = baseName.toLowerCase();
    const imagePath = `../../assets/images/${theme.folder}/${file}`;

    if (!byName.has(id)) {
      byName.set(id, createItem(id, baseName));
    }

    const item = byName.get(id);
    if (!item.originalThemes.includes(theme.id)) {
      item.originalThemes.push(theme.id);
    }
    if (!item.themes.includes(theme.id)) {
      item.themes.push(theme.id);
    }
    if (!item.images.some((image) => image.path === imagePath)) {
      item.images.push({
        themeId: theme.id,
        themeLabel: theme.label,
        path: imagePath,
        filename: file,
        sourceFolder: theme.folder,
      });
    }
  }
}

const newItemsPath = path.join(imagesRoot, newItemsFolder);
if (fs.existsSync(newItemsPath)) {
  const files = fs
    .readdirSync(newItemsPath)
    .filter((file) => file.toLowerCase().endsWith('.png'))
    .sort((left, right) => left.localeCompare(right, 'nl'));

  for (const file of files) {
    const baseName = getDisplayName(file);
    const id = baseName.toLowerCase();
    const imagePath = `../../assets/images/${newItemsFolder}/${file}`;

    if (!byName.has(id)) {
      byName.set(id, createItem(id, baseName));
    }

    const item = byName.get(id);
    item.isNew = true;
    item.images.push({
      themeId: null,
      themeLabel: 'Nieuw',
      path: imagePath,
      filename: file,
      sourceFolder: newItemsFolder,
    });
  }
}

const items = Array.from(byName.values()).sort((left, right) => {
  if (left.isNew !== right.isNew) {
    return left.isNew ? -1 : 1;
  }
  return left.name.localeCompare(right.name, 'nl');
});

const body = `window.ITEM_REVIEW_DATA = ${JSON.stringify(
  {
    generatedAt: new Date().toISOString(),
    themes: themes.map(({ id, label }) => ({ id, label })),
    items,
  },
  null,
  2,
)};\n`;

fs.writeFileSync(outputPath, body);
console.log(`Wrote ${items.length} grouped items to ${path.relative(root, outputPath)}`);
