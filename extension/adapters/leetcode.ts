/**
 * A6 — LeetCode adapter. A8 — three strategies per field, then give up cleanly.
 *
 * Every selector here was checked against a live leetcode.com/problems/two-sum
 * page rather than guessed. What that check found:
 *
 *   [data-track-load="description_content"]  works — the statement
 *   [data-track-load="code_editor"]          works — scopes the editor
 *   .view-line                               works — Monaco IS readable
 *   a[href="/problems/<slug>/"]              works — the title
 *   button whose text is a language name     works — the language
 *
 * The two selectors that failed were the ones I invented: a class-name guess
 * for the heading (matched 4 empty divs) and `[data-cy="lang-select"]`
 * (matched nothing). Class names on this page are Tailwind soup and change
 * without notice; the `data-track-load` hooks are what to build on.
 *
 * Contract: never throws. Returns Result<ProblemContext, AdapterError>. When
 * this returns { ok: false }, the panel shows the paste box (A5) and the demo
 * continues. That is the designed path, not the sad path.
 */

import type {
  AdapterError,
  ProblemContext,
  Result,
  TwoSumInput,
} from '../../shared/contracts';

function fail(
  code: AdapterError['code'],
  message: string,
  strategy?: string,
): Result<ProblemContext> {
  return { ok: false, error: { code, message, strategy } };
}

const text = (el: Element | null | undefined): string =>
  (el as HTMLElement | null)?.innerText?.trim() ?? '';

/** Non-breaking spaces come out of Monaco and break every regex downstream. */
const normalise = (s: string): string => s.replace(/ /g, ' ');

export function slugFromUrl(url: string): string {
  return url.match(/\/problems\/([^/?#]+)/)?.[1] ?? '';
}

/* ---------------------------------- title --------------------------------- */

function readTitle(slug: string): { value: string; strategy: string } | null {
  // 1. The breadcrumb anchor. Derived from the slug, so it cannot go stale
  //    against a class-name change.
  const anchor =
    document.querySelector(`a[href="/problems/${slug}/"]`) ??
    document.querySelector(`a[href^="/problems/${slug}"]`);
  if (text(anchor)) return { value: text(anchor), strategy: 'anchor' };

  // 2. Any element whose entire text reads like "1. Two Sum".
  const numbered = [...document.querySelectorAll('a, div, span, h1')].find(
    (el) => /^\d+\.\s+\S/.test(text(el)) && text(el).length < 80,
  );
  if (numbered) return { value: text(numbered), strategy: 'numbered' };

  // 3. The document title is the most stable thing on the page.
  const fromDoc = document.title.replace(/\s*-\s*LeetCode\s*$/i, '').trim();
  return fromDoc ? { value: fromDoc, strategy: 'document.title' } : null;
}

/* -------------------------------- statement ------------------------------- */

function readStatement(): { value: string; strategy: string } | null {
  const primary = document.querySelector('[data-track-load="description_content"]');
  if (text(primary)) return { value: normalise(text(primary)), strategy: 'description_content' };

  const rendered = document.querySelector('[data-qd-rendered-description]');
  if (text(rendered)) return { value: normalise(text(rendered)), strategy: 'qd-rendered' };

  // 3. No markup hooks at all — find it by what it SAYS. Every LeetCode
  //    statement contains an "Example 1:" block, and the smallest element that
  //    contains both that and the constraints is the description body. This
  //    survives a layout the other two strategies have never seen, which is the
  //    whole point of having a third one: the first two were written against a
  //    logged-out page, and a logged-in page is a different DOM.
  const candidates = [...document.querySelectorAll<HTMLElement>('div, section, article')].filter(
    (el) => {
      const t = el.innerText ?? '';
      return t.includes('Example 1') && /nums|Constraints/.test(t) && t.length < 12_000;
    },
  );
  // Smallest match = the tightest wrapper around the statement, not the page.
  const best = candidates.sort((a, b) => (a.innerText?.length ?? 0) - (b.innerText?.length ?? 0))[0];
  if (text(best)) return { value: normalise(text(best)), strategy: 'by-content' };

  return null;
}

/* ----------------------------------- code --------------------------------- */

/**
 * Monaco absolutely-positions each line and reorders the DOM nodes as you edit
 * and scroll, so DOM order is not reading order. Sort by `top`.
 *
 * It also only renders the lines currently in view. For a long solution this
 * returns what the learner can see, not the whole file — which is fine for
 * diagnosis, and is another reason the paste path exists.
 */
function linesFrom(root: ParentNode): string {
  const lines = [...root.querySelectorAll<HTMLElement>('.view-line')];
  if (lines.length === 0) return '';
  return lines
    .map((el) => ({ top: parseFloat(el.style.top || '0'), body: normalise(el.innerText) }))
    .sort((a, b) => a.top - b.top)
    .map((l) => l.body)
    .join('\n')
    .trimEnd();
}

function readCode(): { value: string; strategy: string } {
  const editor = document.querySelector('[data-track-load="code_editor"]');
  if (editor) {
    const scoped = linesFrom(editor);
    if (scoped) return { value: scoped, strategy: 'code_editor' };
  }

  const loose = linesFrom(document);
  if (loose) return { value: loose, strategy: 'view-line' };

  // An empty editor is a legitimate state, not a failure.
  return { value: '', strategy: 'none' };
}

/* --------------------------------- language ------------------------------- */

const LANGUAGES =
  /^(C\+\+|Java|Python3?|C|C#|JavaScript|TypeScript|PHP|Swift|Kotlin|Dart|Go|Ruby|Scala|Rust|Racket|Erlang|Elixir)$/;

function readLanguage(): string {
  const button = [...document.querySelectorAll('button')].find((b) =>
    LANGUAGES.test(text(b)),
  );
  return text(button).toLowerCase() || 'python';
}

/* ------------------------------- sample input ----------------------------- */

/** C7 needs real values. Verified against the live statement: [2,7,11,15] / 9. */
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

/* --------------------------------- detect --------------------------------- */

export function detectProblem(): Result<ProblemContext> {
  try {
    const slug = slugFromUrl(location.href);
    if (!slug) return fail('NOT_A_PROBLEM_PAGE', 'Not a LeetCode problem URL.');

    const title = readTitle(slug);
    if (!title) return fail('SELECTOR_FAILED', 'Could not read the problem title.', 'title');

    const statement = readStatement();
    if (!statement) {
      // The description pane renders late on a cold load.
      return fail('SELECTOR_FAILED', 'Could not read the problem statement.', 'statement');
    }

    const code = readCode();

    return {
      ok: true,
      value: {
        source: 'leetcode',
        slug,
        title: title.value,
        statement: statement.value,
        code: code.value,
        language: readLanguage(),
        sampleInput: parseTwoSumInput(statement.value),
        capturedAt: Date.now(),
      },
    };
  } catch (err) {
    // The contract says this never throws. Belt and braces.
    return fail(
      'SELECTOR_FAILED',
      err instanceof Error ? err.message : 'Unknown adapter failure.',
      'threw',
    );
  }
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
