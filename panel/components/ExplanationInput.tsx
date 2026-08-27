import { useState } from 'react';
import type { ComprehensionQuestion } from '../../shared/contracts';

/** B1 + B5 — same box, different prompt when a comprehension question is live. */
export function ExplanationInput({
  question,
  disabled,
  onSubmit,
}: {
  question: ComprehensionQuestion | null;
  disabled: boolean;
  onSubmit: (text: string) => void;
}) {
  const [text, setText] = useState('');

  const submit = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setText('');
  };

  return (
    <div className="sn-input">
      {question && <p className="sn-question">{question.prompt}</p>}
      <textarea
        value={text}
        disabled={disabled}
        rows={4}
        placeholder={
          question ? 'Answer in a sentence…' : "Describe your approach in plain English…"
        }
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit();
        }}
      />
      <button type="button" className="sn-primary" disabled={disabled} onClick={submit}>
        {question ? 'Answer' : 'Talk it through'}
      </button>
    </div>
  );
}
