"use client";

import { useState, useEffect, useCallback } from "react";
import { useAccount } from "wagmi";
import { Navbar } from "@/components/Navbar";
import { LandingSection } from "@/components/LandingSection";
import { WillCreator } from "@/components/WillCreator";
import { Dashboard, DashboardSkeleton } from "@/components/Dashboard";
import { useWill } from "@/hooks/useWill";
import type { Will } from "@/types";

export default function Home() {
  const { address, isConnected } = useAccount();
  const { will, isLoading, refetch } = useWill(address);

  // True while polling for the newly-created will to become active on-chain
  const [waitingForWill, setWaitingForWill] = useState(false);

  // Reset polling state if user disconnects
  useEffect(() => {
    if (!isConnected) setWaitingForWill(false);
  }, [isConnected]);

  // Called by WillCreator once the tx is confirmed on-chain
  const handleWillCreated = useCallback(() => {
    setWaitingForWill(true);
  }, []);

  // Poll every 1.5 s until getWill returns an active will
  useEffect(() => {
    if (!waitingForWill) return;

    const id = setInterval(async () => {
      const result = await refetch();
      const data = result.data as Will | undefined;
      if (data?.active) {
        setWaitingForWill(false);
      }
    }, 1500);

    return () => clearInterval(id);
  }, [waitingForWill, refetch]);

  const showLoading = isConnected && (isLoading || waitingForWill);
  const showDashboard = isConnected && !isLoading && !waitingForWill && !!will;
  const showCreator = isConnected && !isLoading && !waitingForWill && !will;

  return (
    <>
      <Navbar />

      {/* No wallet connected */}
      {!isConnected && <LandingSection />}

      {/* Wallet connected — initial load or polling after creation */}
      {showLoading && <DashboardSkeleton />}

      {/* Wallet connected — active will → full dashboard */}
      {showDashboard && <Dashboard will={will!} onRefetch={refetch} />}

      {/* Wallet connected — no will yet → creation form */}
      {showCreator && <WillCreator onSuccess={handleWillCreated} />}
    </>
  );
}
