# Pinch

A Chrome extension that pulls the clean recipe out of any food blog, shows it in imperial or metric, scales it to amounts you can actually measure, and gives you a cook mode with step timers. Save the recipes you like, print them, or copy them as Markdown. Everything runs locally. The extension makes no network requests.

## What it does

- Detects recipes from schema.org JSON-LD, microdata, or ingredient/instruction headings, including WP Recipe Maker and Tasty Recipes ingredient groups and Jetpack recipe cards
- Opens each recipe in the unit system most of its ingredient lines use and converts every line to imperial or metric, using a density table of about 190 ingredients; °F and °C convert both ways (ranges included), and anything it can't convert reliably is left untouched
- Scales ¼× to 3×, offering a fraction only when every ingredient stays measurable with real spoons, a scale, or whole items
- Cook mode: one step at a time, checkable ingredients, screen wake lock, and one-tap timers for every duration in a step; timers survive closing the tab, float above other tabs in a Picture-in-Picture window, chime when done, and can send a notification
- Saved recipes, stored locally, browsable and searchable from the popup and from Cook mode
- Shows per-serving nutrition when the site publishes it
- Prints a clean recipe sheet (or saves it as PDF) and copies the recipe as Markdown with checkboxes

## Install for development

1. Open `chrome://extensions` and enable Developer mode
2. Click **Load unpacked** and select this folder

## Tests

```bash
node tests/test.mjs
node tests/corpus.mjs
node tests/audit.mjs [urls...]
node tests/crawl.mjs 5
```

- `test.mjs` holds the unit tests plus an auto-generated collision check that every density-table entry wins its own lookup
- `corpus.mjs` checks real-world ingredient lines against the expected metric output in `tests/corpus.json`
- `audit.mjs` fetches live recipe pages and prints how each line parsed and converted
- `crawl.mjs` samples recipe pages from site sitemaps and checks invariants (argument: pages per site)

The popup, print sheet and Cook mode can be previewed without installing the extension by serving the folder over HTTP and opening `tests/harness.html`, `tests/print-harness.html` or `tests/cook-harness.html`.

## Developer diagnostics

A local field log records how each detected recipe was parsed and converted. It is off by default and has no switch in the interface. To enable it, open the extension's service worker console from `chrome://extensions` and run:

```js
chrome.storage.local.set({ devLogging: true })
```

The popup footer then shows an **Export log** link. Set it back to `false` to stop logging.

## Contributing

Conversion fixes are most useful with a failing line added to `tests/corpus.json` and its expected metric output. New density entries are checked automatically by the collision test.

## Privacy

See [PRIVACY.md](PRIVACY.md). In short: no data is collected, stored remotely, or transmitted. Saved recipes and timers stay on your device.

## License

MIT
