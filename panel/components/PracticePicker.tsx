export type PracticeLevel = 'Easy' | 'Medium' | 'Hard';

/**
 * The picker used to be decorative: three tabs, a problem name, and an arrow
 * that did nothing.
 *
 * It is now honest about what the coach can actually do. The misconception
 * taxonomy in shared/contracts.ts is Two Sum specific — every id starts TS_ —
 * so pointing the coach at another problem would produce a confident diagnosis
 * drawn from the wrong vocabulary. A judge clicking "Medium" and getting
 * nonsense is far worse than a judge seeing an honest "not yet".
 */
const PROBLEMS: Record<
  PracticeLevel,
  { title: string; slug: string; supported: boolean }
> = {
  Easy: { title: 'Two Sum', slug: 'two-sum', supported: true },
  Medium: {
    title: 'Longest Substring Without Repeating Characters',
    slug: 'longest-substring-without-repeating-characters',
    supported: false,
  },
  Hard: { title: 'Trapping Rain Water', slug: 'trapping-rain-water', supported: false },
};

export function PracticePicker({
  value,
  onChange,
}: {
  value: PracticeLevel;
  onChange: (level: PracticeLevel) => void;
}) {
  const problem = PROBLEMS[value];

  const open = () => {
    if (!problem.supported) return;
    const url = `https://leetcode.com/problems/${problem.slug}/`;
    // activeTab is enough: this only runs from a click the learner made.
    chrome.tabs?.query({ active: true, currentWindow: true }, ([tab]) => {
      if (tab?.id) chrome.tabs.update(tab.id, { url });
      else window.open(url, '_blank');
    });
  };

  return (
    <section className="sn-practice" aria-label="Choose practice difficulty">
      <div>
        <span className="sn-eyebrow">Practice queue</span>
        <strong>Choose a challenge</strong>
      </div>

      <div className="sn-level-tabs" role="tablist">
        {(Object.keys(PROBLEMS) as PracticeLevel[]).map((level) => (
          <button
            key={level}
            type="button"
            role="tab"
            aria-selected={value === level}
            className={value === level ? 'is-selected' : ''}
            onClick={() => onChange(level)}
          >
            {level}
          </button>
        ))}
      </div>

      <button
        type="button"
        className="sn-practice-problem"
        onClick={open}
        disabled={!problem.supported}
        title={problem.supported ? `Open ${problem.title}` : undefined}
      >
        <span className={`sn-difficulty sn-difficulty--${value.toLowerCase()}`} />
        <span>{problem.title}</span>
        <span className="sn-practice-arrow">{problem.supported ? '→' : ''}</span>
      </button>

      {!problem.supported && (
        <p className="sn-why">
          I only know how to coach Two Sum so far. I can spot six specific ways
          people get it wrong — and I would rather say that than guess at a
          problem I have not learned yet.
        </p>
      )}
    </section>
  );
}
