/**
 * shared/contracts.ts
 *
 * FROZEN AT KICKOFF. This file is the interface boundary between all four tracks.
 * Changing it is a 4-person decision, announced in chat, merged alone in its own PR.
 * Everything else in this repo has exactly one owner; this file has four.
 *
 * Types only (plus frozen constants). No runtime logic — that lives next door in
 * shared/profile.ts so this file can never break a build.
 */

/* ------------------------------------------------------------------ *
 * 1. Misconception taxonomy  (Track C owns the diagnosis, D owns copy)
 * ------------------------------------------------------------------ */

export const MISCONCEPTION_IDS = [
  'TS_BRUTE_FORCE_ONLY',
  'TS_COMPLEMENT_CONFUSION',
  'TS_MAP_DIRECTION_FLIPPED',
  'TS_INSERT_BEFORE_CHECK',
  'TS_RETURNS_VALUES_NOT_INDICES',
  'TS_OFF_BY_ONE_INNER_LOOP',
  'NONE',
] as const;

export type MisconceptionId = (typeof MISCONCEPTION_IDS)[number];

/** Human-readable, used in the diagnosis prompt and in the profile UI. */
export const MISCONCEPTION_LABELS: Record<MisconceptionId, string> = {
  TS_BRUTE_FORCE_ONLY: 'nested loops, no hash-map insight',
  TS_COMPLEMENT_CONFUSION: 'does not see target - num as the search key',
  TS_MAP_DIRECTION_FLIPPED: 'stores index -> value instead of value -> index',
  TS_INSERT_BEFORE_CHECK: 'inserts current num first, then matches it with itself',
  TS_RETURNS_VALUES_NOT_INDICES: 'returns the values rather than their positions',
  TS_OFF_BY_ONE_INNER_LOOP: 'inner loop starts at 0 or i, not i + 1',
  NONE: 'approach is sound — praise and get out of the way',
};

/* ------------------------------------------------------------------ *
 * 2. Problem context  (Track A produces, C consumes)
 * ------------------------------------------------------------------ */

/** 'paste' is the demo default. 'leetcode' is the upgrade. See A5 before A6. */
export type ProblemSource = 'leetcode' | 'paste';

export interface TwoSumInput {
  nums: number[];
  target: number;
}

export interface ProblemContext {
  source: ProblemSource;
  /** e.g. 'two-sum'. '' when source === 'paste' and we could not infer it. */
  slug: string;
  title: string;
  statement: string;
  /** Whatever is in the editor right now. May be empty — that is not an error. */
  code: string;
  language: string;
  /** Drives C7: the diagram must show THEIR numbers, not canned ones. */
  sampleInput: TwoSumInput | null;
  capturedAt: number;
}

export type AdapterErrorCode =
  | 'NOT_A_PROBLEM_PAGE'
  | 'SELECTOR_FAILED'
  | 'EDITOR_UNAVAILABLE'
  | 'TIMEOUT';

export interface AdapterError {
  code: AdapterErrorCode;
  message: string;
  /** Which of the 3 selector strategies (A8) failed. For our logs, never shown. */
  strategy?: string;
}

/** A6: "returns a valid ProblemContext or a typed error. Never throws." */
export type Result<T, E = AdapterError> =
  | { ok: true; value: T }
  | { ok: false; error: E };

/* ------------------------------------------------------------------ *
 * 3. Learner profile  (Track A persists, C mutates via delta, B renders)
 * ------------------------------------------------------------------ */

export const SKILL_IDS = [
  'hash_maps',
  'complexity_analysis',
  'array_traversal',
  'problem_decomposition',
] as const;

export type SkillId = (typeof SKILL_IDS)[number];

export const SKILL_LABELS: Record<SkillId, string> = {
  hash_maps: 'Hash maps',
  complexity_analysis: 'Complexity analysis',
  array_traversal: 'Array traversal',
  problem_decomposition: 'Problem decomposition',
};

export type SkillState = 'unknown' | 'struggling' | 'improving' | 'solid';

/** The four things the coach can *do*. Ordered by escalation weight. */
export const MODALITIES = ['question', 'analogy', 'visual', 'video'] as const;
export type Modality = (typeof MODALITIES)[number];

export interface LearnerProfile {
  /** Bump when the shape changes; A7 migrates or resets on mismatch. */
  version: 1;
  sessionCount: number;
  skills: Record<SkillId, SkillState>;

  /** C6 input. count = misconceptionCounts[id] AFTER incrementing. */
  misconceptionCounts: Partial<Record<MisconceptionId, number>>;

  /** C6 invariant 1: never deliver the same intervention kind twice per misconception. */
  deliveredInterventions: Partial<Record<MisconceptionId, Modality[]>>;

  /** C6 invariant 2: passed to the model as an explicit do-not-repeat list. */
  priorCoachMessages: string[];

  /** C8. A modality "wins" when the attempt right after it was corrected. */
  modalityWins: Record<Modality, number>;

  /** Derived from modalityWins. 2+ wins triggers the count===2 override. */
  preferredModality: Modality | null;

  /** C8 attribution: credit whatever immediately preceded the corrected attempt. */
  lastIntervention: {
    misconceptionId: MisconceptionId;
    modality: Modality;
    at: number;
  } | null;

  updatedAt: number;
}

/* ------------------------------------------------------------------ *
 * 4. The coach call  (A calls, C answers, B renders)
 * ------------------------------------------------------------------ */

export type HintLevel = 1 | 2 | 3 | 4;

/** The five buttons. Order here is the order they render in. */
export const HELP_ACTIONS = ['hint', 'analogy', 'visual', 'video', 'retry'] as const;
export type HelpAction = (typeof HELP_ACTIONS)[number];

export const HELP_ACTION_LABELS: Record<HelpAction, string> = {
  hint: 'Give me a hint',
  analogy: 'Use a real-life example',
  visual: 'Show me visually',
  video: 'Recommend a video',
  retry: 'Let me retry',
};

export interface LearnerAttempt {
  kind: 'explanation' | 'code' | 'comprehension_answer';
  text: string;
  /** Set when kind === 'comprehension_answer'. */
  respondingTo?: string;
  at: number;
}

export interface CoachRequest {
  problem: ProblemContext;
  attempt: LearnerAttempt;
  profile: LearnerProfile;
  /** null = the learner submitted an explanation. Otherwise they pressed a button. */
  requestedAction: HelpAction | null;
}

/** A disabled button must say why. B2. */
export interface BlockedAction {
  action: HelpAction;
  reason: string;
}

/**
 * The specific read on THIS attempt, grounded in what the learner actually
 * wrote. The deterministic summary in shared/summary.ts can only talk about
 * categories — how often a misconception recurs, which help was tried. It has
 * no access to their words, which is why it reads generic no matter how many
 * signals it derives.
 *
 * This comes back from the coaching call that already runs, so it costs no
 * extra request. Nullable: on a fallback there is nothing honest to put here,
 * and an empty insight is better than an invented one.
 */
export interface CoachInsight {
  /** At most ~12 words quoted from the learner. Empty if they wrote nothing. */
  evidence: string;
  /** What their reasoning genuinely gets right, in their terms. */
  strength: string;
  /** The one specific thing to change. Never names the data structure. */
  gap: string;
}

export interface ComprehensionQuestion {
  id: string;
  prompt: string;
  /** Never shown. Given to the model when grading the answer. */
  expectedIdea: string;
}

export interface VideoRecommendation {
  misconceptionId: MisconceptionId;
  title: string;
  channel: string;
  youtubeId: string;
  durationSec: number;
  /** Deep-link offset. The whole point of D5 — land on the relevant 90 seconds. */
  startSec: number;
  thumbnailUrl: string;
  url: string;
  /** "Why this video" — specific to the misconception, never generic praise. */
  why: string;
}

export interface ProfileDelta {
  skillUpdates: Partial<Record<SkillId, SkillState>>;
  incrementMisconception: MisconceptionId | null;
  recordDelivered: { misconceptionId: MisconceptionId; modality: Modality } | null;
  /** C8: set when this attempt was a correction. Credits profile.lastIntervention. */
  creditModality: Modality | null;
  appendCoachMessage: string | null;
  /** One line, coach voice. B6 renders it verbatim. */
  summary: string;
}

export interface ResponseMeta {
  fallbackUsed: boolean;
  model: string;
  latencyMs: number;
  /** For the demo-day console, never the UI. */
  note?: string;
}

export interface CoachResponse {
  misconceptionId: MisconceptionId;
  /** 0..1. Below CONFIDENCE_FLOOR we fall back rather than guess out loud. */
  confidence: number;
  /** Coach voice. At hintLevel 1 this MUST end in a question mark. */
  message: string;
  hintLevel: HintLevel | null;
  modality: Modality;
  offeredActions: HelpAction[];
  blockedActions: BlockedAction[];
  analogy: string | null;
  visual: VisualSpec | null;
  video: VideoRecommendation | null;
  comprehensionQuestion: ComprehensionQuestion | null;
  /** Specific to this attempt. Null on fallbacks. */
  insight: CoachInsight | null;
  profileDelta: ProfileDelta;
  /** "Recognising when a lookup beats a scan." Renders above the textarea. */
  learningGoal: string;
  meta: ResponseMeta;
}

/* ------------------------------------------------------------------ *
 * 5. Visual spec  (Track D defines the shape, C fills it with real values)
 * ------------------------------------------------------------------ */

export type VisualKind = 'array_scan' | 'hash_map_fill';

export type CellHighlight = 'none' | 'active' | 'match' | 'miss';

export interface HashMapRow {
  key: number;
  value: number;
  state: 'idle' | 'just_added' | 'matched';
}

export interface VisualStep {
  /** One sentence, present tense, shown under the diagram. */
  caption: string;
  /** Index into values.nums, or null before the scan starts. */
  activeIndex: number | null;
  processedIndices: number[];
  /** Empty for kind === 'array_scan'. */
  map: HashMapRow[];
  highlight: CellHighlight;
  /** Rendered as a callout, e.g. "9 - 2 = 7". Optional. */
  note?: string;
}

export interface VisualSpec {
  kind: VisualKind;
  title: string;
  /** THEIR numbers. If this is [2,7,11,15] during the demo, C7 is not done. */
  values: TwoSumInput;
  steps: VisualStep[];
}

/* ------------------------------------------------------------------ *
 * 6. Message bus  (Track A owns transport; every message is one of these)
 * ------------------------------------------------------------------ */

export type Msg =
  /* content script -> service worker -> panel */
  | { type: 'PROBLEM_DETECTED'; payload: ProblemContext }
  | { type: 'PROBLEM_UNAVAILABLE'; payload: AdapterError }
  /* panel -> service worker (on mount, and after navigation) */
  | { type: 'PROBLEM_REQUEST' }
  /* content script -> service worker (bubble click) */
  | { type: 'OPEN_PANEL' }
  /* panel -> service worker (A5 fallback path) */
  | { type: 'PASTE_CONTEXT'; payload: { statement: string; code: string; language: string } }
  /* panel -> service worker */
  | { type: 'SUBMIT_ATTEMPT'; payload: LearnerAttempt }
  | { type: 'REQUEST_ACTION'; payload: { action: HelpAction } }
  /* service worker -> panel */
  | { type: 'COACH_PENDING' }
  | { type: 'COACH_RESPONSE'; payload: CoachResponse }
  | { type: 'PROFILE_UPDATED'; payload: LearnerProfile };

export type MsgType = Msg['type'];

/** Narrowing helper so no one hand-writes a switch on `any`. */
export type MsgOf<T extends MsgType> = Extract<Msg, { type: T }>;

/* ------------------------------------------------------------------ *
 * 7. Frozen constants
 * ------------------------------------------------------------------ */

/** Track C sets this at CP1. Everything else reads it from here. */
export const COACH_ENDPOINT = 'https://ctp-rjmd.vercel.app/api/coach';

/** Below this, the coach asks a clarifying question instead of naming a bug. */
export const CONFIDENCE_FLOOR = 0.55;

/** C4: any coach message with more lines of code than this is rejected. */
export const MAX_CODE_LINES_IN_RESPONSE = 3;

/** How many prior messages we send as the do-not-repeat list. */
export const DO_NOT_REPEAT_WINDOW = 6;

/** C6 override: preferredModality with this many wins jumps in at count === 2. */
export const PREFERRED_MODALITY_THRESHOLD = 2;
