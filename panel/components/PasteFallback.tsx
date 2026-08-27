import { useState } from 'react';

/** A5 / B8 — the demo default path. Works with the content script disabled. */
export function PasteFallback({
  onSubmit,
}: {
  onSubmit: (v: { statement: string; code: string; language: string }) => void;
}) {
  const [statement, setStatement] = useState('');
  const [code, setCode] = useState('');

  return (
    <div className="sn-paste">
      <p>I can't read this page directly. Paste the problem and I'll pick it up.</p>
      <textarea rows={5} placeholder="Problem statement…" value={statement}
        onChange={(e) => setStatement(e.target.value)} />
      <textarea rows={5} placeholder="Your code (optional)…" value={code}
        onChange={(e) => setCode(e.target.value)} />
      <button type="button" className="sn-primary"
        onClick={() => onSubmit({ statement, code, language: 'python' })}>
        Start
      </button>
    </div>
  );
}
