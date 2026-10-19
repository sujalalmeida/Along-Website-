# TileMe website

Public website for TileMe, an independent, free and open-source macOS scrolling window manager. Website files only; no native application code.

## Preview

```sh
npm install
npm run dev
```

Open http://127.0.0.1:4173. The local static server uses Python 3.

## Build

```sh
npm run build
```

Deploy `dist/` to a static host. Production has no runtime dependencies or external font requests. `.openai/hosting.json` records the existing Sites deployment. Sora is self-hosted under its included SIL Open Font License.

## Browser checks

```sh
npx playwright install chromium
npm test
```

Fifteen tests cover insertion order, unchanged neighboring widths, individual width changes, restoration, restart, reset, keyboard scope and focus, the overview slider, native horizontal scrolling, touch gestures, reduced motion, exact release URLs, metadata, and readable product information without JavaScript. Layout and axe WCAG checks run at 320, 390, 768, 1024 and 1440 pixels in both row and restored states.

## Desktop map

The demonstration uses conceptual, labeled window footprints instead of simulated apps. A fixed display marker shows the visible desktop, and a full-row overview and slider let visitors navigate. Blocks retain their widths when a new one is inserted after the current selection. Change width affects only that block. Stop & restore shows original scattered positions and original widths; Start row begins a new row with those restored widths. Reset returns to the initial four blocks. A twelve-window limit keeps the model lightweight.

The model runs only in the browser, has no access to system windows, and never installs or starts TileMe. Its keyboard handling is scoped to its region and leaves modified OS shortcuts alone. With JavaScript disabled, all product, download, installation and preview information remains accessible.

All download links use the real v0.6.0 Apple Silicon DMG on GitHub. Update release links, metadata and compatibility copy together for future releases. The publication includes first-launch instructions, Apple’s Open Anyway documentation, and current limitations.
