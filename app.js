// ------------------------------
// INITIAL FILE TREE
// ------------------------------
const fileTree = {
  name: "root",
  type: "folder",
  children: [
    {
      name: "Documents",
      type: "folder",
      children: [
        { name: "Resume.pdf", type: "file", size: "120 KB", modified: "2026-04-01" },
        { name: "Invoice-0426.xlsx", type: "file", size: "88 KB", modified: "2026-04-18" }
      ]
    },
    {
      name: "Media",
      type: "folder",
      children: [
        { name: "Track-01.wav", type: "file", size: "24 MB", modified: "2026-03-22" },
        { name: "Cover.png", type: "file", size: "2.1 MB", modified: "2026-02-10" }
      ]
    },
    {
      name: "Projects",
      type: "folder",
      children: [
        {
          name: "Wii-UI-FileManager",
          type: "folder",
          children: [
            { name: "index.html", type: "file", size: "8 KB", modified: "2026-04-20" },
            { name: "style.css", type: "file", size: "5 KB", modified: "2026-04-20" },
            { name: "app.js", type: "file", size: "7 KB", modified: "2026-04-20" }
          ]
        }
      ]
    }
  ]
};

// ------------------------------
// STATE
// ------------------------------
let currentPath = ["root"];
let currentView = "tiles";
let selectedName = null;
let searchQuery = "";

// ------------------------------
// DOM ELEMENTS
// ------------------------------
const clockText = document.getElementById("clock-text");
const breadcrumbEl = document.getElementById("breadcrumb");
const contentArea = document.getElementById("content-area");
const itemCountEl = document.getElementById("item-count");
const selectionCountEl = document.getElementById("selection-count");
const storageFillEl = document.getElementById("storage-fill");
const storageUsedEl = document.getElementById("storage-used");
const viewTilesBtn = document.getElementById("view-tiles");
const viewListBtn = document.getElementById("view-list");
const searchInput = document.getElementById("search-input");
const btnNewFolder = document.getElementById("btn-new-folder");
const btnRename = document.getElementById("btn-rename");
const btnDelete = document.getElementById("btn-delete");
const sidebarLocations = document.getElementById("sidebar-locations");
const sidebarNewFolder = document.getElementById("sidebar-new-folder");
const sidebarUpload = document.getElementById("sidebar-upload");

// ------------------------------
// CLOCK
// ------------------------------
function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  clockText.textContent = `${h}:${m}`;
}
updateClock();
setInterval(updateClock, 30000);

// ------------------------------
// FILE TREE HELPERS
// ------------------------------
function findNode(pathArr) {
  let node = fileTree;
  for (let i = 1; i < pathArr.length; i++) {
    if (!node.children) break;
    node = node.children.find((c) => c.name === pathArr[i]);
    if (!node) break;
  }
  return node || fileTree;
}

// ------------------------------
// BREADCRUMB
// ------------------------------
function buildBreadcrumb() {
  breadcrumbEl.innerHTML = "";
  currentPath.forEach((seg, idx) => {
    const span = document.createElement("div");
    span.className = "breadcrumb-seg" + (idx === currentPath.length - 1 ? " current" : "");
    span.textContent = idx === 0 ? "Home" : seg;

    if (idx < currentPath.length - 1) {
      span.style.cursor = "pointer";
      span.addEventListener("click", () => {
        currentPath = currentPath.slice(0, idx + 1);
        selectedName = null;
        render();
      });
    }

    breadcrumbEl.appendChild(span);

    if (idx < currentPath.length - 1) {
      const sep = document.createElement("span");
      sep.textContent = "›";
      breadcrumbEl.appendChild(sep);
    }
  });
}

// ------------------------------
// FILTER + SORT
// ------------------------------
function getVisibleItems() {
  const node = findNode(currentPath);
  let items = (node.children || []).slice();

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    items = items.filter((item) => item.name.toLowerCase().includes(q));
  }

  items.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return items;
}

// ------------------------------
// RENDER TILES
// ------------------------------
function renderTiles() {
  const items = getVisibleItems();
  const grid = document.createElement("div");
  grid.className = "tiles-grid";

  items.forEach((item, index) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.tabIndex = 0;
    tile.dataset.name = item.name;
    tile.dataset.index = index;

    if (item.name === selectedName) {
      tile.classList.add("selected", "focus-ring");
    }

    const icon = document.createElement("div");
    icon.className = "tile-icon" + (item.type === "file" ? " file" : "");
    icon.textContent = item.type === "folder" ? "📁" : "📄";

    const label = document.createElement("div");
    label.className = "tile-label";
    label.textContent = item.name;

    const meta = document.createElement("div");
    meta.className = "tile-meta";

    const pill = document.createElement("div");
    pill.className = "tile-pill";
    pill.textContent = item.type === "folder" ? "Folder" : (item.size || "File");

    const date = document.createElement("div");
    date.textContent = item.modified || "";

    meta.appendChild(pill);
    meta.appendChild(date);

    tile.appendChild(icon);
    tile.appendChild(label);
    tile.appendChild(meta);

    tile.addEventListener("click", () => handleItemClick(item));
    tile.addEventListener("dblclick", () => handleItemOpen(item));
    tile.addEventListener("focus", () => {
      selectedName = item.name;
      updateSelectionUI();
    });

    grid.appendChild(tile);
  });

  contentArea.innerHTML = "";
  contentArea.appendChild(grid);
  updateCounts(items.length);
}

// ------------------------------
// RENDER LIST
// ------------------------------
function renderList() {
  const items = getVisibleItems();
  const table = document.createElement("table");
  table.className = "list-view";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["Name", "Type", "Size", "Modified"].forEach((h) => {
    const th = document.createElement("th");
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  items.forEach((item, index) => {
    const row = document.createElement("tr");
    row.className = "list-row";
    row.dataset.name = item.name;
    row.dataset.index = index;

    if (item.name === selectedName) {
      row.classList.add("selected");
    }

    const nameCell = document.createElement("td");
    const nameWrap = document.createElement("div");
    nameWrap.className = "list-name";

    const icon = document.createElement("div");
    icon.className = "list-icon" + (item.type === "file" ? " file" : "");
    icon.textContent = item.type === "folder" ? "📁" : "📄";

    const label = document.createElement("span");
    label.textContent = item.name;

    nameWrap.appendChild(icon);
    nameWrap.appendChild(label);
    nameCell.appendChild(nameWrap);

    const typeCell = document.createElement("td");
    typeCell.textContent = item.type === "folder" ? "Folder" : "File";

    const sizeCell = document.createElement("td");
    sizeCell.textContent = item.type === "folder" ? "—" : (item.size || "—");

    const modCell = document.createElement("td");
    modCell.textContent = item.modified || "";

    row.appendChild(nameCell);
    row.appendChild(typeCell);
    row.appendChild(sizeCell);
    row.appendChild(modCell);

    row.addEventListener("click", () => handleItemClick(item));
    row.addEventListener("dblclick", () => handleItemOpen(item));

    tbody.appendChild(row);
  });

  table.appendChild(tbody);
  contentArea.innerHTML = "";
  contentArea.appendChild(table);
  updateCounts(items.length);
}

// ------------------------------
// MAIN RENDER
// ------------------------------
function render() {
  buildBreadcrumb();
  if (currentView === "tiles") renderTiles();
  else renderList();
  updateSelectionUI();
}

// ------------------------------
// UI HELPERS
// ------------------------------
function updateCounts(count) {
  itemCountEl.textContent = `${count} item${count === 1 ? "" : "s"}`;
}

function updateSelectionUI() {
  const items = getVisibleItems();
  const selected = items.find((i) => i.name === selectedName);
  selectionCountEl.textContent = selected ? `Selected: ${selected.name}` : "No items selected";
}

// ------------------------------
// ITEM ACTIONS
// ------------------------------
function handleItemClick(item) {
  selectedName = item.name;
  updateSelectionUI();
  render();
}

function handleItemOpen(item) {
  if (item.type === "folder") {
    currentPath.push(item.name);
    selectedName = null;
    render();
  }
}

function createNewFolder() {
  const node = findNode(currentPath);
  if (!node.children) node.children = [];

  let baseName = "New Folder";
  let name = baseName;
  let idx = 1;

  while (node.children.some((c) => c.name === name)) {
    name = `${baseName} ${idx++}`;
  }

  node.children.push({ name, type: "folder", children: [] });
  selectedName = name;
  render();
}

function renameSelected() {
  const node = findNode(currentPath);
  if (!node.children || !selectedName) return;

  const item = node.children.find((c) => c.name === selectedName);
  if (!item) return;

  const newName = prompt("Rename item:", item.name);
  if (!newName || !newName.trim()) return;

  if (node.children.some((c) => c !== item && c.name === newName.trim())) {
    alert("An item with that name already exists.");
    return;
  }

  item.name = newName.trim();
  selectedName = item.name;
  render();
}

function deleteSelected() {
  const node = findNode(currentPath);
  if (!node.children || !selectedName) return;

  const item = node.children.find((c) => c.name === selectedName);
  if (!item) return;

  const ok = confirm(`Delete "${item.name}"?`);
  if (!ok) return;

  node.children = node.children.filter((c) => c !== item);
  selectedName = null;
  render();
}

// ------------------------------
// STORAGE SIMULATION
// ------------------------------
function updateStorageUsage() {
  const usedPercent = 42 + Math.floor(Math.random() * 6) - 3;
  const clamped = Math.max(10, Math.min(90, usedPercent));
  storageFillEl.style.width = clamped + "%";
  storageUsedEl.textContent = `${clamped}% used`;
}
updateStorageUsage();
setInterval(updateStorageUsage, 15000);

// ------------------------------
// EVENTS
// ------------------------------
viewTilesBtn.addEventListener("click", () => {
  currentView = "tiles";
  viewTilesBtn.classList.add("active");
  viewListBtn.classList.remove("active");
  render();
});

viewListBtn.addEventListener("click", () => {
  currentView = "list";
  viewListBtn.classList.add("active");
  viewTilesBtn.classList.remove("active");
  render();
});

searchInput.addEventListener("input", (e) => {
  searchQuery = e.target.value;
  render();
});

btnNewFolder.addEventListener("click", createNewFolder);
sidebarNewFolder.addEventListener("click", createNewFolder);

btnRename.addEventListener("click", renameSelected);
btnDelete.addEventListener("click", deleteSelected);

sidebarUpload.addEventListener("click", () => {
  alert("Upload is a stub in this demo. Wire it to your backend or File API.");
});

sidebarLocations.addEventListener("click", (e) => {
  const item = e.target.closest(".sidebar-item");
  if (!item) return;

  const path = item.dataset.path;
  if (!path) return;

  currentPath = path.split("/");
  selectedName = null;

  sidebarLocations.querySelectorAll(".sidebar-item").forEach((el) => el.classList.remove("active"));
  item.classList.add("active");

  render();
});

// ------------------------------
// KEYBOARD NAVIGATION (Wii-style)
// ------------------------------
document.addEventListener("keydown", (e) => {
  const items = getVisibleItems();
  if (!items.length) return;

  const indexOfSelected = items.findIndex((i) => i.name === selectedName);
  let idx = indexOfSelected === -1 ? 0 : indexOfSelected;

  if (e.key === "ArrowRight") {
    idx = (idx + 1) % items.length;
    selectedName = items[idx].name;
    render();
    focusCurrentTile(idx);
    e.preventDefault();
  } else if (e.key === "ArrowLeft") {
    idx = (idx - 1 + items.length) % items.length;
    selectedName = items[idx].name;
    render();
    focusCurrentTile(idx);
    e.preventDefault();
  } else if (e.key === "ArrowDown") {
    if (currentView === "tiles") {
      const cols = Math.max(1, Math.floor(contentArea.clientWidth / 130));
      idx = Math.min(items.length - 1, idx + cols);
    } else {
      idx = Math.min(items.length - 1, idx + 1);
    }
    selectedName = items[idx].name;
    render();
    focusCurrentTile(idx);
    e.preventDefault();
  } else if (e.key === "ArrowUp") {
    if (currentView === "tiles") {
      const cols = Math.max(1, Math.floor(contentArea.clientWidth / 130));
      idx = Math.max(0, idx - cols);
    } else {
      idx = Math.max(0, idx - 1);
    }
    selectedName = items[idx].name;
    render();
    focusCurrentTile(idx);
    e.preventDefault();
  } else if (e.key === "Enter") {
    const item = items[idx];
    if (item) handleItemOpen(item);
    e.preventDefault();
  } else if (e.key === "Delete") {
    deleteSelected();
    e.preventDefault();
  } else if (e.key === "F2") {
    renameSelected();
    e.preventDefault();
  }
});

function focusCurrentTile(idx) {
  if (currentView === "tiles") {
    const tiles = contentArea.querySelectorAll(".tile");
    if (tiles[idx]) tiles[idx].focus();
  } else {
    const rows = contentArea.querySelectorAll(".list-row");
    if (rows[idx]) rows[idx].scrollIntoView({ block: "nearest" });
  }
}

// ------------------------------
// INITIAL RENDER
// ------------------------------
render();
