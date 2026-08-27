import { HELP_ACTIONS, HELP_ACTION_LABELS } from '../../shared/contracts';
import type { BlockedAction, HelpAction } from '../../shared/contracts';

/**
 * B2. Enabled state is driven ENTIRELY by `offeredActions` — the panel never
 * decides what help is available. A disabled button explains why on hover
 * and on focus, in the coach's voice.
 */
export function ActionButtons({
  offered,
  blocked,
  disabled,
  onAction,
}: {
  offered: HelpAction[];
  blocked: BlockedAction[];
  disabled: boolean;
  onAction: (action: HelpAction) => void;
}) {
  const reasonFor = (a: HelpAction) => blocked.find((b) => b.action === a)?.reason;

  return (
    <div className="sn-actions">
      {HELP_ACTIONS.map((action) => {
        const isOffered = offered.includes(action);
        const reason = reasonFor(action);
        return (
          <button
            key={action}
            type="button"
            className="sn-action"
            disabled={!isOffered || disabled}
            title={isOffered ? undefined : reason}
            aria-describedby={reason ? `sn-why-${action}` : undefined}
            onClick={() => onAction(action)}
          >
            {HELP_ACTION_LABELS[action]}
            {reason && !isOffered && (
              <span id={`sn-why-${action}`} className="sn-why">
                {reason}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
