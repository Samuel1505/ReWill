"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { Shield, Zap, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const features = [
  {
    icon: Shield,
    title: "Trustless",
    desc: "No keeper, no backend, no human in the loop.",
  },
  {
    icon: Zap,
    title: "Reactive",
    desc: "Somnia Reactivity executes distributions on-chain automatically.",
  },
  {
    icon: Clock,
    title: "Dead Man's Switch",
    desc: "Miss your check-in deadline, assets go to beneficiaries.",
  },
  {
    icon: Users,
    title: "Multi-Beneficiary",
    desc: "Split assets across up to 10 beneficiaries with custom percentages.",
  },
];

export function LandingSection() {
  return (
    <div className="grid-bg flex min-h-screen flex-col items-center justify-center px-6 pb-20 pt-28">
      {/* Glow orb background */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <div className="h-[500px] w-[500px] rounded-full bg-primary/5 blur-[120px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center gap-8 text-center">
        {/* Badge */}
        <Badge
          variant="outline"
          className="border-primary/30 bg-primary/10 text-primary"
        >
          <Zap className="mr-1.5 h-3 w-3" />
          Powered by Somnia Reactivity
        </Badge>

        {/* Hero */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/30 bg-primary/10 glow-primary">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="max-w-2xl text-5xl font-bold tracking-tight text-foreground">
            Your assets.{" "}
            <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Distributed automatically.
            </span>{" "}
            No middleman.
          </h1>
          <p className="max-w-xl text-lg text-muted-foreground">
            ReactiveWill is a fully trustless inheritance protocol built on Somnia.
            Deposit ETH, name beneficiaries, check in periodically — or your
            assets are automatically distributed on-chain with zero external
            dependencies.
          </p>
        </div>

        {/* CTA */}
        <div className="flex flex-col items-center gap-3">
          <ConnectButton label="Connect Wallet to Get Started" />
          <p className="text-xs text-muted-foreground">
            Connect your wallet to create a will or view your dashboard
          </p>
        </div>

        {/* Feature pills */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="glass-card flex flex-col items-center gap-2 rounded-xl p-4 text-center"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground">
                {f.title}
              </span>
              <span className="text-xs text-muted-foreground">{f.desc}</span>
            </div>
          ))}
        </div>

        {/* Architecture note */}
        <div className="mt-2 max-w-lg rounded-xl border border-accent/20 bg-accent/5 p-4 text-left">
          <p className="label-xs mb-2 text-accent">Why Reactivity is the Core</p>
          <p className="text-xs text-muted-foreground">
            Unlike keeper-based protocols (Gelato, Chainlink), ReactiveWill uses
            Somnia&apos;s on-chain cron and event subscriptions. The chain itself
            invokes the executor — no external bot, no single point of failure.
          </p>
        </div>
      </div>
    </div>
  );
}
