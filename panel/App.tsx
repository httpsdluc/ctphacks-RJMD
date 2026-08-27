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
  const [activeView, setActiveView] = useState<'coach' | 'history' | 'settings'>('coach');
  const [showActions, setShowActions] = useState(false);
  const [practiceLevel, setPracticeLevel] = useState<PracticeLevel>('Easy');
  const [username, setUsername] = useState('rayan');

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
      <header className="sn-welcome">
        <div className="sn-welcome-copy">
          <span className="sn-kicker">Sidenote</span>
          <h1>Hello, {username}</h1>
          <p>How can I help you learn today?</p>
        </div>
        <span className="sn-avatar" aria-label="Rayan">R</span>
      </header>
      {activeView === 'coach' && <>
        <header className="sn-header">
        <div>
          <span className="sn-eyebrow">Current problem</span>
          <span className="sn-problem">{coach.problem?.title ?? 'No problem detected'}</span>
        </div>
        <span className="sn-status"><i /> Active</span>
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

        <button type="button" className="sn-more" onClick={() => setShowActions((open) => !open)}>
          <span>{showActions ? 'Hide' : 'More'} help options</span><b>{showActions ? '−' : '+'}</b>
        </button>
        {showActions && <ActionButtons
          offered={r?.offeredActions ?? []}
          blocked={r?.blockedActions ?? []}
          disabled={coach.status === 'thinking'}
          onAction={coach.requestAction}
        />}

        <section className="sn-your-turn">
          <span className="sn-section-label">Your turn</span>
          <ExplanationInput
            question={r?.comprehensionQuestion ?? null}
            disabled={coach.status === 'thinking'}
            onSubmit={coach.submitExplanation}
          />
        </section>
      </>}

      {activeView === 'history' && <section className="sn-view"><span className="sn-kicker">Learning record</span><h2>What we&apos;ve covered</h2><p className="sn-muted">Your recent coaching prompts and hints.</p><HintHistory history={coach.history} /></section>}

      {activeView === 'settings' && <section className="sn-view"><span className="sn-kicker">Personalise</span><h2>Settings</h2><label className="sn-setting"><span>Your name</span><input value={username} maxLength={24} onChange={(e) => setUsername(e.target.value || 'rayan')} /></label><PracticePicker value={practiceLevel} onChange={setPracticeLevel} /><ProfileCard profile={coach.profile} /></section>}

      <nav className="sn-bottom-nav" aria-label="Panel navigation">
        <button className={activeView === 'coach' ? 'is-active' : ''} type="button" onClick={() => setActiveView('coach')}><b>✦</b><span>Coach</span></button>
        <button className={activeView === 'history' ? 'is-active' : ''} type="button" onClick={() => setActiveView('history')}><b>≡</b><span>History</span><i>{coach.history.length}</i></button>
        <button className={activeView === 'settings' ? 'is-active' : ''} type="button" onClick={() => setActiveView('settings')}><b>○</b><span>Settings</span></button>
      </nav>
    </div>
  );
}
