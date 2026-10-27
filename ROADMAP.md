# Pinch — Roadmap

Status key: ✅ done · 🔄 in progress · ⬜ planned · 🔒 gated on evidence/decision

## Shipped (v1 core)

- ✅ Extraction: JSON-LD → microdata → heuristics, lenient JSON, WPRM ingredient groups, Jetpack directions
- ✅ Ingredient parser: unicode/mixed/hyphenated fractions, ranges, "X and Y/Z", ~27 unit aliases
- ✅ Metric conversion: ~180-entry density table, longest-match + word-boundary + gap-tolerant matching, parenthetical handling with alternative-ingredient annotations, °F→°C in steps
- ✅ Scaling: ¼ ⅓ ½ 1 2 3×, gated on kitchen representability (spoon set granularity, ≥1 g, whole counts), spoon decomposition, count-noun pluralization, yield ranges
- ✅ Nutrition per serving from publisher schema
- ✅ Popup UI (light/dark), in-page detection pill + badge, print / save-as-PDF sheet, copy-as-Markdown
- ✅ Test infrastructure: unit + auto-generated collision suite, golden corpus, live-page audit, sitemap crawler (1000-recipe battle test), field-log telemetry with export

## Shipped (1.1)

- ✅ Cook mode: full-page reader, checkable ingredients, step-by-step focus, screen wake-lock, unit and scale controls, Save / Copy as Markdown / Print
- ✅ Step-duration timers: durations detected in step text, one-tap timers that survive closing the tab (alarms + optional notification), Picture-in-Picture timer window with "Back to recipe", scheduled chime
- ✅ Saved recipes: local library with search, reachable from the popup and Cook mode (chrome.storage.local; sync's ~100 KB quota is too small for a library)
- ✅ Imperial/Metric toggle replaces Original/Metric: recipe opens in its dominant system, every line converts both ways, tbsp/tsp convert in metric, °C↔°F
- ✅ Tasty Recipes ingredient groups; temperatures in ingredient lines; bare "350 degrees" / ℉ / º handled

## Now — validation loop

- 🔄 Continue field test drive; export and analyze the log periodically; fold every miss into `tests/corpus.json`
- ⬜ Visit non-English recipe sites during the field test to collect unit/density gaps for the i18n work
- ⬜ Manual check of fallback-only sites (no JSON-LD) beyond Smitten Kitchen

## Store readiness (v1 release)

- ✅ Gate field logging behind an off-by-default developer toggle
- ✅ Extension icons (required for listing)
- ✅ Name check on the Chrome Web Store; keep the name/icon as the brand
- ✅ Privacy policy page ("all processing is local, no data collected")
- ✅ Screenshots and listing copy; developer registration
- ⬜ Publish unlisted first, self-install from the store for a week, then go public
- ⬜ Pill design refinements (size, icon, expand-on-hover) as desired

## v1.5 — features in order of value

- ⬜ Surface rest/chill time that lives only in step prose (not in the prep/cook metadata) as a total "hands-off time" in the header
- ⬜ Saved-recipe export/import (JSON) so a library survives a new machine without cloud sync
- ⬜ Grocery export adapters behind one interface: Things URL scheme, Todoist, Notion API (internal-integration token first, OAuth later)
- ⬜ Multi-recipe merged grocery list (sum shared ingredients across selected saved recipes)
- ⬜ Ingredient groups for more recipe plugins (Create, others as the field log reveals them); WPRM and Tasty Recipes done
- ⬜ QR code linking to the source on the print sheet

## Translation & i18n

- ⬜ Per-language unit aliases and density keywords (German, French, Spanish, Italian first), decimal-comma handling; parse the original text, never the translation
- ⬜ On-device recipe translation via Chrome's built-in Translator API (no server, privacy story intact); model-download progress UX; hide feature where the API is unavailable
- ⬜ Extension UI localization via `_locales` when heading to the store

## Open source (if decided)

- ⬜ Decide: open source vs. keep closed for potential paid product — one-way door; AGPL recommended if open
- ⬜ Refactor site quirks into `lib/adapters/*` with a `{ detect, groups, steps }` interface
- ⬜ "Report this recipe" button that opens a prefilled GitHub issue from the field-log entry
- ⬜ CONTRIBUTING.md with three lanes (table/corpus row · site adapter · engine change), issue templates
- ⬜ CI: unit + collision + corpus on every PR; nightly crawler run that opens issues on regressions

## Later — evidence-gated

- 🔒 Firefox for Android port (near-free; real mobile story); Safari iOS port last ($99/yr + App Store review)
- 🔒 Opt-in, per-click LLM escape hatch (OpenRouter key) only if field/crawl data shows a meaningful long tail; AI-derived nutrition clearly labeled as estimated
- 🔒 Brand/liquor name list for conversion (e.g. "Pimm's No. 1" → liquid)
- 🔒 Regional cup sizes (AU/UK 250 ml metric cup vs US 240 ml) if site-locale detection proves reliable

## Known limitations (tracked, deliberate)

- Kosher salt is never volume-converted (kosher vs. table salt density differs ~2×)
- Gap-tolerant matching allows at most two words between pattern words ("crushed canned San Marzano tomatoes" stays unconverted)
- The crawler only exercises the JSON-LD path; some sites bot-block plain fetches (Allrecipes) and the 80-pages/site burst can trip WAFs (101cookbooks)
- Recipes are trusted as published: one-ingredient JSON-LD stubs and other publisher data-quality issues pass through
