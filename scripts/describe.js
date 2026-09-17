const MODULE_ID = "describe";
const MODULE_TITLE = "Describe";
const CARD_SETTING = "cards";
const FOLDER_SETTING = "folders";
const PERMISSIONS_SETTING = "permissions";
const FAVORITES_SETTING = "favorites";
const DELETED_CARDS_SETTING = "deletedCards";
const DELETED_FOLDERS_SETTING = "deletedFolders";
const MODULE_ROOT = new URL("../", import.meta.url).pathname;
const CUSTOM_BACKGROUND_DIR = "describe-backgrounds";
const GENERAL_FOLDER_NAME = "Общее";
const MAX_VISIBLE_CARDS = 250;

let baseCards = [];
let generatedFolders = [];

const DEFAULT_PERMISSIONS = {
  1: { canOpen: true, canShow: false },
  2: { canOpen: true, canShow: false },
  3: { canOpen: true, canShow: true },
  4: { canOpen: true, canShow: true }
};

const CATEGORY_DEFS = [
  {
    id: "places",
    name: "Места",
    icon: "fas fa-map-marker-alt",
    backgrounds: [
      { label: "Места", path: "Место.webp" }
    ]
  },
  {
    id: "monsters",
    name: "Монстры",
    icon: "fas fa-dragon",
    backgrounds: [
      { label: "Существа", path: "Существо.webp" }
    ]
  },
  {
    id: "spells",
    name: "Заклинания",
    icon: "fas fa-wand-magic-sparkles",
    backgrounds: [
      { label: "Заклинания", path: "Заклинание.webp" }
    ]
  },
  {
    id: "items",
    name: "Предметы",
    icon: "fas fa-gem",
    backgrounds: [
      { label: "Предметы", path: "Предмет.webp" }
    ]
  },
  {
    id: "characters",
    name: "Персонажи",
    icon: "fas fa-user",
    backgrounds: [
      { label: "Персонажи", path: "Персонаж.webp" }
    ]
  },
  {
    id: "dialogs",
    name: "Диалоги",
    icon: "fas fa-comments",
    backgrounds: [
      { label: "Диалоги", path: "Диалог.jpg" }
    ]
  },
  {
    id: "events",
    name: "События",
    icon: "fas fa-bolt",
    backgrounds: [
      { label: "События", path: "Другое.jpg" }
    ]
  },
  {
    id: "actions",
    name: "Действия",
    icon: "fas fa-person-running",
    backgrounds: [
      { label: "Действия", path: "Другое.jpg" }
    ]
  },
  {
    id: "nature",
    name: "Природа",
    icon: "fas fa-tree",
    backgrounds: [
      { label: "Природа", path: "Природа.jpg" }
    ]
  },
  {
    id: "phenomena",
    name: "Явления",
    icon: "fas fa-cloud",
    backgrounds: [
      { label: "Природа", path: "Природа.jpg" }
    ]
  },
  {
    id: "planes",
    name: "Планы",
    icon: "fas fa-globe",
    backgrounds: [
      { label: "Планы бытия", path: "Планы бытия.jpg" }
    ]
  },
  {
    id: "vehicles",
    name: "Транспорт",
    icon: "fas fa-ship",
    backgrounds: [
      { label: "Транспорт", path: "Транспорт.jpg" }
    ]
  },
  {
    id: "traps",
    name: "Ловушки",
    icon: "fas fa-burst",
    backgrounds: [
      { label: "Ловушки", path: "Ловушка.jpg" }
    ]
  },
  {
    id: "conditions",
    name: "Состояния",
    icon: "fas fa-heart-crack",
    backgrounds: [
      { label: "Недуги", path: "Недуг.jpg" }
    ]
  },
  {
    id: "other",
    name: "Разное",
    icon: "fas fa-feather",
    backgrounds: [
      { label: "Другое", path: "Другое.jpg" }
    ]
  }
];

function moduleUrl(path = "") {
  return `${MODULE_ROOT}${path}`.replace(/([^:]\/)\/+/g, "$1");
}

function searchText(value) {
  return String(value ?? "").toLocaleLowerCase();
}

function randomId() {
  return foundry.utils.randomID(16);
}

function escapeHtml(value) {
  const element = document.createElement("div");
  element.textContent = String(value ?? "");
  return element.innerHTML;
}

function slugId(value) {
  return searchText(value)
    .replace(/[^a-zа-яё0-9]+/giu, "-")
    .replace(/^-+|-+$/g, "") || randomId();
}

function categoryDef(category) {
  return CATEGORY_DEFS.find((entry) => entry.name === category) ?? CATEGORY_DEFS.at(-1);
}

function backgroundChoices(category, selectedImage = "") {
  const choices = [...categoryDef(category).backgrounds];
  if (selectedImage && !choices.some((entry) => entry.path === selectedImage)) {
    choices.unshift({ label: "Текущий фон", path: selectedImage });
  }
  return choices.map((entry) => ({
    ...entry,
    imageUrl: imageUrl(entry.path),
    selected: entry.path === selectedImage
  }));
}

function defaultImageForCategory(category) {
  return categoryDef(category).backgrounds[0]?.path ?? "Другое.jpg";
}

function normalizeCard(card) {
  const category = card.category?.trim() || "Разное";
  const tags = Array.isArray(card.tags)
    ? card.tags
    : String(card.tags ?? "")
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);

  return {
    id: card.id || randomId(),
    title: card.title?.trim() || "Без названия",
    category,
    folderId: card.folderId || null,
    tags,
    image: card.image?.trim() || defaultImageForCategory(category),
    description: card.description?.trim() || ""
  };
}

function normalizeFolder(folder) {
  return {
    id: folder.id || randomId(),
    category: folder.category?.trim() || "Разное",
    name: folder.name?.trim() || GENERAL_FOLDER_NAME,
    sort: Number.isFinite(folder.sort) ? folder.sort : 0
  };
}

function normalizePermissions(value = {}) {
  const permissions = foundry.utils.deepClone(DEFAULT_PERMISSIONS);
  for (const [role, rolePermissions] of Object.entries(value ?? {})) {
    permissions[role] = {
      canOpen: Boolean(rolePermissions?.canOpen),
      canShow: Boolean(rolePermissions?.canShow)
    };
  }
  permissions[4] = { canOpen: true, canShow: true };
  return permissions;
}

function imageUrl(path) {
  if (!path) return moduleUrl("Другое.jpg");
  if (/^(https?:|data:|\/)/i.test(path)) return path;
  if (path.includes("/")) return path;
  return moduleUrl(path);
}

function cardImageUrl(card) {
  return imageUrl(card?.image);
}

function getCards() {
  const deleted = new Set(getDeletedCardIds());
  const cardsById = new Map(
    foundry.utils.deepClone(baseCards)
      .map(normalizeCard)
      .filter((card) => !deleted.has(card.id))
      .map((card) => [card.id, card])
  );

  for (const card of foundry.utils.deepClone(game.settings.get(MODULE_ID, CARD_SETTING) ?? []).map(normalizeCard)) {
    if (!deleted.has(card.id)) cardsById.set(card.id, card);
  }

  return [...cardsById.values()];
}

function getStoredCards() {
  return foundry.utils.deepClone(game.settings.get(MODULE_ID, CARD_SETTING) ?? []).map(normalizeCard);
}

async function setCards(cards) {
  const baseById = new Map(foundry.utils.deepClone(baseCards).map(normalizeCard).map((card) => [card.id, card]));
  const stored = cards.map(normalizeCard).filter((card) => {
    const base = baseById.get(card.id);
    return !base || JSON.stringify(base) !== JSON.stringify(card);
  });
  await game.settings.set(MODULE_ID, CARD_SETTING, stored);
}

function getFolders() {
  const deleted = new Set(getDeletedFolderIds());
  const foldersById = new Map(
    foundry.utils.deepClone(generatedFolders)
      .map(normalizeFolder)
      .filter((folder) => !deleted.has(folder.id))
      .map((folder) => [folder.id, folder])
  );

  for (const folder of foundry.utils.deepClone(game.settings.get(MODULE_ID, FOLDER_SETTING) ?? []).map(normalizeFolder)) {
    if (!deleted.has(folder.id)) foldersById.set(folder.id, folder);
  }

  return [...foldersById.values()];
}

async function setFolders(folders) {
  const generatedById = new Map(foundry.utils.deepClone(generatedFolders).map(normalizeFolder).map((folder) => [folder.id, folder]));
  const stored = folders.map(normalizeFolder).filter((folder) => {
    const generated = generatedById.get(folder.id);
    return !generated || JSON.stringify(generated) !== JSON.stringify(folder);
  });
  await game.settings.set(MODULE_ID, FOLDER_SETTING, stored);
}

function getFavoriteIds() {
  return foundry.utils.deepClone(game.settings.get(MODULE_ID, FAVORITES_SETTING) ?? []);
}

async function setFavoriteIds(ids) {
  await game.settings.set(MODULE_ID, FAVORITES_SETTING, [...new Set(ids)]);
}

function isFavorite(cardId) {
  return getFavoriteIds().includes(cardId);
}

async function toggleFavorite(cardId) {
  const favorites = new Set(getFavoriteIds());
  if (favorites.has(cardId)) favorites.delete(cardId);
  else favorites.add(cardId);
  await setFavoriteIds([...favorites]);
}

function getDeletedCardIds() {
  return foundry.utils.deepClone(game.settings.get(MODULE_ID, DELETED_CARDS_SETTING) ?? []);
}

async function setDeletedCardIds(ids) {
  await game.settings.set(MODULE_ID, DELETED_CARDS_SETTING, [...new Set(ids)]);
}

function getDeletedFolderIds() {
  return foundry.utils.deepClone(game.settings.get(MODULE_ID, DELETED_FOLDERS_SETTING) ?? []);
}

async function setDeletedFolderIds(ids) {
  await game.settings.set(MODULE_ID, DELETED_FOLDERS_SETTING, [...new Set(ids)]);
}

function getPermissions() {
  return normalizePermissions(game.settings.get(MODULE_ID, PERMISSIONS_SETTING));
}

async function loadJson(path) {
  const response = await fetch(moduleUrl(path));
  if (!response.ok) throw new Error(`Default cards not found: ${response.status}`);
  return response.json();
}

async function loadBaseData() {
  baseCards = (await loadJson("data/cards.generated.json")).map(normalizeCard);
  generatedFolders = (await loadJson("data/folders.generated.json")).map(normalizeFolder);
}

function allCategoryNames(cards = getCards()) {
  const customCategories = cards
    .map((card) => card.category)
    .filter((category) => !CATEGORY_DEFS.some((entry) => entry.name === category));
  return [...new Set([...CATEGORY_DEFS.map((entry) => entry.name), ...customCategories])];
}

function defaultFoldersForCategory(category) {
  const named = {
    "Монстры": ["Орки", "Нежить", "Призраки", "Гиганты"],
    "Места": ["Фестивали", "Руины", "Поселения"],
    "Предметы": ["Снаряжение", "Оружие", "Сокровища"],
    "Персонажи": ["Дворяне", "Союзники", "Враги"],
    "Заклинания": ["Фокусы", "Боевые", "Утилитарные"]
  }[category] ?? [];

  return [GENERAL_FOLDER_NAME, ...named].map((name, index) => ({
    id: `${slugId(category)}-${slugId(name)}`,
    category,
    name,
    sort: index
  }));
}

function defaultFolderNameForCard(card) {
  const map = {
    orc: "Орки",
    "explorers-pack": "Снаряжение",
    "nervous-prince": "Дворяне",
    "mage-hand": "Фокусы",
    "beach-music-festival": "Фестивали"
  };
  return map[card.id] ?? GENERAL_FOLDER_NAME;
}

function folderOptions(category, selectedFolderId = null) {
  const folders = getFolders()
    .filter((folder) => folder.category === category)
    .sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "ru"));

  return folders.map((folder) => ({
    ...folder,
    selected: folder.id === selectedFolderId
  }));
}

async function promptFolderName({ title, name = "" }) {
  return new Promise((resolve) => {
    new Dialog({
      title,
      content: `
        <form class="describe-folder-dialog">
          <label>
            <span>Название папки</span>
            <input type="text" name="name" value="${escapeHtml(name)}" autofocus>
          </label>
        </form>
      `,
      buttons: {
        save: {
          icon: '<i class="fas fa-save"></i>',
          label: "Сохранить",
          callback: (html) => {
            const value = html.find("[name='name']").val()?.trim();
            resolve(value || null);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Отмена",
          callback: () => resolve(null)
        }
      },
      default: "save",
      close: () => resolve(null)
    }).render(true);
  });
}

async function ensureFoldersAndCardLinks() {
  let cards = getCards();
  let folders = getFolders();
  const categories = allCategoryNames(cards);

  for (const category of categories) {
    if (!folders.some((folder) => folder.category === category)) {
      folders.push(...defaultFoldersForCategory(category));
    }
  }

  for (const card of cards) {
    const hasFolder = card.folderId && folders.some((folder) => folder.id === card.folderId && folder.category === card.category);
    if (hasFolder) continue;

    const folderName = defaultFolderNameForCard(card);
    let folder = folders.find((entry) => entry.category === card.category && entry.name === folderName);
    if (!folder) {
      folder = {
        id: `${slugId(card.category)}-${slugId(folderName)}`,
        category: card.category,
        name: folderName,
        sort: folders.filter((entry) => entry.category === card.category).length
      };
      folders.push(folder);
    }
    card.folderId = folder.id;
  }

  await setFolders(folders);
  const overrides = getStoredCards();
  const overrideIds = new Set(overrides.map((card) => card.id));
  const changedOverrides = cards.filter((card) => overrideIds.has(card.id));
  if (changedOverrides.length !== overrides.length) await setCards(changedOverrides);
}

function userCanEdit() {
  return game.user?.isGM;
}

function userRole() {
  return Number(game.user?.role ?? 0);
}

function userCanOpen() {
  if (game.user?.isGM) return true;
  return Boolean(getPermissions()[userRole()]?.canOpen);
}

function userCanShow() {
  if (game.user?.isGM) return true;
  return Boolean(getPermissions()[userRole()]?.canShow);
}

function roleLabel(role) {
  const roles = CONST.USER_ROLES ?? {};
  const key = Object.entries(roles).find(([, value]) => Number(value) === Number(role))?.[0] ?? role;
  const labels = {
    PLAYER: "Игрок",
    TRUSTED: "Доверенный игрок",
    ASSISTANT: "Помощник GM",
    GAMEMASTER: "Гейммастер"
  };
  return labels[key] ?? game.i18n.localize(`USER.Role${key.titleCase?.() ?? key}`) ?? key;
}

function configurableRoles() {
  return Object.values(CONST.USER_ROLES ?? {})
    .map(Number)
    .filter((role) => role > 0)
    .sort((a, b) => a - b);
}

class DescribePermissionsConfig extends FormApplication {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "describe-permissions",
      title: "Права Describe",
      template: moduleUrl("templates/permissions.hbs"),
      width: 560,
      height: "auto",
      classes: ["describe-window"]
    });
  }

  async getData() {
    const permissions = getPermissions();
    return {
      roles: configurableRoles().map((role) => ({
        role,
        label: roleLabel(role),
        canOpen: Boolean(permissions[role]?.canOpen),
        canShow: Boolean(permissions[role]?.canShow),
        isGM: role >= (CONST.USER_ROLES?.GAMEMASTER ?? 4)
      }))
    };
  }

  async _updateObject(_event, formData) {
    const expanded = foundry.utils.expandObject(formData);
    const permissions = {};
    for (const role of configurableRoles()) {
      permissions[role] = {
        canOpen: Boolean(expanded.roles?.[role]?.canOpen),
        canShow: Boolean(expanded.roles?.[role]?.canShow)
      };
    }
    await game.settings.set(MODULE_ID, PERMISSIONS_SETTING, normalizePermissions(permissions));
  }
}

class DescribeLibraryApp extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "describe-library",
      title: "Describe",
      template: moduleUrl("templates/library.hbs"),
      width: 920,
      height: 680,
      resizable: true,
      classes: ["describe-window", "describe-library-window"]
    });
  }

  constructor(options = {}) {
    super(options);
    this.query = "";
    this.category = null;
    this.folderId = null;
    this.selectedId = null;
    this.favoritesOnly = false;
    this.showCategories = true;
    this._restoreFocus = null;
  }

  get filteredCards() {
    const query = searchText(this.query);
    return getCards().filter((card) => {
      const categoryMatches = !this.category || card.category === this.category;
      const folderMatches = !this.folderId || card.folderId === this.folderId;
      const favoriteMatches = !this.favoritesOnly || isFavorite(card.id);
      const haystack = searchText(`${card.title} ${card.category} ${card.description} ${card.tags.join(" ")}`);
      return categoryMatches && folderMatches && favoriteMatches && (!query || haystack.includes(query));
    });
  }

  async getData() {
    const allCards = getCards().sort((a, b) => a.title.localeCompare(b.title, "ru"));
    const folders = getFolders().sort((a, b) => a.sort - b.sort || a.name.localeCompare(b.name, "ru"));
    const categoryFolders = folders.filter((folder) => folder.category === this.category);
    if (this.category && (!this.folderId || !categoryFolders.some((folder) => folder.id === this.folderId))) {
      this.folderId = categoryFolders[0]?.id ?? null;
    }

    const filtered = this.filteredCards.sort((a, b) => a.title.localeCompare(b.title, "ru"));
    if (!this.selectedId || !filtered.some((card) => card.id === this.selectedId)) {
      this.selectedId = filtered[0]?.id ?? null;
    }

    const visibleCards = filtered.slice(0, MAX_VISIBLE_CARDS);
    const selectedCard = filtered.find((card) => card.id === this.selectedId);
    const categoryNames = allCategoryNames(allCards);

    return {
      isGM: userCanEdit(),
      canShow: userCanShow(),
      query: this.query,
      count: allCards.length,
      resultCount: filtered.length,
      resultLimit: MAX_VISIBLE_CARDS,
      isLimited: filtered.length > MAX_VISIBLE_CARDS,
      favoritesOnly: this.favoritesOnly,
      selectedCategory: this.category,
      folderTitle: this.category ?? "Все категории",
      showCategories: this.showCategories,
      categoryTiles: categoryNames.map((name) => {
        const def = categoryDef(name);
        const count = allCards.filter((card) => card.category === name).length;
        return {
          name,
          icon: def.icon,
          count,
          active: name === this.category
        };
      }),
      categories: [
        { value: "", label: "Все категории", selected: !this.category },
        ...categoryNames.map((name) => ({ value: name, label: name, selected: this.category === name }))
      ],
      folders: categoryFolders.map((folder) => ({
        ...folder,
        count: allCards.filter((card) => card.folderId === folder.id).length,
        selected: folder.id === this.folderId
      })),
      hasCategory: true,
      hasSelectedCategory: Boolean(this.category),
      cards: visibleCards.map((card) => ({
        ...card,
        imageUrl: cardImageUrl(card),
        favorite: isFavorite(card.id),
        selected: card.id === this.selectedId
      })),
      selectedCard: selectedCard ? { ...selectedCard, imageUrl: cardImageUrl(selectedCard), favorite: isFavorite(selectedCard.id) } : null
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    this._restoreSearchFocus(html);

    html.find("[name='query']").on("input", (event) => {
      const input = event.currentTarget;
      this.query = input.value;
      this.showCategories = false;
      this._restoreFocus = {
        name: input.name,
        start: input.selectionStart,
        end: input.selectionEnd
      };
      this.render();
    });

    html.find("[name='category']").on("change", (event) => {
      this.category = event.currentTarget.value || null;
      this.showCategories = false;
      this.folderId = null;
      this.selectedId = null;
      this.render();
    });

    html.find("[name='favoritesOnly']").on("change", (event) => {
      this.favoritesOnly = event.currentTarget.checked;
      this.showCategories = false;
      this.selectedId = null;
      this.render();
    });

    html.find("[data-action='select-category']").on("click", (event) => {
      this.category = event.currentTarget.dataset.category;
      this.showCategories = false;
      this.folderId = null;
      this.selectedId = null;
      this.render();
    });

    html.find("[data-action='show-categories']").on("click", () => {
      this.showCategories = true;
      this.query = "";
      this.category = null;
      this.folderId = null;
      this.selectedId = null;
      this.render();
    });

    html.find("[data-action='select-folder']").on("click", (event) => {
      event.preventDefault();
      this.folderId = event.currentTarget.dataset.folderId;
      this.selectedId = null;
      this.render();
    });

    html.find("[data-action='new-folder']").on("click", () => this._onCreateFolder());
    html.find("[data-action='edit-folder']").on("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._onEditFolder(event.currentTarget.dataset.folderId);
    });
    html.find("[data-action='delete-folder']").on("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._onDeleteFolder(event.currentTarget.dataset.folderId);
    });

    html.find(".describe-card-row").on("click", (event) => {
      this.selectedId = event.currentTarget.dataset.cardId;
      this.render();
    });

    html.find("[data-action='open-card']").on("click", (event) => {
      DescribeViewerApp.open(event.currentTarget.dataset.cardId);
    });

    html.find("[data-action='toggle-favorite']").on("click", async (event) => {
      event.preventDefault();
      event.stopPropagation();
      await toggleFavorite(event.currentTarget.dataset.cardId);
      this.render();
    });

    html.find("[data-action='show-card']").on("click", (event) => {
      showCardToPlayers(event.currentTarget.dataset.cardId);
    });

    html.find("[data-action='new-card']").on("click", () => {
      new DescribeEditorApp(null, {
        parent: this,
        category: this.category ?? "Монстры",
        folderId: this.folderId
      }).render(true);
    });

    html.find("[data-action='edit-card']").on("click", (event) => {
      new DescribeEditorApp(event.currentTarget.dataset.cardId, { parent: this }).render(true);
    });
  }

  async _onCreateFolder() {
    if (!userCanEdit() || !this.category) return;
    const name = await promptFolderName({ title: "Новая папка" });
    if (!name) return;
    const folders = getFolders();
    const folder = {
      id: randomId(),
      category: this.category,
      name,
      sort: folders.filter((folder) => folder.category === this.category).length
    };
    folders.push(folder);
    await setFolders(folders);
    this.folderId = folder.id;
    this.selectedId = null;
    this.render();
  }

  async _onEditFolder(folderId) {
    if (!userCanEdit()) return;
    const folders = getFolders();
    const folder = folders.find((entry) => entry.id === folderId);
    if (!folder) return;
    const name = await promptFolderName({ title: "Переименовать папку", name: folder.name });
    if (!name) return;
    folder.name = name;
    await setFolders(folders);
    this.render();
  }

  async _onDeleteFolder(folderId) {
    if (!userCanEdit()) return;
    const folders = getFolders();
    const folder = folders.find((entry) => entry.id === folderId);
    if (!folder) return;

    const confirmed = await Dialog.confirm({
      title: "Удалить папку",
      content: `<p>Удалить папку <strong>${folder.name}</strong>? Карточки будут перенесены в "${GENERAL_FOLDER_NAME}".</p>`
    });
    if (!confirmed) return;

    let fallback = folders.find((entry) => entry.category === folder.category && entry.name === GENERAL_FOLDER_NAME && entry.id !== folder.id);
    if (!fallback) {
      fallback = {
        id: randomId(),
        category: folder.category,
        name: GENERAL_FOLDER_NAME,
        sort: 0
      };
      folders.push(fallback);
    }

    const cards = getCards().map((card) => card.folderId === folder.id ? { ...card, folderId: fallback.id } : card);
    const deletedFolders = new Set(getDeletedFolderIds());
    if (generatedFolders.some((entry) => entry.id === folder.id)) deletedFolders.add(folder.id);
    await setCards(cards);
    await setFolders(folders.filter((entry) => entry.id !== folder.id));
    await setDeletedFolderIds([...deletedFolders]);
    this.folderId = fallback.id;
    this.render();
  }

  _restoreSearchFocus(html) {
    if (!this._restoreFocus) return;
    const restore = this._restoreFocus;
    this._restoreFocus = null;
    window.setTimeout(() => {
      const input = html.find(`[name='${restore.name}']`).get(0);
      if (!input) return;
      input.focus();
      input.setSelectionRange?.(restore.start ?? input.value.length, restore.end ?? input.value.length);
    }, 0);
  }
}

class DescribeViewerApp extends Application {
  static open(cardId, options = {}) {
    const card = getCards().find((entry) => entry.id === cardId);
    if (!card) {
      ui.notifications.warn("Карточка описания не найдена.");
      return null;
    }
    if (!options.skipPermissionCheck && !userCanOpen()) {
      ui.notifications.warn("У вас нет прав на просмотр карточек Describe.");
      return null;
    }
    return new this(card, options).render(true);
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "describe-viewer",
      title: MODULE_TITLE,
      template: moduleUrl("templates/viewer.hbs"),
      width: 820,
      height: 520,
      resizable: true,
      classes: ["describe-window", "describe-viewer-window"]
    });
  }

  constructor(card, options = {}) {
    super(options);
    this.card = normalizeCard(card);
  }

  get title() {
    return this.card.title;
  }

  async getData() {
    return {
      ...this.card,
      imageUrl: cardImageUrl(this.card)
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    this._activateDragListeners(html);
    html.find("[data-action='close-viewer']").on("click", () => this.close());
  }

  _activateDragListeners(html) {
    const handle = html.is(".describe-viewer") ? html.get(0) : html.find(".describe-viewer").get(0);
    if (!handle) return;

    handle.addEventListener("mousedown", (event) => {
      if (event.button !== 0) return;
      if (event.target.closest("button, input, textarea, select, a")) return;

      const element = this.element?.get?.(0);
      if (!element) return;

      event.preventDefault();
      const startRect = element.getBoundingClientRect();
      const startX = event.clientX;
      const startY = event.clientY;

      const onMove = (moveEvent) => {
        moveEvent.preventDefault();
        const left = Math.max(0, startRect.left + moveEvent.clientX - startX);
        const top = Math.max(0, startRect.top + moveEvent.clientY - startY);

        this.setPosition({
          left,
          top
        });

        element.style.left = `${left}px`;
        element.style.top = `${top}px`;
        element.style.right = "auto";
        element.style.bottom = "auto";
        element.style.position = "absolute";
      };

      const onUp = () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };

      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp, { once: true });
    });
  }
}

class DescribeEditorApp extends Application {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      id: "describe-editor",
      title: "Редактор описания",
      template: moduleUrl("templates/editor.hbs"),
      width: 620,
      height: "auto",
      resizable: true,
      classes: ["describe-window"]
    });
  }

  constructor(cardId = null, options = {}) {
    super(options);
    this.cardId = cardId;
    this.parentApp = options.parent;
    this.initialCategory = options.category ?? "Монстры";
    this.initialFolderId = options.folderId ?? null;
  }

  get card() {
    const existing = getCards().find((entry) => entry.id === this.cardId);
    return normalizeCard(existing ?? {
      id: randomId(),
      title: "",
      category: this.initialCategory,
      folderId: this.initialFolderId,
      tags: [],
      image: defaultImageForCategory(this.initialCategory),
      description: ""
    });
  }

  async getData() {
    const card = this.card;
    const customCategories = getCards()
      .map((entry) => entry.category)
      .filter((category) => !CATEGORY_DEFS.some((entry) => entry.name === category));
    const categories = [...new Set([...CATEGORY_DEFS.map((entry) => entry.name), ...customCategories])];

    return {
      card: { ...card, imageUrl: cardImageUrl(card) },
      categories: categories.map((name) => ({ name, selected: name === card.category })),
      folders: folderOptions(card.category, card.folderId),
      backgroundOptions: backgroundChoices(card.category, card.image),
      tags: card.tags.join(", "),
      canDelete: Boolean(this.cardId)
    };
  }

  activateListeners(html) {
    super.activateListeners(html);
    const form = html.is("form") ? html : html.find("form");
    form.on("submit", this._onSubmitForm.bind(this));
    html.find("[data-action='delete-card']").on("click", this._onDeleteCard.bind(this));
    html.find("[name='category']").on("change", this._onCategoryChange.bind(this));
    html.find("[name='backgroundChoice']").on("change", this._onBackgroundChoice.bind(this));
    html.find("[data-action='browse-background']").on("click", this._onBrowseBackground.bind(this));
    html.find("[data-action='upload-background']").on("click", this._onUploadBackground.bind(this));
    html.find("[name='image']").on("input", (event) => this._setPreview(html, event.currentTarget.value));
  }

  _onCategoryChange(event) {
    const category = event.currentTarget.value || "Разное";
    const image = defaultImageForCategory(category);
    const form = event.currentTarget.form;
    form.elements.image.value = image;
    const folders = folderOptions(category);
    const folderSelect = form.elements.folderId;
    folderSelect.innerHTML = folders.map((folder, index) => `<option value="${folder.id}" ${index === 0 ? "selected" : ""}>${folder.name}</option>`).join("");
    const select = form.elements.backgroundChoice;
    const options = backgroundChoices(category, image);
    select.innerHTML = options.map((entry) => `<option value="${entry.path}" ${entry.selected ? "selected" : ""}>${entry.label}</option>`).join("");
    this._setPreview($(form), image);
  }

  _onBackgroundChoice(event) {
    const image = event.currentTarget.value;
    const form = event.currentTarget.form;
    form.elements.image.value = image;
    this._setPreview($(form), image);
  }

  async _onBrowseBackground(event) {
    event.preventDefault();
    const form = event.currentTarget.closest("form");
    new FilePicker({
      type: "image",
      callback: (path) => {
        form.elements.image.value = path;
        this._setPreview($(form), path);
      }
    }).render(true);
  }

  async _onUploadBackground(event) {
    event.preventDefault();
    const form = event.currentTarget.closest("form");
    const input = form.querySelector("[name='upload']");
    const file = input?.files?.[0];
    if (!file) return ui.notifications.warn("Выберите файл изображения для загрузки.");

    try {
      await FilePicker.createDirectory("data", CUSTOM_BACKGROUND_DIR, {});
    } catch (_error) {
      // Directory may already exist.
    }

    try {
      const result = await FilePicker.upload("data", CUSTOM_BACKGROUND_DIR, file, {}, { notify: true });
      const path = result.path ?? `${CUSTOM_BACKGROUND_DIR}/${file.name}`;
      form.elements.image.value = path;
      this._setPreview($(form), path);
      ui.notifications.info("Фон загружен.");
    } catch (error) {
      console.error(`${MODULE_TITLE} | Background upload failed`, error);
      ui.notifications.error("Не удалось загрузить фон. Проверьте права на загрузку файлов.");
    }
  }

  _setPreview(html, path) {
    html.find(".describe-editor__preview").css("background-image", `url("${imageUrl(path)}")`);
  }

  async _onSubmitForm(event) {
    event.preventDefault();
    if (!userCanEdit()) return;

    const formData = new FormData(event.currentTarget);
    const category = formData.get("category");
    const image = formData.get("image") || formData.get("backgroundChoice") || defaultImageForCategory(category);
    const card = normalizeCard({
      id: this.card.id,
      title: formData.get("title"),
      category,
      folderId: formData.get("folderId"),
      tags: formData.get("tags"),
      image,
      description: formData.get("description")
    });

    const cards = getCards();
    const index = cards.findIndex((entry) => entry.id === card.id);
    if (index >= 0) cards[index] = card;
    else cards.push(card);

    await setCards(cards);
    ui.notifications.info("Описание сохранено.");
    this.parentApp?.render();
    this.close();
  }

  async _onDeleteCard(event) {
    event.preventDefault();
    if (!userCanEdit() || !this.cardId) return;
    const confirmed = await Dialog.confirm({
      title: "Удалить описание",
      content: "<p>Удалить эту карточку описания?</p>"
    });
    if (!confirmed) return;
    const stored = getStoredCards().filter((entry) => entry.id !== this.cardId);
    const deleted = new Set(getDeletedCardIds());
    if (baseCards.some((entry) => entry.id === this.cardId)) deleted.add(this.cardId);
    await setCards(stored);
    await setDeletedCardIds([...deleted]);
    ui.notifications.info("Описание удалено.");
    this.parentApp?.render();
    this.close();
  }
}

function openLibrary() {
  if (!userCanOpen()) {
    ui.notifications.warn("У вас нет прав на открытие Describe.");
    return;
  }
  if (!game.describe?.library) game.describe.library = new DescribeLibraryApp();
  game.describe.library.render(true);
}

async function chooseRecipients() {
  const users = game.users
    .filter((user) => !user.isGM && user.id !== game.userId)
    .sort((a, b) => a.name.localeCompare(b.name, "ru"));

  if (!users.length) {
    ui.notifications.warn("В мире нет игроков, которым можно показать карточку.");
    return [];
  }

  const rows = users.map((user) => `
    <label class="describe-recipient-row">
      <input type="checkbox" name="users" value="${user.id}" checked>
      <span>${escapeHtml(user.name)}</span>
      <em>${user.active ? "онлайн" : "офлайн"}</em>
    </label>
  `).join("");

  return new Promise((resolve) => {
    new Dialog({
      title: "Показать игрокам",
      content: `
        <form class="describe-recipient-dialog">
          <label class="describe-recipient-row describe-recipient-row--all">
            <input type="checkbox" name="all" checked>
            <span>Все игроки</span>
          </label>
          <div class="describe-recipient-list">${rows}</div>
        </form>
      `,
      buttons: {
        show: {
          icon: '<i class="fas fa-eye"></i>',
          label: "Показать",
          callback: (html) => {
            const all = html.find("[name='all']").is(":checked");
            if (all) return resolve(users.map((user) => user.id));
            const selected = html.find("[name='users']:checked").map((_index, input) => input.value).get();
            resolve(selected);
          }
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "Отмена",
          callback: () => resolve([])
        }
      },
      default: "show",
      render: (html) => {
        html.find("[name='all']").on("change", (event) => {
          html.find("[name='users']").prop("checked", event.currentTarget.checked);
        });
        html.find("[name='users']").on("change", () => {
          const inputs = html.find("[name='users']");
          const checked = html.find("[name='users']:checked");
          html.find("[name='all']").prop("checked", inputs.length === checked.length);
        });
      },
      close: () => resolve([])
    }).render(true);
  });
}

async function showCardToPlayers(cardId) {
  if (!userCanShow()) {
    ui.notifications.warn("У вас нет прав показывать карточки другим игрокам.");
    return;
  }
  const card = getCards().find((entry) => entry.id === cardId);
  if (!card) return ui.notifications.warn("Карточка описания не найдена.");

  const recipients = await chooseRecipients();
  if (!recipients.length) return;

  game.socket.emit(`module.${MODULE_ID}`, {
    type: "showCard",
    cardId,
    senderId: game.userId,
    recipients
  });
  ui.notifications.info("Карточка отправлена выбранным игрокам.");
}

Hooks.once("init", () => {
  game.settings.register(MODULE_ID, CARD_SETTING, {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });

  game.settings.register(MODULE_ID, FOLDER_SETTING, {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });

  game.settings.register(MODULE_ID, PERMISSIONS_SETTING, {
    scope: "world",
    config: false,
    type: Object,
    default: DEFAULT_PERMISSIONS
  });

  game.settings.register(MODULE_ID, FAVORITES_SETTING, {
    scope: "client",
    config: false,
    type: Array,
    default: []
  });

  game.settings.register(MODULE_ID, DELETED_CARDS_SETTING, {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });

  game.settings.register(MODULE_ID, DELETED_FOLDERS_SETTING, {
    scope: "world",
    config: false,
    type: Array,
    default: []
  });

  game.settings.registerMenu(MODULE_ID, "permissionsMenu", {
    name: "Права Describe",
    label: "Настроить права",
    hint: "Кто может открывать библиотеку Describe и показывать карточки другим игрокам.",
    icon: "fas fa-user-shield",
    type: DescribePermissionsConfig,
    restricted: true
  });
});

Hooks.once("ready", async () => {
  try {
    await loadBaseData();
  } catch (error) {
    console.error(`${MODULE_TITLE} | Failed to load generated card library`, error);
    ui.notifications.error("Describe: не удалось загрузить базу карточек.");
  }

  game.describe = {
    openLibrary,
    showCard: showCardToPlayers,
    apps: {
      DescribeLibraryApp,
      DescribeViewerApp,
      DescribeEditorApp
    }
  };

  if (game.user?.isGM) {
    try {
      await ensureFoldersAndCardLinks();
    } catch (error) {
      console.error(`${MODULE_TITLE} | Failed to initialize default cards`, error);
      ui.notifications.error("Describe: не удалось загрузить стартовые описания.");
    }
  }

  game.socket.on(`module.${MODULE_ID}`, (message) => {
    if (message?.type !== "showCard") return;
    if (message.senderId === game.userId) return;
    if (!message.recipients?.includes(game.userId)) return;
    DescribeViewerApp.open(message.cardId, { skipPermissionCheck: true });
  });
});

Hooks.on("getSceneControlButtons", (controls) => {
  if (!userCanOpen()) return;

  const button = {
    name: "describe",
    title: "Describe",
    icon: "fas fa-book-open",
    button: true,
    onClick: openLibrary,
    onChange: openLibrary
  };

  if (controls.notes?.tools) {
    controls.notes.tools.describe = button;
    return;
  }

  const notesControls = controls.find?.((control) => control.name === "notes" || control.name === "journal");
  if (notesControls) notesControls.tools.push(button);
});
