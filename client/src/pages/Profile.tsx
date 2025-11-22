import { useMemo, memo, useState, useEffect } from "react";
import { useWallet } from "@/hooks/use-wallet";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Edit2, Calendar } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/lib/auth";
import { XP_PER_LEVEL } from "@shared/schema";
import { Progress } from "@/components/ui/progress";
import { emitSessionChange } from "@/lib/session";
import AnimatedBackground from "@/components/AnimatedBackground";

// Prefer a runtime-injected backend URL (window.__BACKEND_URL__), then Vite env var.
// Do not default to localhost here — if no backend is configured the app will
// make relative requests to the current origin.
const RUNTIME_BACKEND = (typeof window !== 'undefined' && (window as any).__BACKEND_URL__) || undefined;
const BACKEND_BASE = RUNTIME_BACKEND || ((import.meta as any).env?.VITE_BACKEND_URL as string) || "";

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const base = BACKEND_BASE.replace(/\/+$|\\s+/g, "");
  const p = path.replace(/^\/+/, "");
  return `${base}/${p}`;
}

function WalletDropdown() {
  const { isConnected, connectWallet, address, disconnect } = useWallet();
  const { signOut } = useAuth();

  if (!isConnected) {
    return (
      <Button size="sm" onClick={async () => { try { await connectWallet(); } finally { try { emitSessionChange(); } catch(e){} } }}>
        Connect Wallet
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">{address ? `${address.slice(0,6)}...${address.slice(-4)}` : "Profile"}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 p-2">
        <DropdownMenuItem asChild>
          <Link href="/profile" className="w-full cursor-pointer p-2 text-base">My Profile</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => { try { disconnect(); } catch(e){}; try { signOut(); } catch(e){}; try { emitSessionChange(); } catch(e){}; }} className="cursor-pointer p-2 text-base">
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Profile() {
  try {
    const { user, loading } = useAuth();
    const [referralCount, setReferralCount] = useState<number>(0);
    const [loadingReferrals, setLoadingReferrals] = useState(false);

    // Safety check - prevent rendering if user is not an object or is invalid
    if (user && (typeof user !== 'object' || Array.isArray(user) || user === null)) {
      console.error('[Profile] Invalid user data type:', typeof user, user);
      return (
        <div className="min-h-screen bg-background overflow-auto p-6 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Error loading profile</h2>
            <p className="text-muted-foreground mb-6">Invalid user data received. Please clear your browser cache and reload.</p>
            <Button onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = '/'; }}>Clear Cache &amp; Reload</Button>
          </div>
        </div>
      );
    }

  // Fetch referral stats when user is available
  useEffect(() => {
    if (user?.id) {
      setLoadingReferrals(true);
      fetch(buildUrl(`/api/referrals/stats/${user.id}`), { credentials: 'include' })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.totalReferrals !== undefined) {
            setReferralCount(data.totalReferrals);
          }
        })
        .catch(err => console.warn('Failed to fetch referral stats:', err))
        .finally(() => setLoadingReferrals(false));
    }
  }, [user?.id]);

  // Always show profile with safe defaults - never block on loading
  // This prevents crashes and provides a better UX
  const userData = useMemo(() => {
    if (!user) {
      return {
        id: "",
        username: "Guest",
        displayName: "Guest User",
        avatar: "",
        level: 1,
        xp: 0,
        questsCompleted: 0,
        quests_completed: 0,
        tasksCompleted: 0,
        tasks_completed: 0,
        dateJoined: "Recently",
      };
    }
    return {
      ...user,
      level: user.level ?? 1,
      xp: user.xp ?? 0,
      questsCompleted: user.questsCompleted ?? user.quests_completed ?? 0,
      tasksCompleted: user.tasksCompleted ?? user.tasks_completed ?? 0,
      displayName: user.displayName ?? user.display_name ?? user.username ?? "User",
      username: user.username ?? "user",
      dateJoined: user.dateJoined ?? user.created_at ?? "Recently",
    };
  }, [user]);

  // Use server-provided profile fields only (fall back to defaults above)
  const { levelValue, xpValue, nextLevelXp, progressXp, neededXp, progressPercentage } = useMemo(() => {
    const level = Math.max(1, Number(userData?.level) || 1);
    const xp = Math.max(0, Number(userData?.xp) || 0);
    const nextLvlXp = (level + 1) * XP_PER_LEVEL;
    const currentLvlXp = level * XP_PER_LEVEL;
    const progXp = Math.max(0, xp - currentLvlXp);
    const needXp = Math.max(0, nextLvlXp - xp);
    const progPct = XP_PER_LEVEL > 0 ? Math.min(100, (progXp / XP_PER_LEVEL) * 100) : 0;
    
    return {
      levelValue: level,
      xpValue: xp,
      nextLevelXp: nextLvlXp,
      progressXp: progXp,
      neededXp: needXp,
      progressPercentage: progPct
    };
  }, [userData]);

  return (
    <div className="min-h-screen bg-black text-white overflow-auto p-6 scale-in relative" data-testid="profile-page">
      <AnimatedBackground />
      {loading && (
        <div className="fixed top-4 right-4 z-50 bg-background/80 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            <span className="text-sm text-muted-foreground">Loading...</span>
          </div>
        </div>
      )}
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/profile/edit">
              <Button data-testid="button-edit-profile">
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </Link>

            {/* Level display */}
            <div className="hidden sm:flex items-center gap-3 glass-card p-3 float">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br from-purple-700 via-blue-600 to-cyan-500 shadow-lg">
                  <span className="text-sm font-bold text-white">{levelValue}</span>
                </div>
                <div className="text-sm">
                  <div className="text-xs text-muted-foreground">Level</div>
                  <div className="text-sm font-semibold">{levelValue}</div>
                </div>
              </div>
              <div className="pl-2 border-l border-border">
                <div className="text-xs text-muted-foreground">XP</div>
                <div className="text-sm font-semibold">{xpValue}</div>
              </div>
            </div>

            {/* Wallet connect/status dropdown */}
            <WalletDropdown />
          </div>
        </div>

        <Card className="relative overflow-hidden card-lift glow-border">
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: `linear-gradient(135deg, #5B21B6, #3B82F6, #06B6D4, #8B5CF6)`,
              backgroundSize: '400% 400%',
              animation: 'gradientShift 15s ease infinite'
            }}
          />

          <CardContent className="relative p-8">
            <div className="flex items-start space-x-6">
              <div className="relative shimmer">
                <Avatar className="w-32 h-32 border-4 border-white/20 shadow-2xl">
                  <AvatarImage src={userData?.avatar ?? ""} />
                  <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-green-500 via-blue-500 to-red-500 text-white">
                    {levelValue || 1}
                  </AvatarFallback>
                </Avatar>
                <div 
                  className="absolute -bottom-2 -right-2 w-12 h-12 rounded-full flex items-center justify-center text-white text-lg font-bold border-4 border-background bg-gradient-to-br from-purple-700 via-blue-600 to-cyan-500 shadow-xl"
                >
                  {levelValue}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">{userData?.displayName ?? userData?.username ?? "Guest"}</h2>
                  <Badge 
                    className="mt-2 text-white border-0 bg-gradient-to-r from-purple-700 via-blue-600 to-cyan-500 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                  >
                    Level {levelValue}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">XP Progress</span>
                    <span className="text-sm font-medium">{xpValue} / {nextLevelXp} XP</span>
                  </div>
                  <Progress 
                    value={progressPercentage} 
                    className="h-3 bg-gray-800/50 overflow-hidden rounded-full"
                  />
                  <div className="text-xs text-muted-foreground">
                    {neededXp} XP to next level
                  </div>
                </div>

                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  Joined {userData?.dateJoined ?? "recently"}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="glass glass-hover rounded-3xl" data-testid="stat-quests">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white">Quests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{userData?.questsCompleted ?? userData?.quests_completed ?? 0}</div>
              <p className="text-xs text-white/60 mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card className="glass glass-hover rounded-3xl" data-testid="stat-tasks">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white">Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{userData?.tasksCompleted ?? userData?.tasks_completed ?? 0}</div>
              <p className="text-xs text-white/60 mt-1">Completed</p>
            </CardContent>
          </Card>

          <Card className="glass glass-hover rounded-3xl" data-testid="stat-total-xp">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white">Total XP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{xpValue}</div>
              <p className="text-xs text-white/60 mt-1">XP earned</p>
            </CardContent>
          </Card>

          <Card className="glass glass-hover rounded-3xl" data-testid="stat-referrals">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-bold text-white">Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{loadingReferrals ? '...' : referralCount}</div>
              <p className="text-xs text-white/60 mt-1">Friends referred</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
  } catch (error) {
    console.error('[Profile] Render error:', error);
    return (
      <div className="min-h-screen bg-background overflow-auto p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profile Error</h2>
          <p className="text-muted-foreground mb-6">Something went wrong. Please clear your browser cache.</p>
          <Button onClick={() => { localStorage.clear(); sessionStorage.clear(); window.location.href = '/'; }}>Clear Cache &amp; Reload</Button>
        </div>
      </div>
    );
  }
}