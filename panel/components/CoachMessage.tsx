import type { CoachResponse } from '../../shared/contracts';

/** B1. The coach never speaks in raw JSON, and never shows a stack trace. B8. */
export function CoachMessage({
  response,
  thinking,
}: {
  response: CoachResponse | null;
  thinking: boolean;
}) {
  if (thinking) {
    return <div className="sn-coach sn-coach--thinking"><span className="sn-ai-label"><i /> AI COACH · ANALYZING</span>Thinking that through…</div>;
  }
  if (!response) {
    return (
      <div className="sn-coach sn-muted">
        Tell me how you're planning to solve this — in your own words, before any code.
      </div>
    );
  }
  return (
    <div className="sn-coach">
      <span className="sn-ai-label"><i /> AI COACH · GUIDANCE</span>
      {response.hintLevel && (
        <span className="sn-level">Hint {response.hintLevel} of 4</span>
      )}
      <p>{response.message}</p>
      {response.analogy && <p className="sn-analogy">{response.analogy}</p>}
    </div>
  );
}
