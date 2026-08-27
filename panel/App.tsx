import { useState } from 'react';
import { useCoach } from './state/useCoach';
import { CoachMessage } from './components/CoachMessage';
import { ActionButtons } from './components/ActionButtons';
import { ExplanationInput } from './components/ExplanationInput';
import { HintHistory } from './components/HintHistory';
import { VideoCard } from './components/VideoCard';
import { ProfileCard } from './components/ProfileCard';
import { PasteFallback } from './components/PasteFallback';
import { VisualStepper } from '../visuals/Stepper';
import { DesignPreview } from './DesignPreview';
import { PracticePicker, type PracticeLevel } from './components/PracticePicker';

export function App() {
  if (new URLSearchParams(window.location.search).has('design')) {
    return <DesignPreview />;
  }

  const coach = useCoach();
  const [showHistory, setShowHistory] = useState(false);
  const [practiceLevel, setPracticeLevel] = useState<PracticeLevel>('Easy');

  if (coach.status === 'loading') {
    return <div className="sn-shell sn-muted">Getting my bearings…</div>;
  }

  if (coach.status === 'needs_paste') {
    return (
      <div className="sn-shell">
        <PasteFallback onSubmit={coach.submitPaste} />
      </div>
    );
  }

  const r = coach.latest;

  return (
    <div className="sn-shell">
      <PracticePicker value={practiceLevel} onChange={setPracticeLevel} />
      <header className="sn-header">
        <span className="sn-mark">Sidenote</span>
        <span className="sn-problem">{coach.problem?.title ?? 'No problem detected'}</span>
      </header>

      {r?.learningGoal && (
        <p className="sn-goal">
          <span className="sn-goal-label">What we're after</span>
          {r.learningGoal}
        </p>
      )}

      <CoachMessage response={r} thinking={coach.status === 'thinking'} />

      {r?.visual && <VisualStepper spec={r.visual} />}
      {r?.video && <VideoCard video={r.video} />}

      <ActionButtons
        offered={r?.offeredActions ?? []}
        blocked={r?.blockedActions ?? []}
        disabled={coach.status === 'thinking'}
        onAction={coach.requestAction}
      />

      <ExplanationInput
        question={r?.comprehensionQuestion ?? null}
        disabled={coach.status === 'thinking'}
        onSubmit={coach.submitExplanation}
      />

      <button
        type="button"
        className="sn-link"
        onClick={() => setShowHistory((v) => !v)}
      >
        {showHistory ? 'Hide' : 'Show'} what we've covered ({coach.history.length})
      </button>
      {showHistory && <HintHistory history={coach.history} />}

      <ProfileCard profile={coach.profile} />
    </div>
  );
}
