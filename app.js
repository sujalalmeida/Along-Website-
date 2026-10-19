const demo = document.querySelector("#demo");
const viewport = document.querySelector("#window-viewport");
const row = document.querySelector("#window-row");
const map = document.querySelector("#row-map");
const status = document.querySelector("#demo-status");
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");
const add = document.querySelector("#add-window");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const windows = [
  { id: 1, title: "Notes", width: 252, type: "notes" },
  { id: 2, title: "Code", width: 365, type: "code" },
  { id: 3, title: "Browser", width: 308, type: "browser" },
  { id: 4, title: "Music", width: 226, type: "music" },
];
let selected = 1;
let sequence = 4;
const maxWindows = 12;
const contents = {
  notes: `<div class="notes-content"><span class="note-date">A quiet Monday</span><h3>A little space<br>to think.</h3><div class="note-line"></div><div class="note-line short"></div><div class="note-check done">Make a little room</div><div class="note-check done">Keep the good ideas close</div><div class="note-check">See where the day goes</div></div>`,
  code: `<div class="code-content"><div class="code-sidebar" aria-hidden="true"><span>▤</span><span>⌕</span><span>⑂</span></div><div class="code-body"><div class="code-filename">workspace.js</div><span class="comment">// A place for everything.</span>\n<span class="keyword">const</span> workspace = {\n  direction: <span class="value">'horizontal'</span>,\n  breathingRoom: <span class="orange">true</span>,\n  windows: [\n    <span class="value">'ideas'</span>, <span class="value">'work'</span>, <span class="value">'a little music'</span>\n  ]\n};\n\n<span class="keyword">makeRoom</span>(workspace);</div></div>`,
  browser: `<div class="browser-bar"><span>‹ &nbsp; ›</span><span class="url-bar">fieldnotes.example</span><span>↻</span></div><div class="browser-page"><h3>Somewhere, outside.</h3><p>Notes from the slower side of life.</p><svg class="landscape" viewBox="0 0 300 140" preserveAspectRatio="xMidYMid slice" aria-label="Original illustration of hills and an orange sun" role="img"><rect width="300" height="140" fill="#e7dfcc"/><circle cx="228" cy="40" r="20" fill="#c9794a"/><path d="M0 95Q60 9 143 80T300 56V140H0Z" fill="#b2b79d"/><path d="M0 106Q90 64 168 111T300 75V140H0Z" fill="#7b896d"/><path d="M0 125Q93 97 152 131T300 110V140H0Z" fill="#56694e"/><path d="M161 140Q205 111 184 99Q176 94 186 88" fill="none" stroke="#d8cbb1" stroke-width="3"/></svg></div>`,
  music: `<div class="music-content"><div class="record-sleeve" aria-hidden="true"><div class="record"></div></div><h3>Slow afternoon</h3><p>A little background music</p><div class="music-progress" aria-hidden="true"></div><div class="music-controls" aria-hidden="true">‹ ▮▮ ›</div></div>`,
  terminal: `<div class="terminal-content"><span>~</span> make room<br><br>✓ Notes in place<br>✓ Ideas close by<br>✓ A little room to work<br><br><span>~</span> ready _</div>`,
};
function createWindow(item) {
  const article = document.createElement("article");
  article.className = `app-window ${item.type}-window`;
  article.style.setProperty("--window-width", `${item.width}px`);
  article.dataset.id = item.id;
  article.setAttribute("aria-label", `${item.title} example window`);
  article.innerHTML = `<div class="window-titlebar"><span class="traffic-lights" aria-hidden="true"><i></i><i></i><i></i></span><span>${item.title}</span><span class="window-size">${item.width}px</span></div><div class="window-content">${contents[item.type]}</div>`;
  article.addEventListener("click", () =>
    select(windows.findIndex((w) => w.id === item.id)),
  );
  return article;
}
function render() {
  // Keep existing DOM windows and widths intact when inserting a new one.
  for (const item of windows) {
    if (!row.querySelector(`[data-id="${item.id}"]`)) {
      row.insertBefore(
        createWindow(item),
        row.children[windows.indexOf(item)] ?? null,
      );
    }
  }
  map.replaceChildren();
  windows.forEach((item, index) => {
    const button = document.createElement("button");
    button.className = "map-button";
    button.style.setProperty("--map-width", `${Math.round(item.width / 11)}px`);
    button.setAttribute(
      "aria-label",
      `Select ${item.title}, window ${index + 1}`,
    );
    button.addEventListener("click", () => select(index));
    map.append(button);
  });
  document.querySelector("#window-count").textContent =
    `${windows.length} windows`;
  add.disabled = windows.length >= maxWindows;
  add.title = add.disabled
    ? "Demo limit of 12 windows reached. Reload to reset."
    : "Insert a window after the selected one";
  updateSelection();
}
function updateSelection(message) {
  [...row.children].forEach((element, index) => {
    element.dataset.selected = index === selected;
  });
  [...map.children].forEach((button, index) => {
    button.setAttribute("aria-pressed", String(index === selected));
  });
  previous.disabled = selected === 0;
  next.disabled = selected === windows.length - 1;
  const item = windows[selected];
  status.textContent =
    message ||
    `${item.title} selected. Window ${selected + 1} of ${windows.length}. New windows join after your selection.`;
}
function centerSelection(instant = false) {
  const element = row.children[selected];
  const left =
    element.offsetLeft -
    row.offsetLeft -
    (viewport.clientWidth - element.clientWidth) / 2;
  viewport.scrollTo({
    left: Math.max(0, left),
    behavior: instant || reducedMotion.matches ? "instant" : "smooth",
  });
}
function select(index) {
  selected = Math.max(0, Math.min(index, windows.length - 1));
  updateSelection();
  centerSelection();
}
function addWindow() {
  if (windows.length >= maxWindows) return;
  sequence += 1;
  const item = {
    id: sequence,
    title: `Terminal ${sequence - 4}`,
    width: 286,
    type: "terminal",
  };
  windows.splice(selected + 1, 0, item);
  selected += 1;
  render();
  centerSelection();
  updateSelection(
    `${item.title} added after the selected window. Window ${selected + 1} of ${windows.length}. Existing windows kept their widths.${windows.length === maxWindows ? " Demo limit reached; reload to reset." : ""}`,
  );
}
previous.addEventListener("click", () => select(selected - 1));
next.addEventListener("click", () => select(selected + 1));
add.addEventListener("click", addWindow);
// Browser demo shortcuts apply only while focus is inside this region.
demo.addEventListener("keydown", (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
    event.preventDefault();
    select(selected + (event.key === "ArrowLeft" ? -1 : 1));
  } else if (event.key === "Home" || event.key === "End") {
    event.preventDefault();
    select(event.key === "Home" ? 0 : windows.length - 1);
  }
});
let touchX = null;
let touchY = null;
viewport.addEventListener(
  "touchstart",
  (event) => {
    if (event.touches.length !== 1) return;
    touchX = event.touches[0].clientX;
    touchY = event.touches[0].clientY;
  },
  { passive: true },
);
viewport.addEventListener(
  "touchend",
  (event) => {
    if (touchX === null || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - touchX;
    const dy = event.changedTouches[0].clientY - touchY;
    if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(dy) * 1.3)
      select(selected + (dx < 0 ? 1 : -1));
    touchX = touchY = null;
  },
  { passive: true },
);
viewport.addEventListener(
  "touchcancel",
  () => {
    touchX = touchY = null;
  },
  { passive: true },
);
// Native horizontal scrolling remains available; vertical scrolling stays with the page.
new ResizeObserver(() => centerSelection(true)).observe(viewport);
render();
requestAnimationFrame(() => centerSelection(true));
