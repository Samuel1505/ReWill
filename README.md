# ReWill — Trustless On-Chain Inheritance Protocol

> A fully autonomous, trustless asset-inheritance system built on the **Somnia** blockchain. No keeper bots, no backend servers, no human intervention — ever.

---

## Table of Contents

1. [Overview](#overview)
2. [How It Works](#how-it-works)
3. [Core Architecture](#core-architecture)
4. [Smart Contracts](#smart-contracts)
   - [CheckInRegistry.sol](#checkinregistrysol)
   - [WillExecutor.sol](#willexecutorsol)
   - [SomniaEventHandler.sol](#somniaeventhandlersol)
5. [Somnia Reactivity Layer](#somnia-reactivity-layer)
   - [Event Subscription (CheckIn Listener)](#event-subscription-checkin-listener)
   - [Cron Subscription (Deadline Enforcer)](#cron-subscription-deadline-enforcer)
6. [Frontend Application](#frontend-application)
   - [Tech Stack](#tech-stack)
   - [Key Components](#key-components)
   - [Hooks](#hooks)
7. [Repository Structure](#repository-structure)
8. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Smart Contract Deployment](#smart-contract-deployment)
   - [Setting Up Somnia Reactivity Subscriptions](#setting-up-somnia-reactivity-subscriptions)
   - [Running the Frontend](#running-the-frontend)
9. [Environment Variables](#environment-variables)
10. [Deployed Contracts (Somnia Testnet)](#deployed-contracts-somnia-testnet)
11. [Key Flows](#key-flows)
12. [Security Considerations](#security-considerations)

---

## Overview

**ReWill** is a decentralized, on-chain inheritance protocol that allows anyone to create a digital will without trusting a third party, a backend service, or an off-chain keeper. The protocol is powered by **Somnia's Reactivity system** — a chain-native event and cron subscription mechanism that triggers smart contract execution directly at the protocol level.

The core premise is simple:

> If you stop checking in within your configured interval, your on-chain assets are automatically distributed to your beneficiaries — forever, with no one able to stop it.

Key properties:

| Property | Value |
|---|---|
| **Chain** | Somnia Testnet (Chain ID: 50312) |
| **Native Token** | STT |
| **Trustless** | No admin keys, no upgradeability, no pause mechanism |
| **Autonomous** | Execution triggered by Somnia Reactivity (no bots) |
| **Flexible** | Custom check-in intervals from 1 minute to years |
| **Multi-beneficiary** | Up to 10 beneficiaries with basis-point share allocation |

---

## How It Works

The protocol follows a simple lifecycle:

```
1. CREATOR  →  createWill()       Register beneficiaries, shares & check-in interval
2. CREATOR  →  deposit()          Fund the will with STT at any time
3. CREATOR  →  imAlive()          Periodically check in to reset the deadline
4. PROTOCOL →  onCron()           Somnia cron fires every ~600 blocks
5. PROTOCOL →  _distribute()      If deadline passed & balance > 0, execute the will
6. BENEFICIARIES receive STT      Proportional to their basis-point shares
```

**If the creator checks in before their deadline expires** → deadline resets, everything continues.

**If the creator misses their deadline** → the next cron tick distributes funds to all beneficiaries automatically, with no ability to recover or cancel.

---

## Core Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Next.js 16)                   │
│  WillCreator ─── Dashboard ─── CountdownPanel ─── ActivityFeed  │
│        │               │                                │        │
│    wagmi + viem    useWill hook              useReactivity hook  │
└────────────────────────────┬───────────────────────────┬────────┘
                             │ RPC (https)               │ WebSocket events
                             ▼                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SOMNIA TESTNET (Chain ID: 50312)            │
│                                                                  │
│  ┌──────────────────────────┐    ┌──────────────────────────┐   │
│  │   CheckInRegistry.sol    │    │    WillExecutor.sol       │   │
│  │                          │◄───│                          │   │
│  │  - createWill()          │    │  - onCheckin()  ◄────────┼───┼── Reactivity Event Sub
│  │  - imAlive()             │    │  - onCron()     ◄────────┼───┼── Reactivity Cron Sub
│  │  - deposit()             │    │  - _distribute()         │   │
│  │  - cancelWill()          │    │                          │   │
│  │  - markExecuted()        │────►  (calls markExecuted)    │   │
│  └──────────────────────────┘    └──────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │         Somnia Reactivity Precompile (0x...0100)          │   │
│  │   Event Sub: CheckedIn ──► WillExecutor.onCheckin()       │   │
│  │   Cron Sub:  every 600 blocks ──► WillExecutor.onCron()   │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

The system has **two contracts** and **two Somnia Reactivity subscriptions** that wire them together without any off-chain infrastructure.

---

## Smart Contracts

### `CheckInRegistry.sol`

The main state machine of the protocol. It owns all will data and all deposited funds.

**Storage:**

| Field | Type | Description |
|---|---|---|
| `wills` | `mapping(address => Will)` | One will per address |
| `activeOwners` | `address[]` | Array of all owners with active wills |
| `activeOwnerIndexPlusOne` | `mapping(address => uint256)` | O(1) removal index |
| `minInterval` | `uint256` (immutable) | Minimum allowed check-in interval (set at deploy) |
| `willExecutor` | `address` | The only address allowed to call `markExecuted()` |

**The `Will` struct:**

```solidity
struct Will {
    address owner;
    address[] beneficiaries;  // up to 10
    uint256[] shares;          // basis points, must sum to 10,000
    uint256 interval;          // seconds between required check-ins
    uint256 deadline;          // block.timestamp when will executes if no check-in
    uint256 balance;           // STT held in escrow (wei)
    bool active;
}
```

**Key Functions:**

| Function | Visibility | Description |
|---|---|---|
| `createWill(beneficiaries, shares, interval)` | `external` | Register a new will. Validates shares sum to 10,000 bps. Sets `deadline = now + interval`. |
| `imAlive()` | `external` | Check-in. Resets `deadline = now + interval`. Emits `CheckedIn`. |
| `deposit()` | `external payable` | Top up the will's STT balance. |
| `cancelWill()` | `external` | Cancel and refund full balance to the owner. |
| `markExecuted(owner)` | `external onlyExecutor` | Called by `WillExecutor` to mark a will as executed and transfer its balance. |
| `getWill(owner)` | `view` | Returns the full `Will` struct for a given owner. |
| `getActiveOwners()` | `view` | Returns all active owner addresses (used by cron). |

**Custom Errors:**

```
AlreadyActiveWill   — Owner already has an active will
NoActiveWill        — No will found for the caller
InvalidBeneficiaries — Zero, more than 10, or zero address in list
InvalidShares       — Shares array length mismatch or total != 10,000 bps
InvalidInterval     — Below the configured minInterval
ZeroAmount          — deposit() called with msg.value == 0
NotExecutor         — markExecuted() called by non-executor
TransferFailed      — ETH transfer to beneficiary or owner failed
TooManyActiveWills  — Global cap of 50 active wills (testnet safety)
```

---

### `WillExecutor.sol`

The automation engine. It is the only contract authorised to call `markExecuted()` on the registry. It receives calls exclusively from the **Somnia Reactivity precompile** at address `0x0000000000000000000000000000000000000100`.

```solidity
address public constant PRECOMPILE = 0x0000000000000000000000000000000000000100;
```

**Key Functions:**

| Function | Modifier | Description |
|---|---|---|
| `onCheckin(bytes eventData)` | `onlyPrecompile` | Called when `CheckedIn` event fires on the registry. Decodes `(owner, newDeadline)` and emits `DeadlineReset`. |
| `onCron(bytes)` | `onlyPrecompile` | Called every ~600 blocks by the Reactivity cron. Iterates all active owners and executes any overdue wills. |
| `_distribute(owner, Will)` | `internal` | Calls `markExecuted()` to pull funds from registry, then distributes proportionally to each beneficiary using basis-point math. Rounding dust goes to the last beneficiary. |

**Distribution math:**

```solidity
uint256 part = (amount * shares[i]) / 10_000;
```

Dust (rounding remainder) is sent to the last beneficiary to ensure no STT is locked permanently.

**Security:** Both `onCheckin` and `onCron` are protected by `onlyPrecompile`, meaning only the Somnia chain-level reactivity system can trigger execution. No EOA or other contract can call these functions.

---

### `SomniaEventHandler.sol`

An abstract base contract that implements the `ISomniaEventHandler` interface required by the Somnia Reactivity system. `WillExecutor` inherits from it.

```solidity
interface ISomniaEventHandler {
    function _onEvent(
        address emitter,
        bytes32[] calldata eventTopics,
        bytes calldata data
    ) external;
}
```

`WillExecutor` overrides `_handleEvent` as a no-op since it uses the more specific `onCheckin` and `onCron` entry points directly.

---

## Somnia Reactivity Layer

Somnia's Reactivity system is an EVM-native pub/sub mechanism that allows on-chain subscriptions to fire smart contract calls in response to events or block timers — with **no off-chain infrastructure**.

ReWill registers two subscriptions via `@somnia-chain/reactivity` SDK:

### Event Subscription (CheckIn Listener)

**Trigger:** Every time `CheckedIn(address indexed owner, uint256 newDeadline)` is emitted by `CheckInRegistry`.

**Action:** The precompile calls `WillExecutor.onCheckin(bytes)` with the ABI-encoded `(owner, newDeadline)`.

**Effect:** `WillExecutor` emits `DeadlineReset(owner, newDeadline)` — a signal the frontend subscribes to in real-time to animate the countdown panel.

```
CheckInRegistry.imAlive()
  └─► emit CheckedIn(owner, newDeadline)
        └─► [Somnia Reactivity Event Sub]
              └─► WillExecutor.onCheckin(abi.encode(owner, newDeadline))
                    └─► emit DeadlineReset(owner, newDeadline)
```

**Subscription parameters:**

| Parameter | Value |
|---|---|
| `emitter` | `CheckInRegistry` address |
| `eventTopics[0]` | `keccak256("CheckedIn(address,uint256)")` = `0x503c...dce0` |
| `handlerFunctionSelector` | `WillExecutor.onCheckin` = `0x56d8434a` |
| `isGuaranteed` | `true` |
| `gasLimit` | `300,000` |

### Cron Subscription (Deadline Enforcer)

**Trigger:** Every `600` blocks (~10 minutes on Somnia testnet).

**Action:** The precompile calls `WillExecutor.onCron(bytes)`.

**Effect:** For every active will where `block.timestamp > deadline && balance > 0`, the will is executed and funds distributed.

```
Every ~600 blocks:
  └─► [Somnia Reactivity Cron Sub]
        └─► WillExecutor.onCron()
              └─► registry.getActiveOwners()
                    └─► for each owner:
                          if (active && balance > 0 && block.timestamp > deadline)
                            └─► _distribute(owner, will)
                                  └─► registry.markExecuted(owner)  → pull funds
                                  └─► transfer STT to each beneficiary
                                  └─► emit WillExecuted(owner, totalDistributed)
```

**Subscription parameters:**

| Parameter | Value |
|---|---|
| `intervalBlocks` | `600` |
| `handlerFunctionSelector` | `WillExecutor.onCron` = `0x147f4f68` |
| `isGuaranteed` | `true` |
| `gasLimit` | `500,000` |

---

## Frontend Application

### Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, Turbopack) |
| **Language** | TypeScript 5 |
| **Styling** | Tailwind CSS v4 |
| **UI Components** | shadcn/ui (built on Base UI + Radix primitives) |
| **Web3 / Wallet** | wagmi v2 + viem v2 |
| **Wallet UI** | RainbowKit v2 |
| **Data Fetching** | TanStack Query v5 |
| **Notifications** | Sonner |
| **Icons** | Lucide React |
| **Chain** | Somnia Testnet (custom `defineChain`) |

### Key Components

```
web/
├── app/
│   ├── page.tsx            — Root page; orchestrates landing / creator / dashboard views
│   ├── layout.tsx          — Global layout; Providers wrapper + Toaster
│   └── providers.tsx       — WagmiProvider + QueryClientProvider + RainbowKit
│
└── components/
    ├── Navbar.tsx           — Top navigation bar with wallet connect button
    ├── LandingSection.tsx   — Hero shown to unauthenticated visitors
    │
    ├── WillCreator.tsx      — Multi-step form to create a new will
    │                          · Beneficiary rows (address + basis-point share)
    │                          · Check-in interval picker (presets + custom: any unit)
    │                          · Validation (shares must total 10,000 bps, ≥ 1 min interval)
    │
    ├── Dashboard.tsx        — Full dashboard for users with an active will
    │   ├── CountdownPanel.tsx  — Live countdown to next deadline (d/h/m/s) with state colouring
    │   ├── CheckInButton.tsx   — One-click imAlive() transaction
    │   ├── WillSummaryCard.tsx — Balance, interval, deadline + top-up deposit + cancel
    │   ├── BeneficiaryList.tsx — Visual share bar + per-beneficiary rows with copy/explorer links
    │   └── ActivityFeed.tsx    — Real-time event stream from the chain
    │
    └── ui/                  — shadcn primitive components (button, card, input, dialog, etc.)
```

#### `WillCreator.tsx` — Interval Picker Detail

The custom interval input accepts **any** duration, not just days. Users pick a unit first, then enter a number:

| Unit | Multiplier |
|---|---|
| Minutes | `× 60` seconds |
| Hours | `× 3,600` seconds |
| Days | `× 86,400` seconds |
| Weeks | `× 604,800` seconds |

Pre-set quick-pick buttons (7 Days, 30 Days, 90 Days) bypass the custom picker for common cases. The minimum enforced interval is **1 minute** (60 seconds), matching the `minInterval` set on the deployed testnet registry.

#### `CountdownPanel.tsx` — Countdown States

The panel changes colour based on how much of the interval is remaining:

| State | Condition | Visual |
|---|---|---|
| `safe` | > 20% remaining | Green |
| `warning` | 10–20% remaining | Amber |
| `critical` | < 10% remaining | Red / pulsing |
| `expired` | Deadline passed | Red / static |

### Hooks

| Hook | File | Purpose |
|---|---|---|
| `useWill(address)` | `hooks/useWill.ts` | Reads the caller's will from `CheckInRegistry.getWill()` via `useReadContract`. Returns `undefined` for inactive wills. |
| `useCreateWill()` | `hooks/useWillActions.ts` | Wraps `createWill(beneficiaries, shares, interval)` with pending/confirming/confirmed state. |
| `useImAlive()` | `hooks/useWillActions.ts` | Wraps `imAlive()` check-in transaction. |
| `useDeposit()` | `hooks/useWillActions.ts` | Wraps `deposit()` payable call. |
| `useCancelWill()` | `hooks/useWillActions.ts` | Wraps `cancelWill()` with confirmation dialog guard in the UI. |
| `useCountdown(deadline, interval)` | `hooks/useCountdown.ts` | Returns live `secondsLeft` (ticks every second) and `CountdownState`. |
| `useReactivity()` | `hooks/useReactivity.ts` | Watches 6 contract events in parallel via `useWatchContractEvent` and maintains an in-memory event log (last 20 events). |

#### `useReactivity` — Watched Events

| Contract | Event | Displayed As |
|---|---|---|
| `CheckInRegistry` | `CheckedIn` | "Checked in" |
| `CheckInRegistry` | `WillCreated` | "Will created" |
| `CheckInRegistry` | `WillCancelled` | "Will cancelled" |
| `CheckInRegistry` | `Deposited` | "Deposited" |
| `WillExecutor` | `DeadlineReset` | "Deadline reset" |
| `WillExecutor` | `WillExecuted` | "Will executed 💀" |

---

## Repository Structure

```
ReWill/
├── README.md                        ← You are here
│
├── smartcontracts/                  ← Hardhat project
│   ├── contracts/
│   │   ├── CheckInRegistry.sol      ← Core state machine & escrow
│   │   ├── WillExecutor.sol         ← Automation engine (cron + event handler)
│   │   ├── SomniaEventHandler.sol   ← Abstract base for Reactivity interface
│   │   └── interfaces/
│   │       └── ISomniaEventHandler.sol
│   ├── scripts/
│   │   └── setup-subscribtion.ts    ← Registers Reactivity subscriptions on-chain
│   ├── hardhat.config.ts
│   ├── package.json
│   └── .env                         ← PRIVATE_KEY, SOMNIA_RPC_URL, addresses
│
└── web/                             ← Next.js 16 frontend
    ├── app/
    │   ├── page.tsx
    │   ├── layout.tsx
    │   ├── globals.css
    │   └── providers.tsx
    ├── components/
    │   ├── ui/                      ← shadcn primitive components
    │   ├── WillCreator.tsx
    │   ├── Dashboard.tsx
    │   ├── CountdownPanel.tsx
    │   ├── CheckInButton.tsx
    │   ├── WillSummaryCard.tsx
    │   ├── BeneficiaryList.tsx
    │   ├── ActivityFeed.tsx
    │   ├── LandingSection.tsx
    │   └── Navbar.tsx
    ├── hooks/
    │   ├── useWill.ts
    │   ├── useWillActions.ts
    │   ├── useCountdown.ts
    │   └── useReactivity.ts
    ├── lib/
    │   ├── abi.ts                   ← CheckInRegistry + WillExecutor ABIs
    │   ├── somnia.ts                ← Chain definition + contract addresses
    │   └── utils.ts                 ← formatEth, formatInterval, formatBps, etc.
    ├── types/
    │   └── index.ts                 ← Will, ReactivityEvent, CountdownState types
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js ≥ 20
- A wallet with Somnia Testnet STT (get from the [Somnia faucet](https://testnet.somnia.network))
- At least **32 STT** in the deployer wallet before registering Reactivity subscriptions

### Smart Contract Deployment

```bash
cd smartcontracts
npm install

# Copy and fill in your environment variables
cp .env.example .env
# Set: PRIVATE_KEY, SOMNIA_RPC_URL
```

Deploy to Somnia Testnet:

```bash
npx hardhat run scripts/deploy.ts --network somniaTestnet
```

> After deployment, note the `CheckInRegistry` and `WillExecutor` addresses — you'll need them for the next step and for the frontend environment.

### Setting Up Somnia Reactivity Subscriptions

This step registers the two on-chain subscriptions that make the protocol autonomous. It must be run **once** after deployment. Ensure your deployer wallet has ≥ 32 STT.

```bash
cd smartcontracts

# Add to .env:
# REGISTRY_ADDRESS=0x...
# EXECUTOR_ADDRESS=0x...

npx ts-node scripts/setup-subscribtion.ts
```

This registers:
1. **Event subscription** — `CheckedIn` on `CheckInRegistry` → `WillExecutor.onCheckin()`
2. **Cron subscription** — every 600 blocks → `WillExecutor.onCron()`

Both are set with `isGuaranteed: true`, meaning Somnia guarantees delivery even under network congestion.

### Running the Frontend

```bash
cd web
npm install

# Copy and fill in your environment variables
cp .env.local.example .env.local
# Set: NEXT_PUBLIC_REGISTRY_ADDRESS, NEXT_PUBLIC_EXECUTOR_ADDRESS

npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

To build for production:

```bash
npm run build
npm start
```

---

## Environment Variables

### `smartcontracts/.env`

| Variable | Description |
|---|---|
| `PRIVATE_KEY` | Deployer wallet private key (with `0x` prefix) |
| `SOMNIA_RPC_URL` | Somnia RPC endpoint (default: `https://dream-rpc.somnia.network`) |
| `REGISTRY_ADDRESS` | Deployed `CheckInRegistry` address (set after deploy) |
| `EXECUTOR_ADDRESS` | Deployed `WillExecutor` address (set after deploy) |

### `web/.env.local`

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_REGISTRY_ADDRESS` | `CheckInRegistry` contract address |
| `NEXT_PUBLIC_EXECUTOR_ADDRESS` | `WillExecutor` contract address |

> If these variables are not set, the frontend falls back to the hardcoded testnet addresses in `web/lib/somnia.ts`.

---

## Deployed Contracts (Somnia Testnet)

| Contract | Address |
|---|---|
| `CheckInRegistry` | [`0x7D7610C62D006e17779146F7C36cb1B3715A0DAb`](https://shannon-explorer.somnia.network/address/0x7D7610C62D006e17779146F7C36cb1B3715A0DAb) |
| `WillExecutor` | [`0x1Eb0467816CdAB46E8c3f9C159F6D4615fA05cF7`](https://shannon-explorer.somnia.network/address/0x1Eb0467816CdAB46E8c3f9C159F6D4615fA05cF7) |

- **Explorer:** [Shannon Explorer](https://shannon-explorer.somnia.network)
- **RPC:** `https://dream-rpc.somnia.network`
- **Chain ID:** `50312`
- **Native token:** STT

---

## Key Flows

### Creating a Will

```
User                    Frontend               CheckInRegistry
 │                          │                       │
 ├─ Fill form (beneficiaries, shares, interval) ──► │
 │                          ├─ validate() ──────────┤
 │                          ├─ createWill(args) ─────►│
 │                          │                       ├─ validate shares == 10,000 bps
 │                          │                       ├─ validate interval >= minInterval
 │                          │                       ├─ store Will struct
 │                          │                       ├─ deadline = now + interval
 │                          │                       └─► emit WillCreated(owner, interval)
 │  ◄── "Will created 🎉" ──┤                       │
 │                          ├─ poll getWill() ───────►│
 │  ◄── Dashboard ──────────┤                       │
```

### Checking In

```
User           Frontend         CheckInRegistry      WillExecutor     Reactivity
 │                 │                  │                   │               │
 ├─ Click ─────────►│                  │                   │               │
 │                 ├─ imAlive() ───────►│                   │               │
 │                 │                  ├─ deadline = now + interval         │
 │                 │                  └─► emit CheckedIn(owner, deadline)  │
 │                 │                  │                   │               │
 │                 │                  │          ◄─ Event Sub fires ───────┤
 │                 │                  │                   ├─ onCheckin()   │
 │                 │                  │                   └─► emit DeadlineReset
 │                 │                  │                   │               │
 │  ◄─ Countdown resets ──────────────┤                   │               │
```

### Automatic Will Execution

```
                        Somnia Reactivity        WillExecutor      CheckInRegistry    Beneficiaries
                               │                      │                  │                  │
Every ~600 blocks:             │                      │                  │                  │
                               ├─ onCron() ───────────►│                  │                  │
                               │                      ├─ getActiveOwners()►│                  │
                               │                      │◄── [addr1, addr2] ─┤                  │
                               │                      │                  │                  │
                               │                      ├─ getWill(addr1) ──►│                  │
                               │                      │◄── will{deadline, balance, ...}       │
                               │                      │                  │                  │
                               │                   if (now > deadline && balance > 0):        │
                               │                      ├─ markExecuted(addr1)►│                │
                               │                      │◄── distributedAmount ─┤                │
                               │                      │                  │                  │
                               │                      ├─ transfer (amount * share / 10000) ──►│
                               │                      └─► emit WillExecuted(addr1, amount)    │
```

---

## Security Considerations

| Concern | Mitigation |
|---|---|
| **Unauthorized execution** | `markExecuted()` is `onlyExecutor` — only `WillExecutor` can call it |
| **Unauthorized cron/event** | `onCheckin()` and `onCron()` are `onlyPrecompile` — only the Somnia Reactivity precompile at `0x...0100` can call them |
| **Reentrancy on distribution** | Balance is zeroed in `markExecuted()` before any ETH is transferred (checks-effects-interactions) |
| **Reentrancy on cancel** | Same pattern — `balance = 0; active = false;` before the refund transfer |
| **Integer overflow** | Solidity `^0.8.20` has built-in overflow protection |
| **Dust locking** | Rounding remainder always sent to the last beneficiary, so no STT is locked |
| **Too many active wills** | Capped at 50 on testnet to bound cron gas usage (`TooManyActiveWills` error) |
| **Executor address freeze** | `setExecutor()` is a one-time call — once set, the executor address cannot be changed |

---

*Built on [Somnia](https://somnia.network) · Powered by Somnia Reactivity*
