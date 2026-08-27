import type { TwoSumInput, VisualStep } from '../../shared/contracts';

/** TODO(D2): indexed boxes, active cell highlighted, processed cells dimmed. */
export function ArrayScan({ values, step }: { values: TwoSumInput; step: VisualStep }) {
  return (
    <svg viewBox={`0 0 ${values.nums.length * 60 + 20} 90`} role="img">
      {values.nums.map((n, i) => (
        <g key={i} transform={`translate(${10 + i * 60}, 10)`}>
          <rect width="50" height="50" rx="6" />
          <text x="25" y="32">{n}</text>
          <text x="25" y="74">{i}</text>
        </g>
      ))}
    </svg>
  );
}
