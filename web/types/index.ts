export interface Will {
  owner: `0x${string}`;
  beneficiaries: `0x${string}`[];
  shares: bigint[];
  interval: bigint;
  deadline: bigint;
  balance: bigint;
  active: boolean;
}

export interface ReactivityEvent {
  id: string;
  type:
    | "CheckedIn"
    | "DeadlineReset"
    | "WillExecuted"
    | "WillCreated"
    | "WillCancelled"
    | "Deposited";
  owner: `0x${string}`;
  blockNumber: bigint;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface BeneficiaryRow {
  address: string;
  bps: string;
}

export type CountdownState = "safe" | "warning" | "critical" | "expired";
export type WillStatus = "active" | "executed" | "cancelled" | "none";
export type IntervalPreset = "7d" | "30d" | "90d" | "custom";
