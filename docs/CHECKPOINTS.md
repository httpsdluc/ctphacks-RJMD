# Checkpoints

|  | 36h | 24h | Pass condition |
|---|---|---|---|
| CP1 | T+4 | T+3 | Panel opens on the real Two Sum page and shows a **fake** coach message |
| CP2 | T+8 | T+7 | Real explanation in → real diagnosis + real L1 hint out |
| CP3 | T+12 | T+12 | Spine steps 1–5 work with no fixture files |
| CP4 | T+24 | T+16 | Full spine, including escalation, runs twice without touching code |
| FREEZE | T+30 | T+19 | No new features. Cut a `demo` branch. |

A missed checkpoint is a scope cut you make right then.

## The demo spine

1. Judge opens `leetcode.com/problems/two-sum` → coach bubble appears
2. Click bubble → side panel opens, shows the detected problem
3. Learner types their approach in plain English
4. Coach diagnoses `TS_BRUTE_FORCE_ONLY`, replies with a **question**
5. Learner writes nested loops, submits
6. Same misconception twice → coach refuses to repeat itself
7. SVG stepper walks their real values
8. Comprehension question → learner retries with a hash map
9. Profile updates

If a task can't be traced to a step here, it is not P0.
