import { useEffect, useState } from 'react';

export type PanelPage = 'coach' | 'practice' | 'progress' | 'settings';

const pageLabels: Record<PanelPage, string> = {
  coach: 'Coach room',
  practice: 'Practice queue',
  progress: 'Your progress',
  settings: 'Settings',
};

export function PanelMenu({ activePage, onNavigate }: { activePage: PanelPage; onNavigate: (page: PanelPage) => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(() => localStorage.getItem('sidenote-name') ?? '');
  const [draftName, setDraftName] = useState(name);
  const greeting = name ? `Welcome back, ${name}. Your bugs missed you.` : 'A tiny corner office for your next breakthrough.';

  useEffect(() => {
    localStorage.setItem('sidenote-name', name);
  }, [name]);

  const saveName = () => {
    const nextName = draftName.trim().slice(0, 30);
    setName(nextName);
  };

  return (
    <>
      <header className="sn-topbar">
        <button type="button" className="sn-menu-button" aria-label="Open ThinkPad menu" aria-expanded={open} onClick={() => setOpen(true)}><span /><span /><span /></button>
        <div><span className="sn-mark">ThinkPad</span><span className="sn-topbar-page">{pageLabels[activePage]}</span></div>
        <span className="sn-ai-pill"><i /> AI</span>
      </header>
      {open && <button type="button" className="sn-drawer-scrim" aria-label="Close menu" onClick={() => setOpen(false)} />}
      <aside className={`sn-drawer ${open ? 'is-open' : ''}`} aria-label="ThinkPad navigation">
        <div className="sn-drawer-head"><span className="sn-mark">ThinkPad</span><button type="button" className="sn-close-button" aria-label="Close menu" onClick={() => setOpen(false)}>×</button></div>
        <div className="sn-drawer-greeting"><span className="sn-eyebrow">Your corner of the internet</span><strong>{greeting}</strong></div>
        <nav className="sn-drawer-nav">
          {(Object.keys(pageLabels) as PanelPage[]).map((page) => <button key={page} type="button" className={activePage === page ? 'is-active' : ''} onClick={() => { onNavigate(page); setOpen(false); }}><span>{page === 'coach' ? '✦' : page === 'practice' ? '◈' : page === 'progress' ? '↗' : '⚙'}</span>{pageLabels[page]}<b>→</b></button>)}
        </nav>
        <section className="sn-name-form"><span className="sn-eyebrow">Make it personal</span><label htmlFor="sidenote-name">What should I call you?</label><div><input id="sidenote-name" value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder="Your name" maxLength={30} onKeyDown={(event) => { if (event.key === 'Enter') saveName(); }} /><button type="button" onClick={saveName}>Save</button></div><small>Only saved on this device. No account needed.</small></section>
        <p className="sn-drawer-foot">Learning is allowed to be a little theatrical.</p>
      </aside>
    </>
  );
}