import type { CoachResponse } from '../../shared/contracts';

/** TODO(B3): scrollback + visible level escalation. */
export function HintHistory({ history }: { history: CoachResponse[] }) {
  return (
    <ol className="sn-history">
      {history.map((h, i) => (
        <li key={i}>
          {h.hintLevel && <span className="sn-level">L{h.hintLevel}</span>}
          {h.message}
        </li>
      ))}
    </ol>
  );
}
