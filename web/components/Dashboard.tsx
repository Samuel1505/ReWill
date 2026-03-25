"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { CountdownPanel } from "@/components/CountdownPanel";
import { CheckInButton } from "@/components/CheckInButton";
import { WillSummaryCard } from "@/components/WillSummaryCard";
import { BeneficiaryList } from "@/components/BeneficiaryList";
import { ActivityFeed } from "@/components/ActivityFeed";
import { useCountdown } from "@/hooks/useCountdown";
import { useReactivity } from "@/hooks/useReactivity";
import type { Will } from "@/types";

interface DashboardProps {
  will: Will;
  onRefetch: () => void;
}

export function Dashboard({ will, onRefetch }: DashboardProps) {
  const { secondsLeft, state } = useCountdown(will.deadline, will.interval);
  const { events } = useReactivity();

  return (
    <div className="mx-auto max-w-7xl px-6 pb-12 pt-24">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Will Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your active on-chain will · Powered by Somnia Reactivity
        </p>
      </div>

      {/* Bento grid layout */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Countdown — full width */}
        <div className="lg:col-span-3">
          <CountdownPanel
            secondsLeft={secondsLeft}
            state={state}
            interval={will.interval}
          />
        </div>

        {/* Left column: Check-In + Will Summary */}
        <div className="flex flex-col gap-4 lg:col-span-1">
          {/* Check-in card */}
          <Card className="border-border/50 bg-card">
            <CardContent className="pt-6">
              <div className="mb-4">
                <p className="text-base font-semibold text-foreground">
                  Check In
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Reset your deadline before it expires
                </p>
              </div>
              <CheckInButton
                countdownState={state}
                onSuccess={onRefetch}
              />
            </CardContent>
          </Card>

          {/* Will Summary */}
          <WillSummaryCard will={will} onRefetch={onRefetch} />
        </div>

        {/* Right column: Beneficiaries */}
        <div className="lg:col-span-2">
          <BeneficiaryList will={will} />
        </div>

        {/* Activity Feed — full width */}
        <div className="lg:col-span-3">
          <ActivityFeed events={events} />
        </div>
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-7xl px-6 pb-12 pt-24">
      <div className="mb-6">
        <Skeleton className="h-7 w-48 bg-muted/50" />
        <Skeleton className="mt-1 h-4 w-72 bg-muted/50" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-3">
          <Skeleton className="h-48 w-full rounded-2xl bg-muted/50" />
        </div>
        <Skeleton className="h-80 w-full rounded-2xl bg-muted/50 lg:col-span-1" />
        <Skeleton className="h-80 w-full rounded-2xl bg-muted/50 lg:col-span-2" />
        <Skeleton className="h-64 w-full rounded-2xl bg-muted/50 lg:col-span-3" />
      </div>
    </div>
  );
}
