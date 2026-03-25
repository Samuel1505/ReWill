"use client";

import { useState, useEffect } from "react";
import { isAddress } from "viem";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  Trash2,
  Shield,
  Clock,
  Wallet,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCreateWill } from "@/hooks/useWillActions";
import { getExplorerTxUrl } from "@/lib/somnia";
import { toast } from "sonner";
import type { BeneficiaryRow, IntervalPreset } from "@/types";

interface WillCreatorProps {
  onSuccess?: () => void;
}

const INTERVAL_PRESETS: { label: string; value: IntervalPreset; seconds: number }[] = [
  { label: "7 Days", value: "7d", seconds: 7 * 86400 },
  { label: "30 Days", value: "30d", seconds: 30 * 86400 },
  { label: "90 Days", value: "90d", seconds: 90 * 86400 },
  { label: "Custom", value: "custom", seconds: 0 },
];

// Minimum 1 hour for testnet
const MIN_INTERVAL_SECONDS = 3600;

const emptyRow = (): BeneficiaryRow => ({ address: "", bps: "" });

export function WillCreator({ onSuccess }: WillCreatorProps) {
  const [rows, setRows] = useState<BeneficiaryRow[]>([emptyRow()]);
  const [selectedPreset, setSelectedPreset] = useState<IntervalPreset>("30d");
  const [customDays, setCustomDays] = useState("");
  const [initialDeposit, setInitialDeposit] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createWill, hash, isPending, isConfirming, isConfirmed, error } =
    useCreateWill();

  useEffect(() => {
    if (isConfirmed && hash) {
      toast.success("Will created successfully! 🎉", {
        description: "Your on-chain will is now active.",
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
      toast.error("Failed to create will", {
        description: error.message?.slice(0, 100),
      });
    }
  }, [error]);

  // Computed values
  const totalBps = rows.reduce((sum, r) => {
    const v = parseInt(r.bps);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);
  const sharesValid = totalBps === 10000;

  const getIntervalSeconds = (): number => {
    if (selectedPreset === "custom") {
      const days = parseFloat(customDays);
      return isNaN(days) ? 0 : Math.floor(days * 86400);
    }
    return INTERVAL_PRESETS.find((p) => p.value === selectedPreset)?.seconds ?? 0;
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (rows.length === 0) {
      newErrors.beneficiaries = "At least one beneficiary required";
    }

    rows.forEach((row, i) => {
      if (!row.address) {
        newErrors[`addr_${i}`] = "Address required";
      } else if (!isAddress(row.address)) {
        newErrors[`addr_${i}`] = "Invalid address";
      }
      if (!row.bps) {
        newErrors[`bps_${i}`] = "Share required";
      } else {
        const v = parseInt(row.bps);
        if (isNaN(v) || v <= 0) {
          newErrors[`bps_${i}`] = "Must be > 0";
        }
      }
    });

    if (!sharesValid) {
      newErrors.shares = `Shares sum to ${totalBps} bps — must equal 10,000 (100%)`;
    }

    const intervalSec = getIntervalSeconds();
    if (intervalSec < MIN_INTERVAL_SECONDS) {
      newErrors.interval = "Minimum interval is 1 hour";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;

    const beneficiaries = rows.map((r) => r.address as `0x${string}`);
    const shares = rows.map((r) => BigInt(r.bps));
    const interval = BigInt(getIntervalSeconds());

    createWill(beneficiaries, shares, interval, initialDeposit);
  };

  const addRow = () => {
    if (rows.length < 10) setRows((r) => [...r, emptyRow()]);
  };

  const removeRow = (i: number) => {
    setRows((r) => r.filter((_, idx) => idx !== i));
  };

  const updateRow = (i: number, field: keyof BeneficiaryRow, value: string) => {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  };

  const isLoading = isPending || isConfirming;
  const remainingBps = 10000 - totalBps;

  return (
    <div className="grid-bg min-h-screen pt-24 pb-12 px-6">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-2">
          <Badge
            variant="outline"
            className="w-fit border-primary/30 bg-primary/10 text-primary"
          >
            <Shield className="mr-1.5 h-3 w-3" />
            Create New Will
          </Badge>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Set Up Your On-Chain Will
          </h1>
          <p className="text-muted-foreground">
            Name your beneficiaries, set a check-in interval, and optionally
            deposit ETH. Your assets will be distributed automatically if you
            stop checking in.
          </p>
        </div>

        <div className="flex flex-col gap-6">
          {/* Beneficiaries */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  1
                </div>
                Beneficiaries
              </CardTitle>
              <CardDescription>
                Add up to 10 beneficiaries. Shares must total exactly 10,000
                basis points (100%).
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {/* Column headers */}
              <div className="grid grid-cols-[1fr_120px_40px] gap-2 px-1">
                <span className="label-xs">Address</span>
                <span className="label-xs text-center">Basis Points</span>
                <span />
              </div>

              {rows.map((row, i) => (
                <div key={i} className="grid grid-cols-[1fr_120px_40px] gap-2">
                  <div className="flex flex-col gap-1">
                    <Input
                      placeholder="0x..."
                      value={row.address}
                      onChange={(e) => updateRow(i, "address", e.target.value)}
                      className={cn(
                        "border-border bg-muted/50 font-mono text-sm",
                        errors[`addr_${i}`] && "border-destructive"
                      )}
                    />
                    {errors[`addr_${i}`] && (
                      <span className="text-xs text-destructive">
                        {errors[`addr_${i}`]}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Input
                      type="number"
                      placeholder="e.g. 5000"
                      value={row.bps}
                      onChange={(e) => updateRow(i, "bps", e.target.value)}
                      min="1"
                      max="10000"
                      className={cn(
                        "border-border bg-muted/50 text-center",
                        errors[`bps_${i}`] && "border-destructive"
                      )}
                    />
                    {row.bps && !isNaN(parseInt(row.bps)) && (
                      <span className="text-center text-xs text-muted-foreground">
                        {(parseInt(row.bps) / 100).toFixed(2)}%
                      </span>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeRow(i)}
                    disabled={rows.length === 1}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}

              {/* Share total */}
              <div
                className={cn(
                  "flex items-center justify-between rounded-lg p-3",
                  sharesValid
                    ? "bg-success/10 text-success"
                    : totalBps > 10000
                    ? "bg-destructive/10 text-destructive"
                    : "bg-muted/50 text-muted-foreground"
                )}
              >
                <span className="text-sm font-medium">
                  Total:{" "}
                  <span className="mono-num font-bold">
                    {(totalBps / 100).toFixed(2)}%
                  </span>
                  <span className="ml-1 text-xs">({totalBps} / 10,000 bps)</span>
                </span>
                {sharesValid ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-xs">
                    {remainingBps > 0
                      ? `${remainingBps} bps remaining`
                      : `${-remainingBps} bps over`}
                  </span>
                )}
              </div>

              {errors.shares && (
                <div className="flex items-center gap-1.5 text-xs text-destructive">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {errors.shares}
                </div>
              )}

              <Button
                variant="outline"
                onClick={addRow}
                disabled={rows.length >= 10}
                className="border-dashed border-border/50 text-muted-foreground"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Beneficiary
                {rows.length >= 10 && " (max 10)"}
              </Button>
            </CardContent>
          </Card>

          {/* Check-In Interval */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  2
                </div>
                Check-In Interval
              </CardTitle>
              <CardDescription>
                How often you need to check in. Miss this deadline and your
                will executes.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="grid grid-cols-4 gap-2">
                {INTERVAL_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    variant={
                      selectedPreset === preset.value ? "default" : "outline"
                    }
                    onClick={() => setSelectedPreset(preset.value)}
                    className={cn(
                      "border-border/50",
                      selectedPreset === preset.value &&
                        "border-primary bg-primary text-white"
                    )}
                  >
                    <Clock
                      className={cn(
                        "mr-1 h-3.5 w-3.5",
                        selectedPreset === preset.value
                          ? "text-white"
                          : "text-muted-foreground"
                      )}
                    />
                    {preset.label}
                  </Button>
                ))}
              </div>

              {selectedPreset === "custom" && (
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm text-muted-foreground">
                    Custom interval (days)
                  </Label>
                  <div className="relative">
                    <Input
                      type="number"
                      placeholder="e.g. 14"
                      value={customDays}
                      onChange={(e) => setCustomDays(e.target.value)}
                      min="0.042"
                      step="1"
                      className={cn(
                        "border-border bg-muted/50 pr-14",
                        errors.interval && "border-destructive"
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      days
                    </span>
                  </div>
                  {errors.interval && (
                    <span className="text-xs text-destructive">
                      {errors.interval}
                    </span>
                  )}
                </div>
              )}

              <div className="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">
                <p>
                  <strong className="text-foreground">Interval:</strong>{" "}
                  {getIntervalSeconds() >= 86400
                    ? `${Math.floor(getIntervalSeconds() / 86400)} days`
                    : getIntervalSeconds() >= 3600
                    ? `${Math.floor(getIntervalSeconds() / 3600)} hours`
                    : `${getIntervalSeconds()} seconds`}{" "}
                  ({getIntervalSeconds().toLocaleString()} seconds)
                </p>
                <p className="mt-1 text-muted-foreground/60">
                  Minimum: 1 hour on testnet
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Initial Deposit */}
          <Card className="border-border/50 bg-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/20 text-xs font-bold text-primary">
                  3
                </div>
                Initial Deposit{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  (optional)
                </span>
              </CardTitle>
              <CardDescription>
                You can deposit ETH now or top up later. A zero deposit creates
                the will without locking funds yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Wallet className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="number"
                  placeholder="0.0"
                  value={initialDeposit}
                  onChange={(e) => setInitialDeposit(e.target.value)}
                  min="0"
                  step="0.001"
                  className="border-border bg-muted/50 pl-10 pr-14"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                  STT
                </span>
              </div>
            </CardContent>
          </Card>

          <Separator className="bg-border/30" />

          {/* Submit */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading}
            size="lg"
            className="h-14 w-full gap-2 text-base font-semibold bg-primary"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {isConfirming ? "Confirming on-chain..." : "Sending transaction..."}
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                Create Will
              </>
            )}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            This will deploy your will to the Somnia testnet. Make sure you have
            enough STT for gas fees.
          </p>
        </div>
      </div>
    </div>
  );
}
