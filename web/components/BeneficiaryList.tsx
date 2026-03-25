"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Users, Copy, ExternalLink } from "lucide-react";
import { formatAddress, formatBps } from "@/lib/utils";
import { getExplorerAddressUrl } from "@/lib/somnia";
import { toast } from "sonner";
import type { Will } from "@/types";

interface BeneficiaryListProps {
  will: Will;
}

export function BeneficiaryList({ will }: BeneficiaryListProps) {
  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
    toast.success("Address copied");
  };

  // Color bar generation for share visualization
  const totalBps = will.shares.reduce((a, b) => a + b, 0n);

  const colors = [
    "bg-primary",
    "bg-accent",
    "bg-success",
    "bg-warning",
    "bg-destructive",
    "bg-purple-400",
    "bg-pink-400",
    "bg-orange-400",
    "bg-teal-400",
    "bg-cyan-400",
  ];

  return (
    <TooltipProvider>
      <Card className="border-border/50 bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4 text-muted-foreground" />
            Beneficiaries
            <span className="ml-auto rounded-full border border-border/50 bg-muted/50 px-2 py-0.5 text-xs text-muted-foreground">
              {will.beneficiaries.length}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {/* Share bar */}
          <div className="flex h-2 w-full overflow-hidden rounded-full">
            {will.shares.map((share, i) => (
              <div
                key={i}
                className={colors[i % colors.length]}
                style={{
                  width: `${(Number(share) / Number(totalBps)) * 100}%`,
                }}
              />
            ))}
          </div>

          {/* Beneficiary rows */}
          <div className="flex flex-col gap-2">
            {will.beneficiaries.map((addr, i) => (
              <div
                key={addr}
                className="flex items-center justify-between rounded-lg border border-border/30 bg-muted/30 px-3 py-2.5"
              >
                <div className="flex items-center gap-2">
                  {/* Color dot */}
                  <div
                    className={`h-2.5 w-2.5 rounded-full ${colors[i % colors.length]}`}
                  />
                  <Tooltip>
                    <TooltipTrigger className="mono-num cursor-default text-sm text-foreground">
                      {formatAddress(addr)}
                    </TooltipTrigger>
                    <TooltipContent className="font-mono text-xs">
                      {addr}
                    </TooltipContent>
                  </Tooltip>
                </div>
                <div className="flex items-center gap-2">
                  <span className="mono-num text-sm font-semibold text-primary">
                    {formatBps(will.shares[i])}
                  </span>
                  <button
                    onClick={() => copyAddress(addr)}
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    title="Copy address"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <a
                    href={getExplorerAddressUrl(addr)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground transition-colors hover:text-foreground"
                    title="View on Explorer"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  );
}
