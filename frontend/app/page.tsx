"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseEther, formatEther } from "viem";
import { useState, useEffect } from "react";
import { BREW_TOKEN_ADDRESS, BREW_TOKEN_ABI } from "./abi";

const TIER_STYLES: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  Gold:   { label: "Gold",   color: "text-yellow-400", bg: "bg-yellow-400/10 border-yellow-400/30", emoji: "🥇" },
  Silver: { label: "Silver", color: "text-slate-300",  bg: "bg-slate-300/10 border-slate-300/30",   emoji: "🥈" },
  Bronze: { label: "Bronze", color: "text-amber-600",  bg: "bg-amber-600/10 border-amber-600/30",   emoji: "🥉" },
};

function TierBadge({ tier }: { tier: string }) {
  const s = TIER_STYLES[tier] ?? TIER_STYLES.Bronze;
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-sm font-semibold ${s.color} ${s.bg}`}>
      {s.emoji} {s.label}
    </span>
  );
}

function ProgressBar({ balance, silverThreshold, goldThreshold }: {
  balance: bigint; silverThreshold: bigint; goldThreshold: bigint;
}) {
  const bal = Number(formatEther(balance));
  const silver = Number(formatEther(silverThreshold));
  const gold = Number(formatEther(goldThreshold));

  if (bal >= gold) {
    return <div className="w-full h-2 rounded-full bg-yellow-400" />;
  }
  if (bal >= silver) {
    const pct = Math.min(((bal - silver) / (gold - silver)) * 100, 100);
    return (
      <div className="space-y-1">
        <div className="w-full h-2 rounded-full bg-white/10">
          <div className="h-2 rounded-full bg-yellow-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-white/50">{(gold - bal).toFixed(0)} BREW to Gold</p>
      </div>
    );
  }
  const pct = Math.min((bal / silver) * 100, 100);
  return (
    <div className="space-y-1">
      <div className="w-full h-2 rounded-full bg-white/10">
        <div className="h-2 rounded-full bg-slate-300 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <p className="text-xs text-white/50">{(silver - bal).toFixed(0)} BREW to Silver</p>
    </div>
  );
}

export default function Home() {
  const { address, isConnected } = useAccount();
  const [redeemCount, setRedeemCount] = useState("1");
  const [awardAddress, setAwardAddress] = useState("");
  const [awardAmount, setAwardAmount] = useState("10");
  const [txMsg, setTxMsg] = useState("");

  const { data: owner } = useReadContract({
    address: BREW_TOKEN_ADDRESS, abi: BREW_TOKEN_ABI, functionName: "owner",
  });
  const { data: balance, refetch: refetchBalance } = useReadContract({
    address: BREW_TOKEN_ADDRESS, abi: BREW_TOKEN_ABI, functionName: "balanceOf",
    args: address ? [address] : undefined, query: { enabled: !!address },
  });
  const { data: tier, refetch: refetchTier } = useReadContract({
    address: BREW_TOKEN_ADDRESS, abi: BREW_TOKEN_ABI, functionName: "getTier",
    args: address ? [address] : undefined, query: { enabled: !!address },
  });
  const { data: silverThreshold } = useReadContract({
    address: BREW_TOKEN_ADDRESS, abi: BREW_TOKEN_ABI, functionName: "SILVER_THRESHOLD",
  });
  const { data: goldThreshold } = useReadContract({
    address: BREW_TOKEN_ADDRESS, abi: BREW_TOKEN_ABI, functionName: "GOLD_THRESHOLD",
  });
  const { data: redeemCost } = useReadContract({
    address: BREW_TOKEN_ADDRESS, abi: BREW_TOKEN_ABI, functionName: "REDEEM_COST",
  });

  const { writeContract, data: txHash, isPending } = useWriteContract();
  const { isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const isOwner = address && owner && address.toLowerCase() === (owner as string).toLowerCase();

  useEffect(() => {
    if (isSuccess) {
      refetchBalance();
      refetchTier();
      setTxMsg("Transaction confirmed!");
      setTimeout(() => setTxMsg(""), 4000);
    }
  }, [isSuccess, refetchBalance, refetchTier]);

  const handleRedeem = () => {
    const count = BigInt(redeemCount || "0");
    if (count <= 0n) return;
    writeContract({
      address: BREW_TOKEN_ADDRESS, abi: BREW_TOKEN_ABI,
      functionName: "redeem", args: [count],
    });
  };

  const handleAward = () => {
    if (!awardAddress || !awardAmount) return;
    writeContract({
      address: BREW_TOKEN_ADDRESS, abi: BREW_TOKEN_ABI,
      functionName: "awardPoints",
      args: [awardAddress as `0x${string}`, parseEther(awardAmount)],
    });
  };

  const brewBalance = balance ? Number(formatEther(balance)).toFixed(2) : "0.00";
  const redeemCostPerReward = redeemCost ? Number(formatEther(redeemCost)) : 10;
  const totalCost = (Number(redeemCount) * redeemCostPerReward).toFixed(0);

  return (
    <main className="min-h-screen p-4 md:p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-amber-400">☕ BrewToken</h1>
          <p className="text-sm text-white/50">On-chain loyalty rewards · Sepolia</p>
        </div>
        <ConnectButton />
      </div>

      {!isConnected ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-12 text-center">
          <p className="text-4xl mb-4">☕</p>
          <p className="text-white/60">Connect your wallet to view your BREW balance and tier.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Stats */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-sm text-white/50 mb-1">Your BREW Balance</p>
                <p className="text-4xl font-bold text-amber-400">{brewBalance}</p>
                <p className="text-xs text-white/40 mt-1">BREW</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-white/50 mb-2">Current Tier</p>
                {tier && <TierBadge tier={tier as string} />}
              </div>
            </div>
            {balance !== undefined && silverThreshold && goldThreshold && (
              <ProgressBar balance={balance} silverThreshold={silverThreshold} goldThreshold={goldThreshold} />
            )}
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-3 gap-4 text-center text-xs text-white/50">
              <div><p className="text-white/80 font-medium">0 BREW</p><p>Bronze</p></div>
              <div><p className="text-slate-300 font-medium">{silverThreshold ? formatEther(silverThreshold) : "100"}</p><p>Silver</p></div>
              <div><p className="text-yellow-400 font-medium">{goldThreshold ? formatEther(goldThreshold) : "500"}</p><p>Gold</p></div>
            </div>
          </div>

          {/* Redeem */}
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <h2 className="font-semibold mb-4 text-amber-400">🎁 Redeem Rewards</h2>
            <p className="text-xs text-white/50 mb-4">
              Each reward costs <span className="text-white">{redeemCostPerReward} BREW</span>.
              You have <span className="text-white">{brewBalance} BREW</span>.
            </p>
            <div className="flex gap-2">
              <input
                type="number" min="1" value={redeemCount}
                onChange={(e) => setRedeemCount(e.target.value)}
                className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-400"
                placeholder="Number of rewards"
              />
              <button
                onClick={handleRedeem}
                disabled={isPending || !redeemCount}
                className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold px-6 py-2 rounded-xl transition-colors"
              >
                {isPending ? "..." : `Redeem (${totalCost} BREW)`}
              </button>
            </div>
          </div>

          {/* Owner panel */}
          {isOwner && (
            <div className="rounded-2xl border border-amber-400/30 bg-amber-400/5 p-6">
              <h2 className="font-semibold mb-4 text-amber-400">⚡ Award Points (Owner)</h2>
              <div className="space-y-2">
                <input
                  type="text" value={awardAddress}
                  onChange={(e) => setAwardAddress(e.target.value)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-400 text-sm"
                  placeholder="Customer wallet address (0x...)"
                />
                <div className="flex gap-2">
                  <input
                    type="number" min="1" value={awardAmount}
                    onChange={(e) => setAwardAmount(e.target.value)}
                    className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-amber-400"
                    placeholder="Amount of BREW"
                  />
                  <button
                    onClick={handleAward}
                    disabled={isPending || !awardAddress || !awardAmount}
                    className="bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-semibold px-6 py-2 rounded-xl transition-colors"
                  >
                    {isPending ? "..." : "Award"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Tx feedback */}
          {txMsg && (
            <div className="rounded-xl border border-green-400/30 bg-green-400/10 p-4 text-green-400 text-sm text-center">
              ✅ {txMsg}
            </div>
          )}

          {txHash && !isSuccess && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-xs text-white/50 text-center">
              Waiting for confirmation...{" "}
              <a href={`https://sepolia.etherscan.io/tx/${txHash}`} target="_blank" className="text-amber-400 underline">
                View on Etherscan
              </a>
            </div>
          )}
        </div>
      )}

      <p className="text-center text-xs text-white/20 mt-8">
        Contract:{" "}
        <a href={`https://sepolia.etherscan.io/address/${BREW_TOKEN_ADDRESS}`} target="_blank" className="underline hover:text-white/40">
          {BREW_TOKEN_ADDRESS.slice(0, 6)}...{BREW_TOKEN_ADDRESS.slice(-4)}
        </a>
      </p>
    </main>
  );
}
