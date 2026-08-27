import { useEffect, useState } from 'react';
import { ArrayScan } from './renderers/ArrayScan';
import { HashMapFill } from './renderers/HashMapFill';
import type { VisualSpec } from '../shared/contracts';

/** TODO(D4): prev/next, "n of 7", caption slot, arrow keys. */
export function VisualStepper({ spec }: { spec: VisualSpec }) {
  const [i, setI] = useState(0);
  const step = spec.steps[i];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setI((n) => Math.min(n + 1, spec.steps.length - 1));
      if (e.key === 'ArrowLeft') setI((n) => Math.max(n - 1, 0));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [spec.steps.length]);

  return (
    <figure className="sn-visual">
      <figcaption><span className="sn-eyebrow">See it move</span><strong>{spec.title}</strong></figcaption>
      {spec.kind === 'array_scan' ? (
        <ArrayScan values={spec.values} step={step} />
      ) : (
        <HashMapFill values={spec.values} step={step} />
      )}
      <p>{step.caption}</p>
      {step.note && <p className="sn-note">{step.note}</p>}
      <nav aria-label="Visualization steps">
        <button className="sn-step-button" type="button" aria-label="Previous step" onClick={() => setI((n) => Math.max(n - 1, 0))} disabled={i === 0}>
          ←
        </button>
        <span>
          {i + 1} of {spec.steps.length}
        </span>
        <button className="sn-step-button" type="button" aria-label="Next step"
          onClick={() => setI((n) => Math.min(n + 1, spec.steps.length - 1))}
          disabled={i === spec.steps.length - 1}
        >
          →
        </button>
      </nav>
    </figure>
  );
}
