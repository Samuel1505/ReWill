"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Shield } from "lucide-react";

export function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-foreground">
              ReactiveWill
            </span>
            <span className="ml-1 hidden text-xs text-muted-foreground sm:inline">
              · Trustless Inheritance
            </span>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-4">
          <div className="hidden items-center gap-1 rounded-full border border-success/30 bg-success/10 px-3 py-1 sm:flex">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success" />
            <span className="text-xs text-success">Somnia Testnet</span>
          </div>
          <ConnectButton
            showBalance={false}
            chainStatus="icon"
            accountStatus="avatar"
          />
        </div>
      </div>
    </nav>
  );
}
