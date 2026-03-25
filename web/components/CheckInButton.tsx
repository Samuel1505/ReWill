"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Heart, Loader2, CheckCircle2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { useImAlive } from "@/hooks/useWillActions";
import { getExplorerTxUrl } from "@/lib/somnia";
import { toast } from "sonner";
import type { CountdownState } from "@/types";

interface CheckInButtonProps {
  onSuccess?: () => void;
  countdownState: CountdownState;
}

export function CheckInButton({ onSuccess, countdownState }: CheckInButtonProps) {
  const { imAlive, hash, isPending, isConfirming, isConfirmed, error } =
    useImAlive();

  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success("Checked in successfully!", {
        description: "Deadline has been reset. Stay alive! 💚",
        action: {
          label: "View Tx",
          onClick: () => window.open(getExplorerTxUrl(hash), "_blank"),
        },
      });
      onSuccess?.();
    }
  }, [isConfirmed, hash, onSuccess]);

  useEffect(() => {
    if (error) {
      toast.error("Check-in failed", {
        description: error.message?.slice(0, 80),
      });
    }
  }, [error]);

  const isLoading = isPending || isConfirming;
  const isUrgent = countdownState === "warning" || countdownState === "critical";

  return (
    <div className="flex flex-col gap-3">
      <Button
        onClick={() => imAlive()}
        disabled={isLoading || isConfirmed}
        size="lg"
        className={cn(
          "h-14 w-full gap-2 text-base font-semibold transition-all duration-300",
          isUrgent && !isLoading
            ? "animate-pulse bg-primary shadow-[0_0_20px_rgba(99,102,241,0.5)]"
            : "bg-primary"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin" />
            {isConfirming ? "Confirming..." : "Sending..."}
          </>
        ) : isConfirmed ? (
          <>
            <CheckCircle2 className="h-5 w-5 text-success" />
            Confirmed!
          </>
        ) : (
          <>
            <Heart className="h-5 w-5" />
            I&apos;m Alive
          </>
        )}
      </Button>

      {hash && (
        <a
          href={getExplorerTxUrl(hash)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
          View transaction
        </a>
      )}

      <p className="text-center text-xs text-muted-foreground">
        Calling{" "}
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
          imAlive()
        </code>{" "}
        on CheckInRegistry
      </p>
    </div>
  );
}
