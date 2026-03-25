"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Wallet,
  Clock,
  Plus,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { formatEth, formatInterval } from "@/lib/utils";
import { useDeposit, useCancelWill } from "@/hooks/useWillActions";
import { toast } from "sonner";
import type { Will } from "@/types";

interface WillSummaryCardProps {
  will: Will;
  onRefetch?: () => void;
}

export function WillSummaryCard({ will, onRefetch }: WillSummaryCardProps) {
  const [depositAmount, setDepositAmount] = useState("");

  const {
    deposit,
    isPending: depositPending,
    isConfirming: depositConfirming,
    isConfirmed: depositConfirmed,
    error: depositError,
  } = useDeposit();

  const {
    cancelWill,
    isPending: cancelPending,
    isConfirming: cancelConfirming,
    isConfirmed: cancelConfirmed,
    error: cancelError,
  } = useCancelWill();

  // React to deposit confirmation
  useEffect(() => {
    if (depositConfirmed) {
      setDepositAmount("");
      toast.success("Deposit successful!");
      onRefetch?.();
    }
  }, [depositConfirmed, onRefetch]);

  // React to deposit error
  useEffect(() => {
    if (depositError) {
      toast.error("Deposit failed", {
        description: depositError.message?.slice(0, 80),
      });
    }
  }, [depositError]);

  // React to cancel confirmation
  useEffect(() => {
    if (cancelConfirmed) {
      toast.success("Will cancelled. Funds refunded.");
      onRefetch?.();
    }
  }, [cancelConfirmed, onRefetch]);

  // React to cancel error
  useEffect(() => {
    if (cancelError) {
      toast.error("Cancel failed", {
        description: cancelError.message?.slice(0, 80),
      });
    }
  }, [cancelError]);

  const handleDeposit = () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      toast.error("Enter a valid deposit amount");
      return;
    }
    deposit(depositAmount);
  };

  const handleCancel = () => {
    cancelWill();
  };

  const deadline = new Date(Number(will.deadline) * 1000);
  const isDepositLoading = depositPending || depositConfirming;
  const isCancelLoading = cancelPending || cancelConfirming;

  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          Will Summary
          <Badge
            variant="outline"
            className="border-success/30 bg-success/10 text-success"
          >
            Active
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Wallet className="h-3.5 w-3.5" />
              <span className="label-xs">Balance</span>
            </div>
            <p className="mono-num mt-1 text-lg font-bold text-foreground">
              {formatEth(will.balance)}
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span className="label-xs">Interval</span>
            </div>
            <p className="mt-1 text-lg font-bold text-foreground">
              {formatInterval(will.interval)}
            </p>
          </div>
        </div>

        {/* Deadline */}
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="label-xs mb-1">Next Deadline</p>
          <p className="mono-num text-sm text-foreground">
            {deadline.toLocaleString()}
          </p>
        </div>

        {/* Deposit */}
        <div className="flex flex-col gap-2">
          <p className="label-xs">Top Up Deposit</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type="number"
                placeholder="0.0"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                min="0"
                step="0.001"
                className="border-border bg-muted/50 pr-12"
                disabled={isDepositLoading}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                STT
              </span>
            </div>
            <Button
              onClick={handleDeposit}
              disabled={isDepositLoading || !depositAmount}
              variant="outline"
              size="default"
              className="border-primary/30 text-primary hover:bg-primary/10"
            >
              {isDepositLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Cancel Will */}
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full border-destructive/30 text-destructive hover:bg-destructive/10"
              disabled={isCancelLoading}
            >
              {isCancelLoading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <AlertTriangle className="mr-2 h-4 w-4" />
              )}
              Cancel Will &amp; Withdraw
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="border-border bg-card">
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel this will?</AlertDialogTitle>
              <AlertDialogDescription>
                This will deactivate your will and refund your full balance of{" "}
                <strong>{formatEth(will.balance)}</strong> to your wallet. This
                cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="border-border">
                Keep Will
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleCancel}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Cancel Will
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
