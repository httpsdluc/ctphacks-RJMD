import type { TwoSumInput, VisualStep } from '../../shared/contracts';

/** TODO(D3): key→value rows with just_added and matched states. */
export function HashMapFill({ values, step }: { values: TwoSumInput; step: VisualStep }) {
  return (
    <svg viewBox="0 0 320 200" role="img">
      {step.map.map((row, i) => (
        <g key={row.key} transform={`translate(10, ${10 + i * 34})`}>
          <rect width="300" height="28" rx="6" />
          <text x="12" y="19">{row.key} → {row.value}</text>
        </g>
      ))}
    </svg>
  );
}
