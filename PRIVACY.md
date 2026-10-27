# Pinch — Privacy Policy

_Last updated: 27 October 2026_

**Short version: Pinch collects nothing, sends nothing, and has no servers. Recipes are read and converted entirely in your browser, on your device.**

## What we collect

Nothing is collected by us, because there is no "us" to collect it — the extension has no backend, no accounts, and no analytics.

## How the extension reads pages

To find a recipe, the extension looks at the structured recipe data that recipe sites publish on their pages (schema.org markup) and, if that is missing, at the page's ingredient and instruction lists. This happens locally, in the moment, on the page you are viewing. Recipes and page contents are never sent anywhere, and the extension makes no network requests of any kind.

## What is stored on your device

The extension uses `chrome.storage.local` for the following, and nothing in it ever leaves your device:

- **Saved recipes:** when you press **Save**, that recipe (its name, ingredients, steps, times and the address of the page it came from) is kept on your device so you can open it again from **Saved recipes**. It stays until you remove it or uninstall the extension.
- **Cook mode:** the recipe you last opened in Cook mode, with your chosen units and scale, so the page survives a reload.
- **Timers:** each running timer's label, recipe name and end time, so it keeps counting when you close the popup or switch tabs. A timer is removed when you dismiss or cancel it.
- **Print:** the recipe you are printing is handed to the print page and deleted as soon as that page opens.
- A developer diagnostics mode exists for testing conversion accuracy. It is **off by default** and cannot be switched on from the extension's interface. Only if a developer deliberately enables it does it keep a local log of detected recipe pages (their URLs and how each ingredient line was converted). That log stays on the device and is never transmitted.

## What we do not do

- We do not transmit any data off your device.
- We do not use servers, accounts, sign-in, or cloud sync.
- We do not use analytics, telemetry, tracking, cookies, or advertising.
- We do not sell or share data with anyone.

## Notifications

Pinch asks for permission to show notifications the first time you start a timer. If you allow it, the only notification it ever shows is "Time's up" when one of your timers finishes. If you decline, timers still work inside Cook mode. You can change this at any time in Chrome's extension settings.

## Clipboard

**Copy as Markdown** writes the recipe to your clipboard only when you press the button. The extension never reads your clipboard.

## Permissions

- **Access to web pages (content script on http/https sites):** needed to detect recipes on whatever recipe site you visit. Used only to read recipe content locally, never to collect or transmit it.
- **storage:** keeps saved recipes, the Cook mode recipe, running timers and print hand-offs on your device, as described above.
- **alarms:** lets a timer finish on time even when the popup and Cook mode are closed.
- **notifications (optional, asked for when you first start a timer):** shows "Time's up" when a timer finishes.
- **clipboardWrite:** lets the Copy button place the recipe on your clipboard.

## Contact

Questions or concerns? Please open an issue:
https://github.com/nejc-katlab/pinch/issues

## Changes

If this policy ever changes, the updated version will be published here with a new date. Since the extension collects no data, any change will only ever clarify or strengthen these commitments.
