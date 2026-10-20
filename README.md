# Along website

Public website for Along, an independent, free and open-source macOS scrolling window manager. Website files only; no native application code.

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

## Cloudflare Workers deployment

The repository includes `wrangler.jsonc` with `assets.directory` set to `./dist`. Only built website files are published. Never set the assets directory to `.`: Cloudflare installs dependencies before deploying, so the repository root contains `node_modules` even when Git correctly ignores it.

For Cloudflare Workers Builds connected to GitHub, use:

| Setting        | Value                                          |
| -------------- | ---------------------------------------------- |
| Root directory | Repository root (leave blank)                  |
| Build command  | Leave blank; the deploy script builds the site |
| Deploy command | `npm run deploy`                               |

The deploy script runs the static build before Wrangler. A custom build command in the Wrangler configuration also ensures direct `npx wrangler deploy` builds the site. If the dashboard already has `npm run build` as its build command, that is safe; it simply rebuilds before deployment.

To preview locally using Cloudflare’s static asset server:

```sh
npm run preview
```

To validate deployment packaging without publishing or logging in:

```sh
npm run deploy -- --dry-run
```

For Cloudflare **Pages**, use framework **None**, build command `npm run build`, and output directory `dist`. Pages does not use the Workers deploy command.

## Browser checks

```sh
npx playwright install chromium
npm test
```

Fifteen tests cover insertion order, unchanged neighboring widths, individual width changes, restoration, restart, reset, keyboard scope and focus, the overview slider, native horizontal scrolling, touch gestures, reduced motion, exact release URLs, metadata, and readable product information without JavaScript. Layout and axe WCAG checks run at 320, 390, 768, 1024 and 1440 pixels in both row and restored states.

## Desktop map

The demonstration uses conceptual, labeled window footprints instead of simulated apps. A fixed display marker shows the visible desktop, and a full-row overview and slider let visitors navigate. Blocks retain their widths when a new one is inserted after the current selection. Change width affects only that block. Stop & restore shows original scattered positions and original widths; Start row begins a new row with those restored widths. Reset returns to the initial four blocks. A twelve-window limit keeps the model lightweight.

The model runs only in the browser, has no access to system windows, and never installs or starts Along. Its keyboard handling is scoped to its region and leaves modified OS shortcuts alone. With JavaScript disabled, all product, download, installation and preview information remains accessible.

All download links use the real v0.7.0 Apple Silicon DMG on GitHub. Update release links, metadata and compatibility copy together for future releases. The publication includes first-launch instructions, Apple’s Open Anyway documentation, and current limitations.

## Current release

The source repository is `sujalalmeida/Along`. The website links to the published v0.7.0 preview and `Along-0.7.0-apple-silicon.dmg`. The app, installer and download filenames all use Along. Installation notes explain quitting an existing copy before upgrading and renewing Accessibility permission when needed.

This website update does not modify the native macOS application. Keep the Apple Silicon, macOS 13+, preview and notarization details visible when updating release links.
