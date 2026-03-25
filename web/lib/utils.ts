import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CountdownState } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatAddress = (addr: string): string =>
  `${addr.slice(0, 6)}...${addr.slice(-4)}`;

export const formatEth = (wei: bigint): string => {
  const eth = Number(wei) / 1e18;
  return `${eth.toFixed(4)} STT`;
};

export const formatBps = (bps: bigint): string => {
  return `${(Number(bps) / 100).toFixed(2)}%`;
};

export const formatInterval = (seconds: bigint): string => {
  const s = Number(seconds);
  if (s >= 86400 * 30) return `${Math.floor(s / (86400 * 30))} months`;
  if (s >= 86400 * 7) return `${Math.floor(s / (86400 * 7))} weeks`;
  if (s >= 86400) return `${Math.floor(s / 86400)} days`;
  if (s >= 3600) return `${Math.floor(s / 3600)} hours`;
  return `${Math.floor(s / 60)} minutes`;
};

export const formatCountdown = (
  secondsLeft: number
): { d: number; h: number; m: number; s: number } => {
  if (secondsLeft <= 0) return { d: 0, h: 0, m: 0, s: 0 };
  const d = Math.floor(secondsLeft / 86400);
  const h = Math.floor((secondsLeft % 86400) / 3600);
  const m = Math.floor((secondsLeft % 3600) / 60);
  const s = secondsLeft % 60;
  return { d, h, m, s };
};

export const getCountdownState = (
  secondsLeft: number,
  intervalSeconds: number
): CountdownState => {
  if (secondsLeft <= 0) return "expired";
  const ratio = secondsLeft / intervalSeconds;
  if (ratio <= 0.1) return "critical";
  if (ratio <= 0.2) return "warning";
  return "safe";
};

export const formatTimestamp = (ts: number): string => {
  return new Date(ts).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

export const pad2 = (n: number): string => String(n).padStart(2, "0");
