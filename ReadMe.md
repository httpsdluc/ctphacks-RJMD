# ThinkPad

*Team RJMD · CTPHacks*


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

## The coach backend (Track C)

Runs on Gemini. Two calls per turn, deliberately:

1. **Diagnose** — Gemini picks one id from our frozen taxonomy.
2. **Our code** increments the count and picks the hint level + modality.
3. **Coach** — Gemini writes the words under those constraints.
4. **Our code** validates and silently falls back if it misbehaved.

The model never decides how hard to push. That is the product.

```bash
npm test
```

```bash
npm run dry-run
```

```bash
npm run eval
```

`dry-run` walks six attempts on the same misconception with no API key and no
network, and prints what the machine chose each time. Use it to rehearse the
escalation beat before demoing it.

`eval` runs 10 hand-written explanations through the real model and scores the
diagnosis. Currently 10/10. Add `-- --live` to run it against the deployed
endpoint instead of the local handler.

### Rate limits

The Gemini free tier allows **15 requests per minute**, and every learner turn
costs two (diagnose, then coach). That is roughly 7 turns a minute across
everyone using it at once. On a 429 the coach falls back to the hand-written
responses in `server/lib/fallbacks.ts` — it stays in character and the demo
keeps working, which is the entire reason those are written as product. Do not
run `npm run eval` while someone is demoing.

### Deploy

`api/coach.js` is **generated and committed**. Vercel discovers functions by
scanning the repo, and its edge bundler rejects the `.ts` import specifiers the
test runner needs — so `scripts/build-api.mjs` bundles the whole handler graph
into one file. **Run `npm run build` before pushing any change under `server/`
or `shared/`, or the deployed coach will be stale.**


Set `GEMINI_API_KEY` and `COACH_MODEL` in the Vercel dashboard — never in the
repo. Then put the deployed URL into `COACH_ENDPOINT` in `shared/contracts.ts`
and the matching origin in `extension/manifest.json` under `host_permissions`.

## Track D status

`visuals/analogies.ts` is done — six analogies, with a test that fails if any of
them reaches for the vocabulary of the thing it explains.

`visuals/videos.ts` is **half done**. The `why` lines are written; the video IDs
and timestamps are not, and cannot be — someone has to watch the clips and scrub
to the right moment. Instructions are at the top of the file. An entry with an
empty `youtubeId` counts as absent, and the coach routes around the video rung
rather than rendering a dead player, so shipping it half-filled is safe.

## Not done yet

Every stub is tagged `TODO(<task id>)` matching the task breakdown. Grep for
your track letter:

```bash
grep -rn "TODO(A" extension/
```
