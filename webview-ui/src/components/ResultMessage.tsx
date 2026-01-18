import { useId } from 'react';
import type { ActionResult } from '../types';

interface ResultMessageProps {
  results: ActionResult[];
}

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
  </svg>
);

const WarningIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const BlockedIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

export function ResultMessage({ results }: ResultMessageProps) {
  const idPrefix = useId();

  return (
    <div className="message-animate space-y-2">
      {results.map((r, idx) => {
        const key = `${idPrefix}-result-${idx}`;

        if (r.rejected) {
          return (
            <div key={key} className="rounded-xl bg-surface-2 border border-error/20 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-error/5 border-b border-error/10">
                <div className="w-5 h-5 rounded-full bg-error/10 flex items-center justify-center text-error">
                  <BlockedIcon />
                </div>
                <span className="text-[11px] font-medium text-error uppercase tracking-wide">Rejected</span>
                <span className="text-[11px] text-foreground-muted truncate flex-1">{r.action}</span>
              </div>
              <div className="px-3 py-2">
                <p className="text-[12px] text-error/80">{r.rejectionReason}</p>
              </div>
            </div>
          );
        }

        if (r.success) {
          const hasOutput = r.output && r.output.trim() && r.output !== '(no output)';
          const showsOutput = /^(List Dir|Read|Terminal|Grep|File Search|Codebase Search|Shell):/i.test(r.action);
          const displayOutput = hasOutput
            ? (r.output!.length > 200 ? r.output!.substring(0, 200) + '...' : r.output)
            : (showsOutput ? 'No Content' : null);

          return (
            <div key={key} className="rounded-xl bg-surface-2 border border-success/20 overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-success/5 border-b border-success/10">
                <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center text-success">
                  <CheckIcon />
                </div>
                <span className="text-[11px] font-medium text-success uppercase tracking-wide">Done</span>
                <span className="text-[11px] text-foreground-muted truncate flex-1">{r.action}</span>
              </div>
              {displayOutput && (
                <div className="p-3">
                  <pre className="text-[11px] text-foreground-muted font-mono leading-relaxed whitespace-pre-wrap overflow-x-auto">
                    {displayOutput}
                  </pre>
                </div>
              )}
            </div>
          );
        }

        return (
          <div key={key} className="rounded-xl bg-surface-2 border border-warning/20 overflow-hidden">
            <div className="flex items-center gap-2 px-3 py-2 bg-warning/5 border-b border-warning/10">
              <div className="w-5 h-5 rounded-full bg-warning/10 flex items-center justify-center text-warning">
                <WarningIcon />
              </div>
              <span className="text-[11px] font-medium text-warning uppercase tracking-wide">Failed</span>
              <span className="text-[11px] text-foreground-muted truncate flex-1">{r.action}</span>
            </div>
            <div className="px-3 py-2">
              <p className="text-[12px] text-warning/80">{r.error || 'Unknown error'}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
