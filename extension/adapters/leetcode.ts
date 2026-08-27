/**
 * A6 — LeetCode adapter. A8 — three selector strategies, then give up cleanly.
 *
 * Contract: never throws. Returns Result<ProblemContext, AdapterError>.
 * When this returns { ok: false }, the panel shows the paste box (A5) and the
 * demo continues. That is the designed path, not the sad path.
 */

import type {
  AdapterError,
  ProblemContext,
  Result,
  TwoSumInput,
} from '../../shared/contracts';

function fail(code: AdapterError['code'], message: string, strategy?: string): Result<ProblemContext> {
  return { ok: false, error: { code, message, strategy } };
}

/** Strategy 1: the visible DOM. Strategy 2: __NEXT_DATA__. Strategy 3: <title>. */
function readTitle(): string | null {
  // TODO(A6): strategy 1 — the rendered heading
  const heading = document.querySelector<HTMLElement>('a[href^="/problems/"] > div, div[class*="title"]');
  if (heading?.innerText?.trim()) return heading.innerText.trim();

  // TODO(A8): strategy 3 — document title is the most stable thing on the page
  const t = document.title.replace(/\s*-\s*LeetCode\s*$/i, '').trim();
  return t || null;
}

function readStatement(): string | null {
  // TODO(A6): the description pane. Selector changes often — this is why A8 exists.
  const el = document.querySelector<HTMLElement>('[data-track-load="description_content"]');
  return el?.innerText?.trim() || null;
}

function readCode(): string | null {
  // TODO(A6): Monaco. This is the single most likely thing to break on demo day.
  // Read the rendered view-lines rather than reaching into the editor model.
  const lines = document.querySelectorAll<HTMLElement>('.view-line');
  if (lines.length === 0) return null;
  return Array.from(lines)
    .map((l) => l.innerText.replace(/ /g, ' '))
    .join('\n');
}

function readLanguage(): string {
  const btn = document.querySelector<HTMLElement>('button[id*="lang"], [data-cy="lang-select"]');
  return btn?.innerText?.trim().toLowerCase() || 'python';
}

/** C7 needs real values. Pull the first example out of the statement. */
export function parseTwoSumInput(statement: string): TwoSumInput | null {
  const nums = statement.match(/nums\s*=\s*\[([-\d,\s]+)\]/);
  const target = statement.match(/target\s*=\s*(-?\d+)/);
  if (!nums || !target) return null;
  const parsed = nums[1]
    .split(',')
    .map((n) => Number(n.trim()))
    .filter((n) => Number.isFinite(n));
  if (parsed.length < 2) return null;
  return { nums: parsed, target: Number(target[1]) };
}

export function slugFromUrl(url: string): string {
  return url.match(/\/problems\/([^/?#]+)/)?.[1] ?? '';
}

export function detectProblem(): Result<ProblemContext> {
  const slug = slugFromUrl(location.href);
  if (!slug) return fail('NOT_A_PROBLEM_PAGE', 'Not a LeetCode problem URL.');

  const title = readTitle();
  if (!title) return fail('SELECTOR_FAILED', 'Could not read the problem title.', 'title');

  const statement = readStatement();
  if (!statement) return fail('SELECTOR_FAILED', 'Could not read the problem statement.', 'statement');

  // Code is allowed to be missing — an empty editor is a legitimate state.
  const code = readCode() ?? '';

  return {
    ok: true,
    value: {
      source: 'leetcode',
      slug,
      title,
      statement,
      code,
      language: readLanguage(),
      sampleInput: parseTwoSumInput(statement),
      capturedAt: Date.now(),
    },
  };
}

/** A5 — the paste path builds the same shape, and says so via `source`. */
export function fromPaste(input: {
  statement: string;
  code: string;
  language: string;
}): ProblemContext {
  return {
    source: 'paste',
    slug: 'two-sum',
    title: 'Two Sum',
    statement: input.statement,
    code: input.code,
    language: input.language || 'python',
    sampleInput: parseTwoSumInput(input.statement) ?? { nums: [2, 7, 11, 15], target: 9 },
    capturedAt: Date.now(),
  };
}
