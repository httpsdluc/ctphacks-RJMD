export type PracticeLevel = 'Easy' | 'Medium' | 'Hard';

export function PracticePicker({ value, onChange }: { value: PracticeLevel; onChange: (level: PracticeLevel) => void }) {
  return (
    <section className="sn-practice" aria-label="Choose practice difficulty">
      <div><span className="sn-eyebrow">Practice queue</span><strong>Choose a challenge</strong></div>
      <div className="sn-level-tabs" role="tablist">
        {(['Easy', 'Medium', 'Hard'] as PracticeLevel[]).map((level) => (
          <button key={level} type="button" role="tab" aria-selected={value === level} className={value === level ? 'is-selected' : ''} onClick={() => onChange(level)}>{level}</button>
        ))}
      </div>
      <div className="sn-practice-problem"><span className={`sn-difficulty sn-difficulty--${value.toLowerCase()}`} /> <span>{value === 'Easy' ? 'Two Sum' : value === 'Medium' ? 'Longest Substring Without Repeating Characters' : 'Trapping Rain Water'}</span><span className="sn-practice-arrow">→</span></div>
    </section>
  );
}