export const CHECK_IN_REGISTRY_ABI = [
  {
    type: "constructor",
    inputs: [
      { name: "_willExecutor", type: "address" },
      { name: "_minInterval", type: "uint256" },
    ],
    stateMutability: "nonpayable",
  },
  { type: "error", name: "AlreadyActiveWill", inputs: [] },
  { type: "error", name: "NoActiveWill", inputs: [] },
  { type: "error", name: "InvalidBeneficiaries", inputs: [] },
  { type: "error", name: "InvalidShares", inputs: [] },
  { type: "error", name: "InvalidInterval", inputs: [] },
  { type: "error", name: "ZeroAmount", inputs: [] },
  { type: "error", name: "NotExecutor", inputs: [] },
  { type: "error", name: "TransferFailed", inputs: [] },
  { type: "error", name: "TooManyActiveWills", inputs: [] },
  {
    type: "event",
    name: "WillCreated",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "interval", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "CheckedIn",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "newDeadline", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "Deposited",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "amount", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "WillCancelled",
    inputs: [{ name: "owner", type: "address", indexed: true }],
  },
  {
    type: "event",
    name: "WillExecuted",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "totalDistributed", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "ExecutorUpdated",
    inputs: [{ name: "executor", type: "address", indexed: true }],
  },
  {
    type: "function",
    name: "createWill",
    inputs: [
      { name: "beneficiaries", type: "address[]" },
      { name: "shares", type: "uint256[]" },
      { name: "interval", type: "uint256" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "imAlive",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "deposit",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "cancelWill",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "markExecuted",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "distributedAmount", type: "uint256" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "getWill",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "owner", type: "address" },
          { name: "beneficiaries", type: "address[]" },
          { name: "shares", type: "uint256[]" },
          { name: "interval", type: "uint256" },
          { name: "deadline", type: "uint256" },
          { name: "balance", type: "uint256" },
          { name: "active", type: "bool" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getActiveOwners",
    inputs: [],
    outputs: [{ name: "", type: "address[]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "SHARES_TOTAL_BPS",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "minInterval",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "willExecutor",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;

export const WILL_EXECUTOR_ABI = [
  {
    type: "event",
    name: "DeadlineReset",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "newDeadline", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "WillExecuted",
    inputs: [
      { name: "owner", type: "address", indexed: true },
      { name: "totalDistributed", type: "uint256", indexed: false },
    ],
  },
  {
    type: "function",
    name: "onCheckin",
    inputs: [{ name: "eventData", type: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "onCron",
    inputs: [{ name: "", type: "bytes" }],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "PRECOMPILE",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "registry",
    inputs: [],
    outputs: [{ name: "", type: "address" }],
    stateMutability: "view",
  },
] as const;
