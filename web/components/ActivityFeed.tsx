"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Activity, ExternalLink } from "lucide-react";
import { formatAddress, formatTimestamp, formatEth } from "@/lib/utils";
import { getExplorerTxUrl } from "@/lib/somnia";
import { cn } from "@/lib/utils";
import type { ReactivityEvent } from "@/types";

interface ActivityFeedProps {
  events: ReactivityEvent[];
}

const eventConfig: Record<
  ReactivityEvent["type"],
  { label: string; badgeClass: string; getMessage: (e: ReactivityEvent) => string }
> = {
  CheckedIn: {
    label: "Checked In",
    badgeClass: "bg-success/10 text-success border-success/30",
    getMessage: (e) =>
      `${formatAddress(e.owner)} checked in. Deadline reset.`,
  },
  DeadlineReset: {
    label: "Deadline Reset",
    badgeClass: "bg-primary/10 text-primary border-primary/30",
    getMessage: (e) => {
      const ts = e.data.newDeadline
        ? new Date(Number(e.data.newDeadline as string) * 1000).toLocaleString()
        : "–";
      return `Reactivity precompile confirmed: new deadline ${ts}`;
    },
  },
  WillExecuted: {
    label: "Will Executed",
    badgeClass: "bg-destructive/10 text-destructive border-destructive/30",
    getMessage: (e) => {
      const amt = e.data.totalDistributed
        ? formatEth(BigInt(e.data.totalDistributed as string))
        : "–";
      return `${formatAddress(e.owner)}'s will executed. ${amt} distributed.`;
    },
  },
  WillCreated: {
    label: "Will Created",
    badgeClass: "bg-accent/10 text-accent border-accent/30",
    getMessage: (e) => `${formatAddress(e.owner)} created a new will.`,
  },
  WillCancelled: {
    label: "Will Cancelled",
    badgeClass: "bg-warning/10 text-warning border-warning/30",
    getMessage: (e) => `${formatAddress(e.owner)} cancelled their will.`,
  },
  Deposited: {
    label: "Deposited",
    badgeClass: "bg-success/10 text-success border-success/30",
    getMessage: (e) => {
      const amt = e.data.amount
        ? formatEth(BigInt(e.data.amount as string))
        : "–";
      return `${formatAddress(e.owner)} deposited ${amt}.`;
    },
  },
};

interface EventItemProps {
  event: ReactivityEvent;
}

function EventItem({ event }: EventItemProps) {
  const cfg = eventConfig[event.type];

  return (
    <div className="animate-fade-in flex items-start gap-3 border-b border-border/30 py-3 last:border-0">
      <div className="mt-0.5 shrink-0">
        <Badge
          variant="outline"
          className={cn("text-xs whitespace-nowrap", cfg.badgeClass)}
        >
          {cfg.label}
        </Badge>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="text-sm text-foreground">{cfg.getMessage(event)}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Block {event.blockNumber.toString()}</span>
          <span>·</span>
          <span>{formatTimestamp(event.timestamp)}</span>
          {event.type !== "DeadlineReset" && event.type !== "WillExecuted" && (
            <>
              <span>·</span>
              <a
                href={getExplorerTxUrl(event.id.split("-")[1] || "")}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 hover:text-foreground"
              >
                <ExternalLink className="h-2.5 w-2.5" />
                Explorer
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed({ events }: ActivityFeedProps) {
  return (
    <Card className="border-border/50 bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Activity className="h-4 w-4 text-muted-foreground" />
          Activity Feed
          <span className="ml-1 flex items-center gap-1 text-xs font-normal text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            Live via Somnia Reactivity
          </span>
          {events.length > 0 && (
            <span className="ml-auto rounded-full border border-border/50 bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
              {events.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-72 px-4">
          {events.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 py-12 text-center">
              <Activity className="h-8 w-8 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">No events yet</p>
              <p className="text-xs text-muted-foreground/60">
                Events will appear here in real-time as they occur on-chain
              </p>
            </div>
          ) : (
            <div className="pb-2">
              {events.map((evt) => (
                <EventItem key={evt.id} event={evt} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
