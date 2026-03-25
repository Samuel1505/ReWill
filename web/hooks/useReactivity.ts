"use client";

import { useState, useCallback } from "react";
import { useWatchContractEvent } from "wagmi";
import { REGISTRY_ADDRESS, EXECUTOR_ADDRESS } from "@/lib/somnia";
import { CHECK_IN_REGISTRY_ABI, WILL_EXECUTOR_ABI } from "@/lib/abi";
import type { ReactivityEvent } from "@/types";

const MAX_EVENTS = 20;

export function useReactivity() {
  const [events, setEvents] = useState<ReactivityEvent[]>([]);

  const pushEvent = useCallback((evt: ReactivityEvent) => {
    setEvents((prev) => [evt, ...prev].slice(0, MAX_EVENTS));
  }, []);

  useWatchContractEvent({
    address: REGISTRY_ADDRESS,
    abi: CHECK_IN_REGISTRY_ABI,
    eventName: "CheckedIn",
    onLogs(logs) {
      for (const log of logs) {
        const args = log.args as { owner?: `0x${string}`; newDeadline?: bigint };
        if (!args.owner) continue;
        pushEvent({
          id: `checkedin-${log.transactionHash}-${log.logIndex}`,
          type: "CheckedIn",
          owner: args.owner,
          blockNumber: log.blockNumber ?? 0n,
          timestamp: Date.now(),
          data: { newDeadline: args.newDeadline?.toString() },
        });
      }
    },
  });

  useWatchContractEvent({
    address: REGISTRY_ADDRESS,
    abi: CHECK_IN_REGISTRY_ABI,
    eventName: "WillCreated",
    onLogs(logs) {
      for (const log of logs) {
        const args = log.args as { owner?: `0x${string}`; interval?: bigint };
        if (!args.owner) continue;
        pushEvent({
          id: `created-${log.transactionHash}-${log.logIndex}`,
          type: "WillCreated",
          owner: args.owner,
          blockNumber: log.blockNumber ?? 0n,
          timestamp: Date.now(),
          data: { interval: args.interval?.toString() },
        });
      }
    },
  });

  useWatchContractEvent({
    address: REGISTRY_ADDRESS,
    abi: CHECK_IN_REGISTRY_ABI,
    eventName: "WillCancelled",
    onLogs(logs) {
      for (const log of logs) {
        const args = log.args as { owner?: `0x${string}` };
        if (!args.owner) continue;
        pushEvent({
          id: `cancelled-${log.transactionHash}-${log.logIndex}`,
          type: "WillCancelled",
          owner: args.owner,
          blockNumber: log.blockNumber ?? 0n,
          timestamp: Date.now(),
          data: {},
        });
      }
    },
  });

  useWatchContractEvent({
    address: REGISTRY_ADDRESS,
    abi: CHECK_IN_REGISTRY_ABI,
    eventName: "Deposited",
    onLogs(logs) {
      for (const log of logs) {
        const args = log.args as { owner?: `0x${string}`; amount?: bigint };
        if (!args.owner) continue;
        pushEvent({
          id: `deposited-${log.transactionHash}-${log.logIndex}`,
          type: "Deposited",
          owner: args.owner,
          blockNumber: log.blockNumber ?? 0n,
          timestamp: Date.now(),
          data: { amount: args.amount?.toString() },
        });
      }
    },
  });

  useWatchContractEvent({
    address: EXECUTOR_ADDRESS,
    abi: WILL_EXECUTOR_ABI,
    eventName: "DeadlineReset",
    onLogs(logs) {
      for (const log of logs) {
        const args = log.args as { owner?: `0x${string}`; newDeadline?: bigint };
        if (!args.owner) continue;
        pushEvent({
          id: `reset-${log.transactionHash}-${log.logIndex}`,
          type: "DeadlineReset",
          owner: args.owner,
          blockNumber: log.blockNumber ?? 0n,
          timestamp: Date.now(),
          data: { newDeadline: args.newDeadline?.toString() },
        });
      }
    },
  });

  useWatchContractEvent({
    address: EXECUTOR_ADDRESS,
    abi: WILL_EXECUTOR_ABI,
    eventName: "WillExecuted",
    onLogs(logs) {
      for (const log of logs) {
        const args = log.args as {
          owner?: `0x${string}`;
          totalDistributed?: bigint;
        };
        if (!args.owner) continue;
        pushEvent({
          id: `executed-${log.transactionHash}-${log.logIndex}`,
          type: "WillExecuted",
          owner: args.owner,
          blockNumber: log.blockNumber ?? 0n,
          timestamp: Date.now(),
          data: { totalDistributed: args.totalDistributed?.toString() },
        });
      }
    },
  });

  const clearEvents = useCallback(() => setEvents([]), []);

  return { events, clearEvents };
}
