# Publishing Pinch to the Chrome Web Store

Everything needed for submission. Copy the text straight into the Developer Dashboard.
Fields marked **⚠ TODO** need a value only you can supply. Account setup (developer fee, verified contact email) is already done from Gentle Focus.

---

## 1. Pre-submit checklist

### 1.1 update (submitted as an update to the existing 1.0 listing)

- [x] `manifest.json` version `1.1.0`; manifest description matches the short description below
- [x] New permissions: `alarms` (no install warning). `notifications` is in `optional_permissions` and requested on the first timer start, so existing users are not disabled by a new-permission warning on update
- [x] `node tests/test.mjs` and `node tests/corpus.mjs` green
- [x] Screenshots regenerated (`bash store/screenshots/capture.sh`), including the new `06-cook-mode.png`
- [x] Smoke-tested in Chrome 148 with a fresh profile: live recipe page detected with ingredient sections, Imperial/Metric both convert every line, Cook mode timer opens the floating window, background worker runs without the notifications permission, field logging off
- [x] `PRIVACY.md` updated for saved recipes, timers, alarms and notifications
- [ ] `PRIVACY.md` pushed to GitHub (the store links to the public copy)
- [ ] Hands-on run through on your own machine: Cook mode timer with sound, "Back to recipe", the notification, saving and reopening a recipe
- [ ] `bash store/package.sh` produces `dist/pinch.zip` from the merged `main`

### 1.0 (first submission, kept for reference)

- [x] Final name chosen: **Pinch — Clean Recipes & Metric Converter**
- [x] Icons added (16/32 px chef hat, 48/128 px full emblem; rebuild with `python3 store/brand/make_icons.py`)
- [x] Repo public on GitHub, `PRIVACY.md` reachable at its public URL

---

## 2. Store listing copy

**Name** (≤ 45 chars, currently 40; this is the manifest `name`, which the store uses as the listing title)
```
Pinch — Clean Recipes & Metric Converter
```

**Summary / short description** (≤ 132 chars, currently 132; keep identical to the manifest `description`)
```
Pull the clean recipe out of any food blog. Imperial or metric, measurable scaling, cook mode with timers, saved recipes. All local.
```

**Category:** Lifestyle → Household (fallback: Productivity → Tools)

**Detailed description**
```
Food blogs bury the recipe under life stories, ads and pop-ups. Pinch finds the recipe on the page and shows just what you need to cook: ingredients, steps, times and servings.

HOW IT WORKS
Open a recipe page and a small "Recipe found" note appears. Click it, or the toolbar icon, to see the clean recipe.

FEATURES
• Imperial or metric, every line: each recipe opens in the units it mostly uses, and one click converts everything to the other system, including recipes that mix cups and grams
• Conversion that knows ingredients: 1 cup of flour is 120 g, 1 tablespoon of butter is 14 g, liquids become ml or cups, and °F and °C convert both ways (ranges included)
• Honest conversions: anything it can't convert reliably is left exactly as written rather than guessed
• Scale from ¼× to 3×. Smaller batches are only offered when every ingredient stays measurable: no "⅓ of an egg"
• Cook mode: a full-page view with one step at a time, ingredients to tick off, and the screen kept awake
• Step timers: every time in a step ("bake 11–12 minutes", "chill 1 hour") becomes a one-tap timer. Timers float above your other tabs, chime when done, and can notify you
• Saved recipes: keep the ones you love and open them again from the toolbar or Cook mode, with search
• Ingredient groups (like "For the frosting" or "Sourdough variation") kept intact
• Per-serving nutrition when the site publishes it
• Print a clean recipe sheet or save it as a PDF
• Copy as Markdown with checkboxes, ready to paste into Notion, Obsidian or a notes app
• Light and dark mode

PRIVACY
100% local. No accounts, no servers, no analytics, no tracking. The extension makes no network requests at all. Recipes are read and converted on your device, and saved recipes stay on your device.

Free and open source (MIT).
```

**Single-purpose description** (required)
```
The extension detects the recipe on the web page the user is viewing and presents a clean version of it (ingredients, steps, times) for cooking, with unit conversion, scaling, a step-by-step cook mode with timers, saving, printing and copying. All processing is local to the device.
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
Keeps the user's data on the device only: recipes the user chooses to save, the recipe currently open in Cook mode (so it survives a reload), running cooking timers (label and end time), and a short-lived hand-off of the recipe to the print page. The code also contains a developer diagnostics log that is off by default and cannot be enabled from the user interface. Nothing is synced or sent off the device.
```

- **alarms:**
```
Used for the cooking timers the user starts in Cook mode, so a timer still finishes on time when the popup and the Cook mode tab are closed or in the background. No other scheduled work is done.
```

- **notifications** (optional permission, requested only when the user starts their first timer):
```
Used only to show a "Time's up" notification when a cooking timer the user started finishes. It is an optional permission requested at that moment; timers keep working inside Cook mode if the user declines.
```

- **clipboardWrite:**
```
Used only when the user clicks "Copy as Markdown" to place the formatted recipe on the clipboard. The extension never reads the clipboard.
```

- **Notes for the reviewer** (optional; use if the dashboard offers a test-instructions or notes field, or when replying to a reviewer question):
```
No account or setup is needed. To test: open any recipe page (for example a food blog post with a recipe card), wait for the "Recipe found" note in the top-right corner or click the toolbar icon, and the popup shows the extracted recipe. The Imperial/Metric toggle converts units, the ¼×–3× buttons scale the recipe, Save keeps it under "Saved recipes", Print opens a printable page, and Copy as Markdown copies the recipe. Cook opens a full-page cook mode; pressing a timer card there starts a timer, opens a small always-on-top timer window, and asks for the optional notifications permission once. All processing happens locally; the extension makes no network requests. Source code: https://github.com/nejc-katlab/pinch
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
- **Screenshots** (upload in this order; the first is the listing's lead image):
  1. `01-clean-recipe.png` — the clean popup
  2. `02-metric.png` — Imperial vs Metric side by side
  3. `03-measurable-scaling.png` — ¼× crêpes, ⅓× switched off
  4. `04-auto-detect.png` — the "Recipe found" note on a (fictional) food blog
  5. `05-print-and-dark.png` — print sheet and dark mode
  6. `06-cook-mode.png` — Cook mode with step timers (new in 1.1)
- **Small promo tile 440×280**: optional

---

## 6. Submit the 1.1 update (you)

If 1.0 was never submitted, skip this section and follow §7 with the 1.1 package and the 1.1 copy above.

1. Dashboard → **Pinch** → **Package** → **Upload new package** → `dist/pinch.zip` (version 1.1.0)
2. **Store listing:** replace the short and detailed descriptions with §2, and upload the screenshots in the order in §5 (replace 02, add 06)
3. **Privacy practices:** update the storage justification and add the alarms and notifications justifications from §3; the data-usage answers in §4 are unchanged
4. **Submit for review.** Existing users update automatically once approved; `alarms` shows no warning and `notifications` is optional, so nobody is disabled by the update

## 7. First submission (1.0, done)

1. Dashboard → **Add new item** → upload `dist/pinch.zip`
2. Paste the copy from §2 and the justifications from §3
3. Fill in the data-usage form per §4 and add the privacy-policy URL
4. Upload the icon and screenshots
5. Choose **Unlisted** visibility for the first release, install it from the store, and use it for a few days
6. Switch visibility to **Public**

Expect a longer first review than Gentle Focus: content scripts on all sites often get a manual review. The host-permission justification above is the answer to have ready if a reviewer asks.
