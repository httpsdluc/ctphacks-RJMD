import { useState } from 'react';
import { PracticePicker, type PracticeLevel } from './components/PracticePicker';
import { VisualStepper } from '../visuals/Stepper';
import { VideoCard } from './components/VideoCard';
import visualFixture from '../fixtures/visualSpec.json';
import { VIDEO_MAP } from '../visuals/videos';
import type { VisualSpec } from '../shared/contracts';

const actions = [
  ['hint', 'Give me a hint', true],
  ['analogy', 'Use a real-life example', true],
  ['visual', 'Show me visually', false],
  ['video', 'Recommend a video', false],
  ['retry', 'Let me retry', true],
] as const;

export function DesignPreview() {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [practiceLevel, setPracticeLevel] = useState<PracticeLevel>('Easy');
  const selectedProblem = practiceLevel === 'Easy' ? 'Two Sum' : practiceLevel === 'Medium' ? 'Longest Substring Without Repeating Characters' : 'Trapping Rain Water';

  return (
    <main className="sn-shell sn-design-board">
      <header className="sn-header sn-design-header">
        <div><span className="sn-kicker">Interface study · 01</span><h1 className="sn-display">Sidenote</h1></div>
        <span className="sn-status"><i /> Active session</span>
      </header>
      <PracticePicker value={practiceLevel} onChange={setPracticeLevel} />
      <section className="sn-context"><div><span className="sn-eyebrow">LeetCode · {practiceLevel}</span><strong>{selectedProblem}</strong></div><span className="sn-context-icon">{practiceLevel === 'Easy' ? 'TS' : practiceLevel === 'Medium' ? 'LS' : 'TR'}</span></section>
      <section className="sn-goal sn-goal--preview"><span className="sn-goal-label">Today&apos;s thread</span>Recognising when a lookup can replace a scan.</section>
      <section className="sn-coach sn-coach--preview"><div className="sn-coach-meta"><span>COACH</span><span className="sn-level">Hint 1 of 4</span></div><p>When you are standing at the number <b>2</b> and looking for its partner, what exactly are you searching the rest of the array for?</p><p className="sn-analogy">A good question is a small door. Let&apos;s find the handle.</p></section>
      <VisualStepper spec={visualFixture as VisualSpec} />
      {VIDEO_MAP.TS_BRUTE_FORCE_ONLY && <VideoCard video={VIDEO_MAP.TS_BRUTE_FORCE_ONLY} />}
      <section className="sn-section"><div className="sn-section-heading"><span>Choose your next move</span><span>1 of 4</span></div><div className="sn-actions sn-actions--preview">
        {actions.map(([key, label, enabled]) => <button key={key} type="button" className={`sn-action ${enabled ? '' : 'sn-action--blocked'}`} disabled={!enabled}><span className={`sn-action-icon sn-action-icon--${key}`}>{key === 'hint' ? '?' : key === 'analogy' ? '≈' : key === 'visual' ? '◫' : key === 'video' ? '▶' : '↗'}</span><span><b>{label}</b>{!enabled && <small>Let&apos;s try one more idea first</small>}</span><span className="sn-arrow">→</span></button>)}
      </div></section>
      <section className="sn-input sn-input--preview"><div className="sn-input-label"><span>Your turn</span><span>⌘ ↵</span></div><textarea rows={3} placeholder="Talk through your approach in plain English…" /><button type="button" className="sn-primary">Talk it through <span>↗</span></button></section>
      <button type="button" className="sn-history-toggle" onClick={() => setHistoryOpen((open) => !open)}><span><i className="sn-history-dot" /> {historyOpen ? 'Hide' : 'Show'} what we&apos;ve covered</span><b>{historyOpen ? '−' : '+'}</b></button>
      {historyOpen && <ol className="sn-history"><li><span className="sn-level">L1</span> Look for the complement, not just another number.</li><li><span className="sn-level">L1</span> A lookup can replace a second pass.</li></ol>}
      <section className="sn-profile sn-profile--preview"><div className="sn-profile-heading"><span className="sn-avatar">ER</span><div><span className="sn-eyebrow">Your learning profile</span><strong>Building fluency</strong></div><span className="sn-session">Session 04</span></div><div className="sn-progress"><span style={{ width: '68%' }} /></div><div className="sn-chips"><span className="sn-chip sn-chip--improving">Hash maps · improving</span><span className="sn-chip">Array traversal</span></div></section>
    </main>
  );
}