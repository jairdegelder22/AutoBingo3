const data = window.ITEM_REVIEW_DATA;
const storageKey = 'autobingo-item-review-v1';

const els = {
  progressText: document.querySelector('#progressText'),
  savedText: document.querySelector('#savedText'),
  progressFill: document.querySelector('#progressFill'),
  itemImage: document.querySelector('#itemImage'),
  prevButton: document.querySelector('#prevButton'),
  nextButton: document.querySelector('#nextButton'),
  itemName: document.querySelector('#itemName'),
  fileName: document.querySelector('#fileName'),
  imageWrap: document.querySelector('.image-wrap'),
  imageVariants: document.querySelector('#imageVariants'),
  removedNotice: document.querySelector('#removedNotice'),
  themeButtons: document.querySelector('#themeButtons'),
  resetItemButton: document.querySelector('#resetItemButton'),
  removeItemButton: document.querySelector('#removeItemButton'),
  downloadButton: document.querySelector('#downloadButton'),
  approveButton: document.querySelector('#approveButton'),
};

let currentIndex = 0;
let currentImageIndex = 0;
let reviewState = loadState();

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey));
    if (parsed && parsed.items) {
      return parsed;
    }
  } catch (error) {
    console.warn('Kon lokale review-state niet lezen.', error);
  }

  return {
    updatedAt: null,
    items: Object.fromEntries(
      data.items.map((item) => [
        item.id,
        {
          name: item.name,
          themes: [...item.themes],
          removed: false,
          approved: false,
        },
      ]),
    ),
  };
}

function saveState() {
  reviewState.updatedAt = new Date().toISOString();
  localStorage.setItem(storageKey, JSON.stringify(reviewState));
}

function getItemState(item) {
  if (!reviewState.items[item.id]) {
    reviewState.items[item.id] = {
      name: item.name,
      themes: [...item.themes],
      removed: false,
      approved: false,
    };
  }
  if (typeof reviewState.items[item.id].removed !== 'boolean') {
    reviewState.items[item.id].removed = false;
  }
  return reviewState.items[item.id];
}

function render() {
  const item = data.items[currentIndex];
  const state = getItemState(item);
  const image = item.images[currentImageIndex] || item.images[0];
  const approvedCount = data.items.filter((entry) => getItemState(entry).approved).length;

  els.progressText.textContent = `${currentIndex + 1} / ${data.items.length}`;
  els.savedText.textContent = `${approvedCount} akkoord`;
  els.progressFill.style.width = `${Math.round((approvedCount / data.items.length) * 100)}%`;
  els.itemImage.src = image.path;
  els.itemImage.alt = state.name;
  els.itemName.value = state.name;
  els.fileName.textContent = `${image.sourceFolder}/${image.filename}`;
  els.imageWrap.classList.toggle('removed', state.removed);
  els.removedNotice.hidden = !state.removed;

  els.prevButton.disabled = currentIndex === 0;
  els.nextButton.disabled = currentIndex === data.items.length - 1;
  els.removeItemButton.classList.toggle('active', state.removed);
  els.removeItemButton.textContent = state.removed ? 'Herstel item' : 'Verwijder item';
  els.removeItemButton.setAttribute('aria-pressed', String(state.removed));
  els.approveButton.textContent = state.approved ? 'Bijwerken' : 'Akkoord';

  renderImageVariants(item);
  renderThemeButtons(item, state);
}

function renderImageVariants(item) {
  els.imageVariants.innerHTML = '';
  if (item.images.length <= 1) {
    return;
  }

  item.images.forEach((image, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `variant-button${index === currentImageIndex ? ' active' : ''}`;
    button.textContent = image.themeLabel;
    button.addEventListener('click', () => {
      currentImageIndex = index;
      render();
    });
    els.imageVariants.appendChild(button);
  });
}

function renderThemeButtons(item, state) {
  els.themeButtons.innerHTML = '';
  data.themes.forEach((theme) => {
    const button = document.createElement('button');
    const isActive = state.themes.includes(theme.id);
    button.type = 'button';
    button.className = `theme-toggle${isActive ? ' active' : ''}`;
    button.textContent = theme.label;
    button.disabled = state.removed;
    button.setAttribute('aria-pressed', String(isActive));
    button.addEventListener('click', () => {
      toggleTheme(item, theme.id);
    });
    els.themeButtons.appendChild(button);
  });
}

function toggleTheme(item, themeId) {
  const state = getItemState(item);
  if (state.themes.includes(themeId)) {
    state.themes = state.themes.filter((id) => id !== themeId);
  } else {
    state.themes = [...state.themes, themeId];
  }
  state.approved = false;
  saveState();
  render();
}

function toggleRemoved() {
  const item = data.items[currentIndex];
  const state = getItemState(item);
  state.removed = !state.removed;
  state.approved = false;
  saveState();
  render();
}

function approveCurrentItem() {
  const item = data.items[currentIndex];
  const state = getItemState(item);
  state.name = els.itemName.value.trim() || item.name;
  state.approved = true;
  saveState();

  if (currentIndex < data.items.length - 1) {
    currentIndex += 1;
    currentImageIndex = 0;
  }
  render();
}

function move(delta) {
  const nextIndex = currentIndex + delta;
  if (nextIndex < 0 || nextIndex >= data.items.length) {
    return;
  }
  currentIndex = nextIndex;
  currentImageIndex = 0;
  render();
}

function resetCurrentItem() {
  const item = data.items[currentIndex];
  reviewState.items[item.id] = {
    name: item.name,
    themes: [...item.themes],
    removed: false,
    approved: false,
  };
  saveState();
  render();
}

function downloadExport() {
  const reviewedItems = data.items.map((item) => {
    const state = getItemState(item);
    return {
      id: item.id,
      name: state.name,
      originalName: item.name,
      themes: data.themes.map((theme) => theme.id).filter((themeId) => state.themes.includes(themeId)),
      originalThemes: item.originalThemes,
      images: item.images.map((image) => image.path),
      removed: state.removed,
      approved: state.approved,
    };
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    themes: data.themes,
    items: reviewedItems,
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'item-review-export.json';
  link.click();
  URL.revokeObjectURL(url);
}

els.itemName.addEventListener('input', () => {
  const item = data.items[currentIndex];
  const state = getItemState(item);
  state.name = els.itemName.value;
  state.approved = false;
  saveState();
});

els.prevButton.addEventListener('click', () => move(-1));
els.nextButton.addEventListener('click', () => move(1));
els.resetItemButton.addEventListener('click', resetCurrentItem);
els.removeItemButton.addEventListener('click', toggleRemoved);
els.downloadButton.addEventListener('click', downloadExport);
els.approveButton.addEventListener('click', approveCurrentItem);

document.addEventListener('keydown', (event) => {
  if (event.target === els.itemName) {
    return;
  }
  if (event.key === 'ArrowLeft') {
    move(-1);
  }
  if (event.key === 'ArrowRight') {
    move(1);
  }
  if (event.key === 'Enter') {
    approveCurrentItem();
  }
});

render();
