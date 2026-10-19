# TileMe website

The public website for TileMe, an independent, free and open-source macOS scrolling window manager. This repository contains website files only.

## Local preview

```sh
npm install
npm run dev
```

Open http://127.0.0.1:4173. Python 3 is used only for the local static server.

## Build and deploy

```sh
npm run build
```

Deploy the contents of `dist/` to any static host. The production files have no runtime dependencies. `.openai/hosting.json` records the Sites deployment target.

## Verification

```sh
npx playwright install chromium
npm test
```

Browser tests cover insertion order and retained widths, overflow, keyboard scope and focus, navigation boundaries, touch direction, reduced motion, exact release links, responsive layouts from 320 to 1440 pixels, WCAG A/AA checks using axe, and readable page content without JavaScript.

The demo uses original HTML, CSS, and SVG. It is illustrative and does not interact with system windows. Its arrow keys apply only while focus is inside the demonstration. Horizontal touch and trackpad scrolling remain local to the row. The demonstration is capped at twelve windows; reload to start again.

The download links point directly to the real v0.6.0 Apple Silicon DMG on GitHub. Release instructions and limitations are intentionally visible on the website. Update all release links and copy together when publishing a new version.
