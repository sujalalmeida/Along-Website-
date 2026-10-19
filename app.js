const demo = document.querySelector("#demo");
const viewport = document.querySelector("#map-viewport");
const track = document.querySelector("#map-track");
const overview = document.querySelector("#overview-bars");
const navigator = document.querySelector("#navigator");
const status = document.querySelector("#demo-status");
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const add = document.querySelector("#add-window");
const changeWidth = document.querySelector("#change-width");
const toggle = document.querySelector("#toggle-row");
const reset = document.querySelector("#reset-demo");
const motion = matchMedia("(prefers-reduced-motion: reduce)");
const initialWindows = [
  {
    id: 1,
    title: "Notes",
    width: 220,
    color: "#dcd8f0",
    symbol: "≡",
    x: 80,
    y: 36,
  },
  {
    id: 2,
    title: "Editor",
    width: 330,
    color: "#dce5f8",
    symbol: "⌘",
    x: 370,
    y: 116,
  },
  {
    id: 3,
    title: "Browser",
    width: 265,
    color: "#dae8dc",
    symbol: "↗",
    x: 710,
    y: 45,
  },
  {
    id: 4,
    title: "Music",
    width: 180,
    color: "#eedce0",
    symbol: "♫",
    x: 200,
    y: 160,
  },
];
let windows = structuredClone(initialWindows);
let selected = 1;
let sequence = 4;
let running = true;
let positions = [];
const limit = 12;
function createTile(item) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "map-tile";
  button.dataset.id = item.id;
  button.style.setProperty("--tile-color", item.color);
  button.innerHTML = `<span class="tile-top"><span class="tile-number">${String(item.id).padStart(2, "0")}</span><span class="selected-label">Selected</span><span class="tile-symbol" aria-hidden="true">${item.symbol}</span></span><span class="tile-title">${item.title}</span><span class="tile-width"></span>`;
  button.addEventListener("click", () =>
    select(windows.findIndex((w) => w.id === item.id)),
  );
  return button;
}
function layout(instant = false) {
  const mobile = viewport.clientWidth < 600;
  const height = mobile ? 150 : 159;
  const top = mobile ? 78 : 85;
  const scale = viewport.clientWidth / 1000;
  let left = Math.max(24, (viewport.clientWidth - windows[0].width) / 2);
  positions = [];
  windows.forEach((item, index) => {
    const tile = track.children[index];
    const width = running ? item.width : item.originalWidth * scale;
    const x = running ? left : item.x * scale;
    const y = running ? top : 35 + item.y * (mobile ? 0.62 : 0.72);
    tile.style.width = `${width}px`;
    tile.style.height = `${running ? height : Math.max(74, 105 * scale)}px`;
    tile.style.transform = `translate(${x}px, ${running ? 0 : y}px)`;
    positions.push({ left: x, width });
    if (running) left += item.width + 18;
  });
  track.style.width = running
    ? `${left + Math.max(24, (viewport.clientWidth - windows.at(-1).width) / 2)}px`
    : "100%";
  if (!running) viewport.scrollTo({ left: 0, behavior: "instant" });
  else centerSelection(instant);
}
function centerSelection(instant = false) {
  if (!running) return;
  const p = positions[selected];
  viewport.scrollTo({
    left: Math.max(0, p.left - (viewport.clientWidth - p.width) / 2),
    behavior: instant || motion.matches ? "instant" : "smooth",
  });
}
function update(message) {
  demo.dataset.mode = running ? "row" : "restored";
  windows.forEach((item, index) => {
    const tile = track.children[index];
    tile.setAttribute(
      "aria-label",
      `Select ${item.title}, window ${index + 1}`,
    );
    tile.setAttribute("aria-pressed", String(index === selected));
    tile.tabIndex = index === selected ? 0 : -1;
    tile.querySelector(".tile-width").textContent =
      `${running ? item.width : item.originalWidth} px`;
  });
  overview.replaceChildren();
  windows.forEach((item, index) => {
    const piece = document.createElement("span");
    piece.className = "overview-piece";
    piece.style.flex = `${running ? item.width : item.originalWidth} 1 0`;
    piece.style.setProperty("--tile-color", item.color);
    piece.dataset.selected = String(index === selected);
    overview.append(piece);
  });
  previous.disabled = !running || selected === 0;
  next.disabled = !running || selected === windows.length - 1;
  add.disabled = !running || windows.length >= limit;
  add.title =
    windows.length >= limit
      ? "Demo limit of 12 windows reached. Reset the demo to start again."
      : "Insert after the selected window";
  changeWidth.disabled = !running;
  navigator.disabled = !running;
  navigator.max = windows.length - 1;
  navigator.value = selected;
  navigator.setAttribute(
    "aria-valuetext",
    `${windows[selected].title}, window ${selected + 1} of ${windows.length}`,
  );
  toggle.disabled = reset.disabled = false;
  toggle.querySelector("span").textContent = running
    ? "Stop & restore"
    : "Start row";
  document.querySelector(".overview-title > span:first-child").textContent =
    running ? "The whole row" : "Original widths";
  document.querySelector("#mode-label").textContent = running
    ? "Row running"
    : "Original layout restored";
  document.querySelector("#window-count").textContent =
    `${windows.length} windows`;
  document.querySelector("#stage-caption").textContent = running
    ? "One row. Room beyond the edge."
    : "Each window returns to its original place.";
  status.textContent =
    message ||
    `${windows[selected].title} selected. Window ${selected + 1} of ${windows.length}. ${running ? "New windows join after this block." : "The original positions and widths are restored."}`;
}
function render(message, instant = false) {
  windows.forEach((item) => {
    if (!item.originalWidth) item.originalWidth = item.width;
  });
  const existing = new Map(
    [...track.children].map((el) => [Number(el.dataset.id), el]),
  );
  windows.forEach((item, index) => {
    const tile = existing.get(item.id) || createTile(item);
    if (track.children[index] !== tile)
      track.insertBefore(tile, track.children[index] || null);
  });
  [...track.children].forEach((el) => {
    if (!windows.some((w) => w.id === Number(el.dataset.id))) el.remove();
  });
  update(message);
  layout(instant);
}
function select(index) {
  selected = Math.max(0, Math.min(index, windows.length - 1));
  update();
  centerSelection();
}
function addWindow() {
  if (!running || windows.length >= limit) return;
  sequence++;
  windows.splice(selected + 1, 0, {
    id: sequence,
    title: `New window ${sequence - 4}`,
    width: 250,
    originalWidth: 250,
    color: "#e8e0f4",
    symbol: "+",
    x: 65 + ((sequence * 167) % 650),
    y: 30 + ((sequence * 53) % 145),
  });
  selected++;
  render(
    `New window ${sequence - 4} inserted after the selected window. Existing windows kept their widths.${windows.length === limit ? " Demo limit reached. Use Reset demo to start again." : ""}`,
  );
}
function cycleWidth() {
  if (!running) return;
  const item = windows[selected];
  item.width = item.width < 300 ? 330 : item.width < 400 ? 440 : 220;
  render(
    `${item.title} is now ${item.width} px wide. All other window widths are unchanged.`,
  );
}
function toggleRow() {
  running = !running;
  if (running)
    windows.forEach((item) => {
      item.width = item.originalWidth;
    });
  render(
    running
      ? "Row started. Select a block or move along the row."
      : "Row stopped. All windows returned to their original positions and widths.",
    true,
  );
}
previous.addEventListener("click", () => select(selected - 1));
next.addEventListener("click", () => select(selected + 1));
add.addEventListener("click", addWindow);
changeWidth.addEventListener("click", cycleWidth);
toggle.addEventListener("click", toggleRow);
reset.addEventListener("click", () => {
  windows = structuredClone(initialWindows);
  selected = 1;
  sequence = 4;
  running = true;
  render("Demo reset. Four windows, with Editor selected.", true);
});
navigator.addEventListener("input", () => select(Number(navigator.value)));
// Shortcuts only apply within the model. Modified shortcuts belong to the user's OS.
demo.addEventListener("keydown", (event) => {
  if (
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.shiftKey ||
    event.target === navigator ||
    !running
  )
    return;
  let index;
  if (event.key === "ArrowLeft") index = selected - 1;
  else if (event.key === "ArrowRight") index = selected + 1;
  else if (event.key === "Home") index = 0;
  else if (event.key === "End") index = windows.length - 1;
  else return;
  event.preventDefault();
  const tileHadFocus = event.target.classList.contains("map-tile");
  select(index);
  if (tileHadFocus) track.children[selected].focus({ preventScroll: true });
});
let startTouch = null;
viewport.addEventListener(
  "touchstart",
  (event) => {
    startTouch =
      event.touches.length === 1
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : null;
  },
  { passive: true },
);
viewport.addEventListener(
  "touchend",
  (event) => {
    if (!startTouch || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - startTouch.x;
    const dy = event.changedTouches[0].clientY - startTouch.y;
    if (running && Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.3)
      select(selected + (dx < 0 ? 1 : -1));
    startTouch = null;
  },
  { passive: true },
);
viewport.addEventListener(
  "touchcancel",
  () => {
    startTouch = null;
  },
  { passive: true },
);
new ResizeObserver(() => layout(true)).observe(viewport);
render(undefined, true);
