"use client";

import { useState, useEffect } from "react";
import type { CountdownState } from "@/types";
import { getCountdownState } from "@/lib/utils";

interface UseCountdownResult {
  secondsLeft: number;
  state: CountdownState;
}

export function useCountdown(
  deadline: bigint | undefined,
  interval: bigint | undefined
): UseCountdownResult {
  const [secondsLeft, setSecondsLeft] = useState<number>(0);

  useEffect(() => {
    if (!deadline) {
      setSecondsLeft(0);
      return;
    }

    const compute = () => {
      const nowSec = Math.floor(Date.now() / 1000);
      const deadlineSec = Number(deadline);
      setSecondsLeft(Math.max(0, deadlineSec - nowSec));
    };

    compute();
    const timer = setInterval(compute, 1000);
    return () => clearInterval(timer);
  }, [deadline]);

  const intervalSeconds = interval ? Number(interval) : 1;
  const state = getCountdownState(secondsLeft, intervalSeconds);

  return { secondsLeft, state };
}
