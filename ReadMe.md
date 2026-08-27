# We are team RJMD
# this is for ctpHack


A coding coach that asks instead of answers. Chrome MV3 side panel.

> Working name. Rename in `extension/manifest.json` and `package.json` if the team picks another.

## Run it

```bash
npm install
npm run dev
```

Then `chrome://extensions` → Developer mode → **Load unpacked** → select `dist/`.

`main` must always load unpacked. A commit that breaks that gets reverted.

## Layout — one owner per folder

| Folder | Track | Owner |
|---|---|---|
| `extension/` | A — plumbing | |
| `panel/` | B — panel UI | |
| `server/` | C — coaching brain | |
| `visuals/` | D — visuals & story | |
| `shared/` | **four owners.** Changes are announced and merged alone. | |
| `fixtures/` | seed data so B and D build with the backend deleted | |

If you need something in someone else's folder, ask them for it. Don't edit it.

## The frozen contract

`shared/contracts.ts` is the interface boundary. Every message, request, and
response in the app is one of its types. `shared/profile.ts` holds the only
logic that may mutate a learner profile.

## Fixtures

`panel/state/useCoach.ts` exports `USE_FIXTURES`. It is `true` until CP3.
While it is `true` the panel renders entirely from `fixtures/` — no service
worker, no adapter, no backend.

## Demo path

Paste (A5) is the default demo path, not the fallback. The LeetCode adapter is
the upgrade. Never let the demo depend on scraping Monaco.

## Backend rule

`POST /coach` always returns HTTP 200 with a valid `CoachResponse`. On model
error, timeout, or validation failure it returns the hardcoded fallback. The
extension has no error branch for it.

## Not done yet

Every stub is tagged `TODO(<task id>)` matching the task breakdown. Grep for
your track letter:

```bash
grep -rn "TODO(A" extension/
```
