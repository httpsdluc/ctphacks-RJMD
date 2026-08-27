# ThinkPad — the 90-second demo

**D7.** Written so someone who did not build it can perform it from this page alone.

Rehearse it three times with a timer. The third time is the one that sounds calm.

---

## Before you stand up

- [ ] Extension loaded at `chrome://extensions` (**remove and re-add** after any rename)
- [ ] `https://leetcode.com/problems/two-sum/` open, page fully loaded, panel closed
- [ ] Page console open on a second monitor if you have one — never on the shared screen
- [ ] **Reset the profile.** In the service worker console:
      `chrome.storage.local.clear(); chrome.storage.session.clear()`
      Skipping this means the coach starts mid-ladder and the escalation beat does not land.
- [ ] Backup recording open in another tab
- [ ] Nobody else on the team hits the endpoint while you demo — the free tier is
      15 requests/minute and you are about to use 10

---

## The script

Each coach reply takes 4–5 seconds. That silence is the demo's biggest risk, so
every step below has a line to say **while it loads**. Do not stand there watching a spinner.

### 1 · The hook (10s)

> "Every AI coding tool is racing to hand you the answer. Watch what happens when
> one refuses."

Click the **?** bubble on the left. The panel opens.

### 2 · The first explanation (20s)

Click the text box. Type **exactly**:

```
I'll loop through every pair and check if they add to the target
```

Click **Talk it through**.

*While it loads:*
> "It's not reading my code. It's reading my reasoning — before I've written anything."

**What lands:** `Hint 1 of 4`, and a question about what happens as the array grows.
It never says "use a hash map."

> "That's a question, not an answer. And it's the right question."

### 3 · The refusal — this is the moment (25s)

Click **Give me a hint**.

*While it loads:*
> "Ask a model the same thing twice and it repeats itself with different words.
> Watch this."

**What lands:** `Hint 2 of 4`. A *different* question, and now **Use a real-life
example** has unlocked.

> "Second hint, new angle — and it just offered me a different kind of help.
> That's not the model being clever. That ladder is a state machine in our code
> with unit tests, because a model asked to not repeat itself will repeat itself
> in front of a judge."

### 4 · Changing modality (15s)

Click **Use a real-life example**.

**What lands:** the coat-check / party analogy. No arrays, no maps — that rule is
enforced by a test.

> "It changed how it teaches, not just what it says."

### 5 · Their own numbers (15s)

Click **Show me visually**.

**What lands:** the stepper. Walk two or three steps with the arrow keys.

> "These are the numbers off this page — not a canned example. Change the array
> in the editor and the diagram recomputes."

### 6 · The payoff (15s)

In the text box, type:

```
I'll keep a dictionary of numbers I've seen and check for the complement
```

Click **Talk it through**.

*While it loads:*
> "It has one job left: get out of the way."

**What lands:** praise, no hint level, and the profile updates below.

> "Hash maps moved. And it now knows visual explanations work for me — so next
> time, it leads with the diagram."

---

## If something breaks

**Bubble missing / panel says it can't read the page.** Use the paste box — it's
the designed path, not a failure. Paste the problem text and keep going. Say
nothing about it; nobody knows what was supposed to happen.

**A reply says "I lost my connection for a second there."** Click the same button
again. If it happens twice, switch to the recording.

**Replies suddenly sound generic.** You hit the rate limit and it's serving
hand-written fallbacks. That is the system working — say so:
> "That's the offline path. Even with the model down, it still coaches."

**Anything takes longer than 10 seconds.** Stop waiting. Switch to the recording
and keep talking. Never let a judge watch a spinner.

---

## The three sentences that matter

If you only get thirty seconds:

1. It diagnoses *why* you're stuck — one of seven specific misconceptions — and
   answers with a question.
2. It refuses to explain the same thing twice, and that refusal is a tested state
   machine, not a prompt instruction.
3. When it says your approach is sound, that's guarded in code — because the model
   once called textbook brute force "sound" at 0.9 confidence, and congratulating
   someone for the exact mistake we exist to catch is the worst thing this can do.
