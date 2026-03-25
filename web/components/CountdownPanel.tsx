"use client";

import { cn } from "@/lib/utils";
import { formatCountdown, pad2 } from "@/lib/utils";
import type { CountdownState } from "@/types";

interface CountdownPanelProps {
  secondsLeft: number;
  state: CountdownState;
  interval: bigint;
}

const stateConfig = {
  safe: {
    label: "SAFE",
    labelClass: "text-success",
    bgClass: "border-border/50 bg-card",
    digitClass: "text-foreground",
    glowClass: "",
    badgeClass: "bg-success/10 text-success border-success/30",
  },
  warning: {
    label: "AT RISK",
    labelClass: "text-warning",
    bgClass: "border-warning/30 bg-warning/5 glow-warning",
    digitClass: "text-warning",
    glowClass: "glow-warning",
    badgeClass: "bg-warning/10 text-warning border-warning/30",
  },
  critical: {
    label: "CRITICAL",
    labelClass: "text-destructive",
    bgClass: "border-destructive/30 bg-destructive/5 glow-danger",
    digitClass: "text-destructive",
    glowClass: "glow-danger",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/30",
  },
  expired: {
    label: "EXECUTED",
    labelClass: "text-destructive",
    bgClass: "border-destructive/30 bg-destructive/5 glow-danger",
    digitClass: "text-destructive",
    glowClass: "glow-danger",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/30",
  },
};

interface DigitBlockProps {
  value: number;
  label: string;
  digitClass: string;
}

function DigitBlock({ value, label, digitClass }: DigitBlockProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={cn(
          "mono-num rounded-xl border border-border/30 bg-background/50 px-3 py-2 text-5xl font-bold tabular-nums tracking-tight sm:px-5 sm:py-3 sm:text-6xl",
          digitClass
        )}
      >
        {pad2(value)}
      </div>
      <span className="label-xs">{label}</span>
    </div>
  );
}

export function CountdownPanel({
  secondsLeft,
  state,
  interval: _interval,
}: CountdownPanelProps) {
  const { d, h, m, s } = formatCountdown(secondsLeft);
  const cfg = stateConfig[state];

  return (
    <div
      className={cn(
        "rounded-2xl border p-6 transition-all duration-500",
        cfg.bgClass
      )}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="label-xs">Time Until Execution</p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Check in before deadline to reset the clock
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
            cfg.badgeClass,
            state === "critical" || state === "warning" ? "pulse-warning" : ""
          )}
        >
          {(state === "critical" || state === "warning") && (
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                state === "critical" ? "bg-destructive" : "bg-warning"
              )}
            />
          )}
          {cfg.label}
        </div>
      </div>

      {/* Countdown digits */}
      <div className="flex items-center justify-center gap-3">
        <DigitBlock value={d} label="Days" digitClass={cfg.digitClass} />
        <span className={cn("mb-4 text-3xl font-light", cfg.digitClass)}>:</span>
        <DigitBlock value={h} label="Hours" digitClass={cfg.digitClass} />
        <span className={cn("mb-4 text-3xl font-light", cfg.digitClass)}>:</span>
        <DigitBlock value={m} label="Minutes" digitClass={cfg.digitClass} />
        <span className={cn("mb-4 text-3xl font-light", cfg.digitClass)}>:</span>
        <DigitBlock value={s} label="Seconds" digitClass={cfg.digitClass} />
      </div>

      {/* Warning message */}
      {state === "warning" && (
        <p className="mt-4 text-center text-sm text-warning">
          ⚠ You are within 20% of your deadline. Check in soon.
        </p>
      )}
      {state === "critical" && (
        <p className="mt-4 text-center text-sm font-semibold text-destructive">
          🚨 Critical: Less than 10% of your deadline remains. Check in immediately.
        </p>
      )}
      {state === "expired" && (
        <p className="mt-4 text-center text-sm font-semibold text-destructive">
          Deadline passed — assets will be distributed on next cron execution.
        </p>
      )}
    </div>
  );
}
