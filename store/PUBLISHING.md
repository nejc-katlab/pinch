# Publishing Pinch to the Chrome Web Store

Everything needed for submission. Copy the text straight into the Developer Dashboard.
Fields marked **⚠ TODO** need a value only you can supply. Account setup (developer fee, verified contact email) is already done from Gentle Focus.

---

## 1. Pre-submit checklist

- [x] Final name chosen: **Pinch — Clean Recipes & Metric Converter**
- [x] Icons added (16/32 px chef hat, 48/128 px full emblem; rebuild with `python3 store/brand/make_icons.py`)
- [x] `manifest.json` version `1.0.0`
- [ ] Screenshots ready (1280×800) in `store/screenshots/`
- [ ] `node tests/test.mjs` and `node tests/corpus.mjs` green
- [ ] `bash store/package.sh` produces `dist/pinch.zip`
- [ ] Unzipped build loaded via "Load unpacked" and smoke-tested on two or three recipe sites
- [ ] Field logging confirmed off in a fresh profile (popup shows no "Field log" footer)
- [ ] Repo public on GitHub, `PRIVACY.md` reachable at its public URL

---

## 2. Store listing copy

**Name** (≤ 45 chars, currently 40; this is the manifest `name`, which the store uses as the listing title)
```
Pinch — Clean Recipes & Metric Converter
```

**Summary / short description** (≤ 132 chars, currently 118)
```
Pull the clean recipe out of any food blog. Convert to metric, scale to measurable amounts, print or copy. 100% local.
```

**Category:** Lifestyle → Food & Drink (or Productivity → Tools)

**Detailed description**
```
Food blogs bury the recipe under life stories, ads and pop-ups. This extension finds the recipe on the page and shows just what you need to cook: ingredients, steps, times and servings.

HOW IT WORKS
Open a recipe page and a small "Recipe found" note appears. Click it, or the toolbar icon, to see the clean recipe.

FEATURES
• Metric conversion that knows ingredients: 1 cup of flour is 120 g, 1 cup of sugar is 200 g, liquids become ml, °F becomes °C (including ranges like 350–375°F)
• Honest conversions: anything it can't convert reliably is left exactly as written rather than guessed
• Scale from ¼× to 3×. Smaller batches are only offered when every ingredient stays measurable: no "⅓ of an egg", no "⅓ teaspoon"
• Ingredient groups (like "For the frosting") kept intact
• Per-serving nutrition when the site publishes it
• Print a clean recipe sheet or save it as a PDF
• Copy as Markdown with checkboxes, ready to paste into Notion, Obsidian or a notes app
• Light and dark mode

PRIVACY
100% local. No accounts, no servers, no analytics, no tracking. The extension makes no network requests at all. Recipes are read and converted on your device and never sent anywhere.

Free and open source (MIT).
```

**Single-purpose description** (required)
```
The extension detects the recipe on the web page the user is viewing and presents a clean version of it (ingredients, steps, times), with optional metric conversion, scaling, printing and copying. All processing is local to the device.
```

---

## 3. Permission justifications

Paste each into its box under Privacy practices → "Permission justification."

- **Remote code:** answer **"No, I am not using remote code."** Verified: all JavaScript is bundled in the package; there are no externally hosted scripts, no `eval`, no `new Function`, no remote modules, and no `fetch`/XHR calls anywhere. If a text box is forced:
```
This extension does not use remote code. All JavaScript is bundled in the package; there are no externally hosted scripts, no eval of fetched code, no remote modules, and the extension makes no network requests.
```

- **Host permission (content script on http/https pages):**
```
Recipes are published on thousands of different websites, so the content script must run on any http/https page to detect whether it contains a recipe (schema.org recipe markup or ingredient/instruction lists). It only reads recipe content locally to display it in the popup. Nothing from the page is stored remotely or transmitted; the extension makes no network requests.
```

- **storage:**
```
Used to pass the selected recipe from the popup to the extension's print page, where it is deleted immediately after being read. No data is synced or sent off the device.
```

- **clipboardWrite:**
```
Used only when the user clicks "Copy as Markdown" to place the formatted recipe on the clipboard. The extension never reads the clipboard.
```

---

## 4. Data-safety / privacy disclosures

On the "Data usage" form:

- **Data types collected:** none. If the form forces a selection, the only relevant category is "Website content", and it is **not collected**: recipe content is read locally for display and never stored remotely or transmitted.
- **Sold to third parties:** No.
- **Used for anything besides the single purpose:** No.
- Check the three certification boxes (no selling data, no unrelated use, no creditworthiness use); all true.

**Privacy policy URL:** once the repo is public,
```
https://github.com/nejc-katlab/pinch/blob/main/PRIVACY.md
```

---

## 5. Graphics

- **Icon 128×128**: `icons/icon128.png`
- **Screenshots**: at least one 1280×800 PNG from `store/screenshots/`
- **Small promo tile 440×280**: optional

---

## 6. Submit (you)

1. Dashboard → **Add new item** → upload `dist/pinch.zip`
2. Paste the copy from §2 and the justifications from §3
3. Fill in the data-usage form per §4 and add the privacy-policy URL
4. Upload the icon and screenshots
5. Choose **Unlisted** visibility for the first release, install it from the store, and use it for a few days
6. Switch visibility to **Public**

Expect a longer first review than Gentle Focus: content scripts on all sites often get a manual review. The host-permission justification above is the answer to have ready if a reviewer asks.
