const params = new URLSearchParams(window.location.search);
const showNewItemsOnly = params.get('nieuw') === '1';
const storageKey = 'autobingo-item-review-v2';
const weightChoices = [
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5' },
];
const defaultBalanceByItemId = {
  'man op grasmaaier': { weight: 1 },
  quad: { weight: 1 },
  tractor: { weight: 5 },
};
let data = normalizeData(window.ITEM_REVIEW_DATA);

const els = {
  progressText: document.querySelector('#progressText'),
  savedText: document.querySelector('#savedText'),
  progressFill: document.querySelector('#progressFill'),
  jsonUpload: document.querySelector('#jsonUpload'),
  overviewButton: document.querySelector('#overviewButton'),
  overviewPanel: document.querySelector('#overviewPanel'),
  overviewSearch: document.querySelector('#overviewSearch'),
  overviewThemeFilter: document.querySelector('#overviewThemeFilter'),
  overviewStatusFilter: document.querySelector('#overviewStatusFilter'),
  overviewList: document.querySelector('#overviewList'),
  overviewEmpty: document.querySelector('#overviewEmpty'),
  overviewEditorBody: document.querySelector('#overviewEditorBody'),
  overviewImage: document.querySelector('#overviewImage'),
  overviewName: document.querySelector('#overviewName'),
  overviewFile: document.querySelector('#overviewFile'),
  overviewWeightButtons: document.querySelector('#overviewWeightButtons'),
  overviewThemeWeightButtons: document.querySelector('#overviewThemeWeightButtons'),
  overviewDutchButton: document.querySelector('#overviewDutchButton'),
  overviewRemoveButton: document.querySelector('#overviewRemoveButton'),
  overviewThemeButtons: document.querySelector('#overviewThemeButtons'),
  overviewExcludeButtons: document.querySelector('#overviewExcludeButtons'),
  itemImage: document.querySelector('#itemImage'),
  prevButton: document.querySelector('#prevButton'),
  nextButton: document.querySelector('#nextButton'),
  itemName: document.querySelector('#itemName'),
  fileName: document.querySelector('#fileName'),
  imageWrap: document.querySelector('.image-wrap'),
  imageVariants: document.querySelector('#imageVariants'),
  weightButtons: document.querySelector('#weightButtons'),
  themeWeightButtons: document.querySelector('#themeWeightButtons'),
  dutchItemButton: document.querySelector('#dutchItemButton'),
  removedNotice: document.querySelector('#removedNotice'),
  themeButtons: document.querySelector('#themeButtons'),
  excludeButtons: document.querySelector('#excludeButtons'),
  resetItemButton: document.querySelector('#resetItemButton'),
  removeItemButton: document.querySelector('#removeItemButton'),
  downloadButton: document.querySelector('#downloadButton'),
  approveButton: document.querySelector('#approveButton'),
};

let currentIndex = 0;
let currentImageIndex = 0;
let overviewOpen = false;
let forceFullCatalog = false;
let selectedOverviewItemId = null;
let reviewState = loadState();

function normalizeData(input) {
  const themes = Array.isArray(input?.themes) ? input.themes : [];
  const themeLabels = new Map(themes.map((theme) => [theme.id, theme.label]));

  return {
    generatedAt: input?.generatedAt ?? input?.exportedAt ?? null,
    themes,
    items: (input?.items ?? []).map((item) => normalizeItem(item, themeLabels)),
  };
}

function normalizeItem(item, themeLabels = new Map()) {
  return {
    id: item.id,
    name: item.name,
    originalNames: item.originalNames ?? [item.originalName ?? item.name],
    originalThemes: item.originalThemes ?? [],
    themes: [...new Set(item.themes ?? [])],
    excludedThemes: [...new Set(item.excludedThemes ?? [])],
    weight: normalizeWeight(item.weight, item.id),
    themeWeights: normalizeThemeWeights(item.themeWeights, item.id),
    nederlands: item.nederlands === true,
    isNew: item.isNew === true,
    removed: item.removed === true,
    approved: item.approved === true,
    images: normalizeImages(item.images ?? [], themeLabels),
  };
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

function normalizeImages(images, themeLabels) {
  return images.map((image) => {
    if (typeof image !== 'string') {
      return image;
    }

    const parts = image.split('/');
    const filename = parts[parts.length - 1];
    const sourceFolder = parts[parts.length - 2] ?? '';
    const themeId = getThemeIdFromFolder(sourceFolder);

    return {
      themeId,
      themeLabel: themeId ? themeLabels.get(themeId) ?? themeId : 'Nieuw',
      path: image,
      filename,
      sourceFolder,
    };
  });
}

function getThemeIdFromFolder(folder) {
  const folders = {
    Bergen: 'bergen',
    Platteland: 'platteland',
    Snelweg: 'snelweg',
    Vakantie: 'vakantie',
    Verkeersborden: 'verkeersborden',
    Voertuigen: 'voertuigen',
    Winter: 'winter',
    stad: 'stad',
  };

  return folders[folder] ?? null;
}

function getReviewItems() {
  if (!showNewItemsOnly || forceFullCatalog) {
    return data.items;
  }

  const newItems = data.items.filter((item) => item.isNew || item.originalThemes.length === 0);
  return newItems.length > 0 ? newItems : data.items;
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey));
    if (parsed && parsed.items && Object.keys(parsed.items).length > 0) {
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
          excludedThemes: [],
          weight: item.weight,
          themeWeights: { ...item.themeWeights },
          nederlands: item.nederlands === true,
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
      excludedThemes: [...(item.excludedThemes ?? [])],
      weight: item.weight,
      themeWeights: { ...(item.themeWeights ?? {}) },
      nederlands: item.nederlands === true,
      removed: item.removed === true,
      approved: item.approved === true,
    };
  }
  if (typeof reviewState.items[item.id].removed !== 'boolean') {
    reviewState.items[item.id].removed = false;
  }
  if (!Array.isArray(reviewState.items[item.id].excludedThemes)) {
    reviewState.items[item.id].excludedThemes = [];
  }
  if (typeof reviewState.items[item.id].nederlands !== 'boolean') {
    reviewState.items[item.id].nederlands = item.nederlands === true;
  }
  reviewState.items[item.id].weight = normalizeWeight(reviewState.items[item.id].weight, item.id);
  reviewState.items[item.id].themeWeights = normalizeThemeWeights(reviewState.items[item.id].themeWeights, item.id);
  return reviewState.items[item.id];
}

function render() {
  const reviewItems = getReviewItems();
  const item = reviewItems[currentIndex];
  if (!item) {
    els.progressText.textContent = '0 / 0';
    els.savedText.textContent = 'Geen items';
    els.progressFill.style.width = '0%';
    return;
  }
  const state = getItemState(item);
  const image = item.images[currentImageIndex] || item.images[0];
  const approvedCount = reviewItems.filter((entry) => getItemState(entry).approved).length;

  els.progressText.textContent = `${currentIndex + 1} / ${reviewItems.length}`;
  els.savedText.textContent = `${approvedCount} akkoord`;
  els.progressFill.style.width = `${Math.round((approvedCount / reviewItems.length) * 100)}%`;
  els.itemImage.src = image?.path ?? '';
  els.itemImage.alt = state.name;
  els.itemName.value = state.name;
  els.fileName.textContent = image ? `${image.sourceFolder}/${image.filename}` : 'Geen afbeelding';
  els.imageWrap.classList.toggle('removed', state.removed);
  els.removedNotice.hidden = !state.removed;

  els.prevButton.disabled = currentIndex === 0;
  els.nextButton.disabled = currentIndex === reviewItems.length - 1;
  els.removeItemButton.classList.toggle('active', state.removed);
  els.removeItemButton.textContent = state.removed ? 'Herstel item' : 'Verwijder item';
  els.removeItemButton.setAttribute('aria-pressed', String(state.removed));
  els.dutchItemButton.classList.toggle('active', state.nederlands);
  els.dutchItemButton.disabled = state.removed;
  els.dutchItemButton.setAttribute('aria-pressed', String(state.nederlands));
  els.approveButton.textContent = state.approved ? 'Bijwerken' : 'Akkoord';

  renderImageVariants(item);
  renderWeightButtons(item, state, els.weightButtons);
  renderThemeWeightButtons(item, state, els.themeWeightButtons);
  renderThemeButtons(item, state);
  renderExcludeButtons(item, state);
  renderOverview();
}

function renderWeightButtons(item, state, container) {
  if (!container) {
    return;
  }
  container.innerHTML = '';
  weightChoices.forEach((choice) => {
    const button = document.createElement('button');
    const isActive = Math.abs(state.weight - choice.value) < 0.001;
    button.type = 'button';
    button.className = `choice-button${isActive ? ' active' : ''}`;
    button.textContent = choice.label;
    button.disabled = state.removed;
    button.setAttribute('aria-pressed', String(isActive));
    button.addEventListener('click', () => setWeight(item, choice.value));
    container.appendChild(button);
  });
}

function setWeight(item, weight) {
  const state = getItemState(item);
  state.weight = normalizeWeight(weight, item.id);
  state.approved = false;
  saveState();
  render();
}

function renderThemeWeightButtons(item, state, container) {
  if (!container) {
    return;
  }

  container.innerHTML = '';
  const activeThemes = data.themes.filter((theme) => state.themes.includes(theme.id));

  if (activeThemes.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'file-name';
    empty.textContent = 'Kies eerst een thema.';
    container.appendChild(empty);
    return;
  }

  activeThemes.forEach((theme) => {
    const row = document.createElement('div');
    row.className = 'theme-weight-row';
    const label = document.createElement('span');
    label.className = 'theme-weight-label';
    label.textContent = theme.label;
    const choices = document.createElement('div');
    choices.className = 'choice-row compact';

    const defaultButton = document.createElement('button');
    const hasThemeWeight = Object.prototype.hasOwnProperty.call(state.themeWeights, theme.id);
    defaultButton.type = 'button';
    defaultButton.className = `choice-button${hasThemeWeight ? '' : ' active'}`;
    defaultButton.textContent = `Std ${state.weight}`;
    defaultButton.disabled = state.removed;
    defaultButton.setAttribute('aria-pressed', String(!hasThemeWeight));
    defaultButton.addEventListener('click', () => setThemeWeight(item, theme.id, null));
    choices.appendChild(defaultButton);

    weightChoices.forEach((choice) => {
      const button = document.createElement('button');
      const isActive = hasThemeWeight && state.themeWeights[theme.id] === choice.value;
      button.type = 'button';
      button.className = `choice-button${isActive ? ' active' : ''}`;
      button.textContent = choice.label;
      button.disabled = state.removed;
      button.setAttribute('aria-pressed', String(isActive));
      button.addEventListener('click', () => setThemeWeight(item, theme.id, choice.value));
      choices.appendChild(button);
    });

    row.appendChild(label);
    row.appendChild(choices);
    container.appendChild(row);
  });
}

function setThemeWeight(item, themeId, weight) {
  const state = getItemState(item);
  if (weight === null) {
    delete state.themeWeights[themeId];
  } else {
    state.themeWeights[themeId] = normalizeWeight(weight, item.id);
  }
  state.approved = false;
  saveState();
  render();
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

function renderExcludeButtons(item, state) {
  els.excludeButtons.innerHTML = '';
  data.themes
    .filter((theme) => theme.id !== 'algemeen')
    .forEach((theme) => {
      const button = document.createElement('button');
      const isActive = state.excludedThemes.includes(theme.id);
      button.type = 'button';
      button.className = `theme-toggle excluded${isActive ? ' active' : ''}`;
      button.textContent = theme.label;
      button.disabled = state.removed;
      button.setAttribute('aria-pressed', String(isActive));
      button.addEventListener('click', () => {
        toggleExcludedTheme(item, theme.id);
      });
      els.excludeButtons.appendChild(button);
    });
}

function toggleTheme(item, themeId) {
  const state = getItemState(item);
  if (state.themes.includes(themeId)) {
    state.themes = state.themes.filter((id) => id !== themeId);
    delete state.themeWeights[themeId];
  } else {
    state.themes = [...state.themes, themeId];
    state.excludedThemes = state.excludedThemes.filter((id) => id !== themeId);
  }
  state.approved = false;
  saveState();
  render();
}

function toggleExcludedTheme(item, themeId) {
  const state = getItemState(item);
  if (state.excludedThemes.includes(themeId)) {
    state.excludedThemes = state.excludedThemes.filter((id) => id !== themeId);
  } else {
    state.excludedThemes = [...state.excludedThemes, themeId];
    state.themes = state.themes.filter((id) => id !== themeId);
    delete state.themeWeights[themeId];
  }
  state.approved = false;
  saveState();
  render();
}

function toggleRemoved() {
  const reviewItems = getReviewItems();
  const item = reviewItems[currentIndex];
  const state = getItemState(item);
  state.removed = !state.removed;
  state.approved = false;
  saveState();
  render();
}

function toggleDutchItem() {
  const reviewItems = getReviewItems();
  const item = reviewItems[currentIndex];
  const state = getItemState(item);
  state.nederlands = !state.nederlands;
  state.approved = false;
  saveState();
  render();
}

function approveCurrentItem() {
  const reviewItems = getReviewItems();
  const item = reviewItems[currentIndex];
  const state = getItemState(item);
  state.name = els.itemName.value.trim() || item.name;
  state.approved = true;
  saveState();

  if (currentIndex < reviewItems.length - 1) {
    currentIndex += 1;
    currentImageIndex = 0;
  }
  render();
}

function move(delta) {
  const reviewItems = getReviewItems();
  const nextIndex = currentIndex + delta;
  if (nextIndex < 0 || nextIndex >= reviewItems.length) {
    return;
  }
  currentIndex = nextIndex;
  currentImageIndex = 0;
  render();
}

function resetCurrentItem() {
  const reviewItems = getReviewItems();
  const item = reviewItems[currentIndex];
  reviewState.items[item.id] = {
    name: item.name,
    themes: [...item.themes],
    excludedThemes: [],
    weight: item.weight,
    themeWeights: { ...item.themeWeights },
    nederlands: item.nederlands === true,
    removed: false,
    approved: false,
  };
  saveState();
  render();
}

function downloadExport() {
  const exportItems = showNewItemsOnly && !forceFullCatalog ? getReviewItems() : data.items;
  const reviewedItems = exportItems.map((item) => {
    const state = getItemState(item);
    return {
      id: item.id,
      name: state.name,
      originalName: item.name,
      themes: data.themes.map((theme) => theme.id).filter((themeId) => state.themes.includes(themeId)),
      excludedThemes: data.themes
        .map((theme) => theme.id)
        .filter((themeId) => state.excludedThemes.includes(themeId)),
      weight: state.weight,
      themeWeights: Object.fromEntries(
        Object.entries(state.themeWeights).filter(([themeId]) => state.themes.includes(themeId)),
      ),
      nederlands: state.nederlands,
      originalThemes: item.originalThemes,
      images: item.images.map((image) => image.path),
      removed: state.removed,
      approved: state.approved,
    };
  });

  const payload = {
    exportedAt: new Date().toISOString(),
    mode: showNewItemsOnly && !forceFullCatalog ? 'new-items' : 'full-catalog',
    themes: data.themes,
    items: reviewedItems,
  };
  const blob = new Blob([`${JSON.stringify(payload, null, 2)}\n`], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = showNewItemsOnly && !forceFullCatalog ? 'new-item-review-export.json' : 'item-review-export.json';
  link.click();
  URL.revokeObjectURL(url);
}

function populateOverviewFilters() {
  els.overviewThemeFilter.innerHTML = '<option value="">Alle thema&apos;s</option>';
  data.themes.forEach((theme) => {
    const option = document.createElement('option');
    option.value = theme.id;
    option.textContent = theme.label;
    els.overviewThemeFilter.appendChild(option);
  });
}

function getFilteredOverviewItems() {
  const query = els.overviewSearch.value.trim().toLowerCase();
  const themeId = els.overviewThemeFilter.value;
  const status = els.overviewStatusFilter.value;

  return data.items.filter((item) => {
    const state = getItemState(item);
    const haystack = [
      item.id,
      state.name,
      item.images.map((image) => image.filename).join(' '),
      state.themes.join(' '),
      state.excludedThemes.join(' '),
      String(state.weight),
      Object.entries(state.themeWeights).map(([themeId, weight]) => `${themeId} ${weight}`).join(' '),
    ].join(' ').toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    const matchesTheme = !themeId || state.themes.includes(themeId);
    const matchesStatus = (
      status === 'all'
      || (status === 'active' && !state.removed)
      || (status === 'removed' && state.removed)
      || (status === 'new' && item.isNew)
    );

    return matchesSearch && matchesTheme && matchesStatus;
  });
}

function renderOverview() {
  if (!overviewOpen) {
    return;
  }

  const items = getFilteredOverviewItems();
  els.overviewList.innerHTML = '';
  items.forEach((item) => {
    const state = getItemState(item);
    const image = item.images[0];
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `overview-item${item.id === selectedOverviewItemId ? ' active' : ''}${state.removed ? ' removed' : ''}`;
    button.innerHTML = `
      <img src="${image?.path ?? ''}" alt="" />
      <span>
        <strong>${escapeHtml(state.name)}</strong>
        <small>${escapeHtml(state.themes.join(', ') || 'Geen thema')}</small>
      </span>
    `;
    button.addEventListener('click', () => selectOverviewItem(item.id));
    els.overviewList.appendChild(button);
  });

  renderOverviewEditor();
}

function selectOverviewItem(itemId) {
  selectedOverviewItemId = itemId;
  const reviewItems = getReviewItems();
  const reviewIndex = reviewItems.findIndex((item) => item.id === itemId);
  if (reviewIndex >= 0) {
    currentIndex = reviewIndex;
    currentImageIndex = 0;
  }
  render();
}

function renderOverviewEditor() {
  const item = data.items.find((entry) => entry.id === selectedOverviewItemId);
  if (!item) {
    els.overviewEmpty.hidden = false;
    els.overviewEditorBody.hidden = true;
    return;
  }

  const state = getItemState(item);
  const image = item.images[0];
  els.overviewEmpty.hidden = true;
  els.overviewEditorBody.hidden = false;
  els.overviewImage.src = image?.path ?? '';
  els.overviewImage.alt = state.name;
  els.overviewName.value = state.name;
  els.overviewFile.textContent = image ? `${image.sourceFolder}/${image.filename}` : 'Geen afbeelding';
  renderWeightButtons(item, state, els.overviewWeightButtons);
  renderThemeWeightButtons(item, state, els.overviewThemeWeightButtons);
  els.overviewDutchButton.classList.toggle('active', state.nederlands);
  els.overviewDutchButton.setAttribute('aria-pressed', String(state.nederlands));
  els.overviewRemoveButton.classList.toggle('active', state.removed);
  els.overviewRemoveButton.textContent = state.removed ? 'Herstel item' : 'Verwijder item';
  renderOverviewThemeButtons(item, state);
  renderOverviewExcludeButtons(item, state);
}

function renderOverviewThemeButtons(item, state) {
  els.overviewThemeButtons.innerHTML = '';
  data.themes.forEach((theme) => {
    const button = document.createElement('button');
    const isActive = state.themes.includes(theme.id);
    button.type = 'button';
    button.className = `theme-toggle${isActive ? ' active' : ''}`;
    button.textContent = theme.label;
    button.setAttribute('aria-pressed', String(isActive));
    button.addEventListener('click', () => toggleTheme(item, theme.id));
    els.overviewThemeButtons.appendChild(button);
  });
}

function renderOverviewExcludeButtons(item, state) {
  els.overviewExcludeButtons.innerHTML = '';
  data.themes
    .filter((theme) => theme.id !== 'algemeen')
    .forEach((theme) => {
      const button = document.createElement('button');
      const isActive = state.excludedThemes.includes(theme.id);
      button.type = 'button';
      button.className = `theme-toggle excluded${isActive ? ' active' : ''}`;
      button.textContent = theme.label;
      button.setAttribute('aria-pressed', String(isActive));
      button.addEventListener('click', () => toggleExcludedTheme(item, theme.id));
      els.overviewExcludeButtons.appendChild(button);
    });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#039;');
}

function importReviewJson(payload) {
  data = normalizeData(payload);
  forceFullCatalog = true;
  reviewState = {
    updatedAt: new Date().toISOString(),
    items: Object.fromEntries(
      data.items.map((item) => [
        item.id,
        {
          name: item.name,
          themes: [...item.themes],
          excludedThemes: [...item.excludedThemes],
          weight: item.weight,
          themeWeights: { ...item.themeWeights },
          nederlands: item.nederlands,
          removed: item.removed,
          approved: item.approved,
        },
      ]),
    ),
  };
  currentIndex = 0;
  currentImageIndex = 0;
  selectedOverviewItemId = data.items[0]?.id ?? null;
  saveState();
  populateOverviewFilters();
  render();
}

els.itemName.addEventListener('input', () => {
  const item = getReviewItems()[currentIndex];
  const state = getItemState(item);
  state.name = els.itemName.value;
  state.approved = false;
  saveState();
});
els.jsonUpload.addEventListener('change', async (event) => {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  try {
    importReviewJson(JSON.parse(await file.text()));
    overviewOpen = true;
    els.overviewPanel.hidden = false;
    els.overviewButton.textContent = 'Reviewer';
    renderOverview();
  } catch (error) {
    window.alert(`JSON kon niet geladen worden: ${error.message}`);
  } finally {
    event.target.value = '';
  }
});
els.overviewButton.addEventListener('click', () => {
  overviewOpen = !overviewOpen;
  els.overviewPanel.hidden = !overviewOpen;
  els.overviewButton.textContent = overviewOpen ? 'Reviewer' : 'Overzicht';
  if (overviewOpen && !selectedOverviewItemId) {
    selectedOverviewItemId = data.items[0]?.id ?? null;
  }
  renderOverview();
});
els.overviewSearch.addEventListener('input', renderOverview);
els.overviewThemeFilter.addEventListener('change', renderOverview);
els.overviewStatusFilter.addEventListener('change', renderOverview);
els.overviewName.addEventListener('input', () => {
  const item = data.items.find((entry) => entry.id === selectedOverviewItemId);
  if (!item) {
    return;
  }
  const state = getItemState(item);
  state.name = els.overviewName.value;
  state.approved = false;
  saveState();
  render();
});
els.overviewDutchButton.addEventListener('click', () => {
  const item = data.items.find((entry) => entry.id === selectedOverviewItemId);
  if (item) {
    const state = getItemState(item);
    state.nederlands = !state.nederlands;
    state.approved = false;
    saveState();
    render();
  }
});
els.overviewRemoveButton.addEventListener('click', () => {
  const item = data.items.find((entry) => entry.id === selectedOverviewItemId);
  if (item) {
    const state = getItemState(item);
    state.removed = !state.removed;
    state.approved = false;
    saveState();
    render();
  }
});

els.prevButton.addEventListener('click', () => move(-1));
els.nextButton.addEventListener('click', () => move(1));
els.resetItemButton.addEventListener('click', resetCurrentItem);
els.removeItemButton.addEventListener('click', toggleRemoved);
els.dutchItemButton.addEventListener('click', toggleDutchItem);
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

populateOverviewFilters();
render();
