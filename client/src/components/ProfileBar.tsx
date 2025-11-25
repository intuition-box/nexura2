import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Trophy, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

interface ProfileBarProps {
  userId?: string;
}

import { useAuth } from "@/lib/auth";
import { useWallet } from "@/hooks/use-wallet";
import SignUpPopup from "@/components/SignUpPopup";

export default function ProfileBar({ userId = "user-123" }: ProfileBarProps) {
  const { address, isConnected: walletConnected, connectWallet, disconnect } = useWallet();
  const { user, signOut } = useAuth();
  const connected = Boolean(user) || walletConnected;

  // Use authenticated server user when available. If there's only a connected wallet
  // (no authenticated session), show minimal wallet info and do NOT surface XP/level.
  // Display name should only come from the server profile. Do not show
  // wallet-derived usernames in profile areas.
  const displayName = user?.username ?? null;

  const hasServerProfile = Boolean(user);
  const currentLevel = hasServerProfile ? (user.level ?? 1) : 1;

  // Level badge component (compact for header)
  const LevelBadge = () => (
    <Link href="/profile">
      <div className="flex items-center gap-2 cursor-pointer glass glass-hover p-2 px-4 rounded-full transition-all">
        <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <span className="text-white text-sm font-bold">{currentLevel}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-xs text-white/50 font-medium">Level</span>
          <span className="text-sm font-bold text-white">{currentLevel}</span>
        </div>
      </div>
    </Link>
  );

  const [location, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogout = () => {
    // clear server session
    signOut();
    // clear local wallet storage and disconnect injected provider if available
    try {
      localStorage.removeItem("nexura:wallet");
    } catch (e) {
      /* ignore */
    }
    try {
      disconnect?.();
    } catch (e) {
      /* ignore */
    }
    // Clients should clear any local session storage. The server no longer
    // sets auth cookies; authentication is bearer-token based (localStorage).
    // SPA navigate to root and show toast
    setLocation("/");
    toast({ title: "Signed out", description: "Your session was cleared." });
  };

  const showLevelInHeader = hasServerProfile || walletConnected;

  // Add network to wallet
  const handleAddNetwork = async () => {
    if (!window.ethereum) {
      toast({
        title: "Wallet not found",
        description: "Please install MetaMask or another Web3 wallet",
        variant: "destructive"
      });
      return;
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: '0x350b', // 13579 in hex
          chainName: 'Intuition Testnet',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: ['https://testnet.rpc.intuition.systems'],
          blockExplorerUrls: ['https://testnet.explorer.intuition.systems']
        }]
      });
      
      toast({
        title: "Network added!",
        description: "Intuition Testnet has been added to your wallet"
      });
    } catch (error: any) {
      console.error('Failed to add network:', error);
      
      // User rejected the request
      if (error.code === 4001) {
        toast({
          title: "Request cancelled",
          description: "You cancelled the network addition",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Failed to add network",
          description: error.message || "Please try again",
          variant: "destructive"
        });
      }
    }
  };

  // Network info - Intuition testnet
  const NetworkBadge = () => (
    <button
      onClick={handleAddNetwork}
      className="flex items-center gap-2 glass glass-hover px-4 py-2 rounded-full transition-all cursor-pointer"
      title="Add Intuition Testnet to wallet"
    >
      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
      <span className="text-sm font-medium text-white">Intuition Testnet</span>
    </button>
  );

  return (
    <div className="flex items-center gap-4">
      {/* Show network badge when wallet is connected */}
      {walletConnected && <NetworkBadge />}
      
      {/* Show level badge in header when we have either a server profile or a connected wallet */}
      {showLevelInHeader && <LevelBadge />}

      {hasServerProfile ? (
        <>
          {/* Profile Dropdown - only for server-backed profiles */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="relative">
                <Button variant="ghost" className="relative h-16 w-16 rounded-full p-0" data-testid="profile-dropdown">
                  <Avatar className="h-16 w-16 border-2 border-border">
                    <AvatarImage src={user.avatar ?? ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                    <div className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full z-0"></div>
                  </Avatar>
                </Button>
                <div className="absolute top-1 right-1 bg-background/90 border border-border rounded px-1.5 py-0.5 text-xs font-bold text-foreground z-10" data-testid="text-level">
                  Lv{user.level}
                </div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 p-2 glass rounded-3xl border-white/10" align="end" data-testid="profile-dropdown-menu">
                <DropdownMenuItem className="cursor-default p-3 text-base text-white">
                  <span>{address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'No wallet connected'}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="w-full cursor-pointer p-3 text-base">
                  <User className="mr-3 h-5 w-5" />
                  <span>My Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/achievements" className="w-full cursor-pointer p-3 text-base">
                  <Trophy className="mr-3 h-5 w-5" />
                  <span>Achievements</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="cursor-pointer p-3 text-base">
                <LogOut className="mr-3 h-5 w-5" />
                <span>Log Out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : walletConnected ? (
        // Wallet-only connected: show a small dropdown with Profile and Log Out
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="px-3 py-2">
              {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : "Profile"}
            </Button>
          </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 p-2 glass rounded-3xl border-white/10">
            <DropdownMenuItem className="cursor-default p-2 text-base text-white">
              <span>{address ? `${address.slice(0,6)}...${address.slice(-4)}` : 'No wallet connected'}</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/profile" className="w-full cursor-pointer p-2 text-base">
                <User className="mr-3 h-4 w-4" />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer p-2 text-base">
              <LogOut className="mr-3 h-4 w-4" />
              <span>Log Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <SignUpPopup mode="user" />
      )}
    </div>
  );
}