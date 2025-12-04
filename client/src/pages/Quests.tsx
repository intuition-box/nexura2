import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Clock, Trophy, Target, CheckCircle, Plus, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { emitSessionChange } from "@/lib/session";
import SignUpPopup from "@/components/SignUpPopup";
import AnimatedBackground from "@/components/AnimatedBackground";
import dailyQuestImg from "@assets/generated_images/Daily_Quest_Completion_Image_83de888a.png";
import gettingStartedImg from "@assets/generated_images/Getting_Started_Quest_Image_9a7ae50b.png";

// Prefer a runtime-injected backend URL (window.__BACKEND_URL__), then build-time Vite env var,
// otherwise fall back to localhost for developer convenience. This mirrors the logic used
// elsewhere in the app so the same bundle can work across environments when the host
// injects `window.__BACKEND_URL__`.
const RUNTIME_BACKEND = (typeof window !== 'undefined' && (window as any).__BACKEND_URL__) || undefined;
const BACKEND_BASE = RUNTIME_BACKEND || ((import.meta as any).env?.VITE_BACKEND_URL as string) || "";

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const base = (BACKEND_BASE || "").replace(/\/+$/g, "");
  const p = path.replace(/^\/+/, "");
  return `${base}/${p}`;
}

export default function Quests() {
  const [activeTab, setActiveTab] = useState("daily");
  const [, setLocation] = useLocation();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  
  // claimedTasks is authoritative from the server; do not persist to localStorage for important state.
  const [claimedTasks, setClaimedTasks] = useState<string[]>([]);

  // When the backend profile has been reset (xp, questsCompleted, tasksCompleted are zero) we
  // should also clear any locally persisted claimed task state so quests become claimable again.
  useEffect(() => {
    try {
      // Defer reading user until after auth hook resolves
      // We access it via useAuth below once available.
    } catch {}
  }, []);

  // Sync local claimed tasks with server-side completed quests for the signed-in user.
  // This ensures the UI reflects server truth (prevents double-claim and stale local state).
  useEffect(() => {
    if (!user || !user.id) return;

    let cancelled = false;
    (async () => {
      try {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        try {
          const token = localStorage.getItem('accessToken');
          if (token) headers['Authorization'] = `Bearer ${token}`;
        } catch (e) { /* ignore localStorage errors */ }

        const res = await fetch(buildUrl(`/api/quests/completed/${user.id}`), { headers });
        if (!res.ok) return;
        const json = await res.json().catch(() => ({}));
        const serverCompleted: string[] = Array.isArray(json?.completed) ? json.completed : [];
        if (cancelled) return;

        if (serverCompleted.length > 0) {
          setClaimedTasks((prev) => {
            const merged = Array.from(new Set([...(prev || []), ...serverCompleted]));
            return merged;
          });
        }
      } catch (e) {
        console.warn('[Quests] failed to sync completed quests from server', e);
      }
    })();

    return () => { cancelled = true; };
  }, [user?.id]);

  const [connectedX, setConnectedX] = useState<boolean>(() => {
    try { return localStorage.getItem('nexura:connected:x') === '1'; } catch(e){ return false; }
  });
  const [connectedDiscord, setConnectedDiscord] = useState<boolean>(() => {
    try { return localStorage.getItem('nexura:connected:discord') === '1'; } catch(e){ return false; }
  });
  // Local default quests: always show these in the UI. Quests are hardcoded
  // in the client and do NOT come from the server. XP awarding and completed/
  // claim state remain authoritative on the server (we still call /api/* for
  // claim actions and completed lists), but the catalog below is the single
  // source of truth for what is shown to users.
  const DEFAULT_QUESTS: any[] = [

    { id: 'std-follow-nexura', title: 'Follow Nexura on X', description: 'Follow Nexura to stay up to date', xp: 50, reward: '50 XP', kind: 'featured', url: 'https://x.com/NexuraXYZ', actionLabel: 'Follow Nexura', isActive: 1 },
    { id: 'std-join-discord', title: 'Join Nexura Discord', description: 'Join the Nexura community on Discord and verify yourself', xp: 50, reward: '50 XP', kind: 'featured', url: 'https://discord.gg/caK9kATBya', actionLabel: 'Join Discord', isActive: 1 },
    { id: 'std-complete-campaign', title: 'Complete a Campaign', description: 'Finish any campaign to qualify for Standard Quests', xp: 50, reward: '50 XP', kind: 'featured', to: '/projects', actionLabel: 'Browse Campaigns', isActive: 1 },

    { id: 'quest-support-claim-1', title: 'Support or Oppose Claim A', description: 'Support or oppose this claim on Intuition', xp: 50, reward: '50 XP', kind: 'extra', url: 'https://portal.intuition.systems/explore/triple/0x713f27d70772462e67805c6f76352384e01399681398f757725b9cbc7f495dcf?tab=positions', actionLabel: 'Open Claim', isActive: 1 },
    { id: 'quest-support-claim-2', title: 'Support or Oppose Claim B', description: 'Support or oppose this claim on Intuition', xp: 50, reward: '50 XP', kind: 'extra', url: 'https://portal.intuition.systems/explore/triple/0x713f27d70772462e67805c6f76352384e01399681398f757725b9cbc7f495dcf?tab=positions', actionLabel: 'Open Claim', isActive: 1 },

    { id: 'camp-learn-quest', title: 'Complete at least a quest in Learn tab', description: 'Finish any Learn quest to progress campaigns', xp: 50, reward: '50 XP', kind: 'campaign', to: '/learn', actionLabel: 'Go to Learn', isActive: 1 },
    { id: 'camp-join-socials', title: 'Join Nexura Socials', description: 'Be part of Nexura socials to unlock campaign rewards', xp: 50, reward: '50 XP', kind: 'campaign', url: 'https://x.com/NexuraXYZ', actionLabel: 'Open Socials', isActive: 1 },
    { id: 'camp-support-claim', title: 'Support the Nexura Claim', description: 'Support the nexura claim on Intuition', xp: 50, reward: '50 XP', kind: 'campaign', url: '#', actionLabel: 'Open Claim', isActive: 1 },
  ];

  // Use hardcoded quests as the UI source of truth (do not fetch /api/quests)
  const [quests] = useState<any[]>(DEFAULT_QUESTS);

  // Group quests by kind for the UI
  const featuredQuests = quests.filter(q => q.kind === 'featured');
  const campaignTasks = quests.filter(q => ['campaign','campaign-task','campaign_task'].includes(q.kind));
  const extraQuests = quests.filter(q => !['featured','daily','one-time','onetime','one_time','external','campaign','campaign-task','campaign_task','connect-x','connect-discord'].includes(q.kind));

  const handleClaimTask = (taskId: string) => {
    if (!claimedTasks.includes(taskId)) {
      const next = [...claimedTasks, taskId];
      setClaimedTasks(next);
    }
  };

  // Helper: determine XP amount for a quest/task
  const getXpAmount = (q: any) => {
    if (!q) return 0;
    if (typeof q.xp === 'number' && !Number.isNaN(q.xp)) return Number(q.xp);
    if (typeof q.reward === 'string') {
      const m = q.reward.match(/(\d+)/);
      if (m) return Number(m[1]) || 0;
    }
    return 0;
  };

  const claimLabelFor = (id: string, q: any) => {
    if (claimedTasks.includes(id)) return 'Claimed';
    const xp = getXpAmount(q);
    return xp > 0 ? `Claim ${xp} XP` : 'Claim XP';
  };

  const unclaimTask = (taskId: string) => {
    const next = claimedTasks.filter(id => id !== taskId);
    setClaimedTasks(next);
  };

  // visitedTasks is an in-memory UI hint only; do not persist to localStorage for important state
  const [visitedTasks, setVisitedTasks] = useState<string[]>([]);

  // Claimable totals come from the server so we don't hardcode client-side assumptions.
  const [claimableTotals, setClaimableTotals] = useState<{
    featured?: number;
    campaigns?: number;
    extra?: number;
  }>({});

  // Helper: request claimable totals for a list of quests from the backend
  const fetchClaimableFor = async (quests: any[]) => {
    if (!user || !user.id) return 0;
    try {
      const payload = { userId: user.id, quests: quests.map(q => ({ id: q.id, xp: Number(q.xp || (typeof q.reward === 'string' ? (Number((q.reward.match(/(\d+)/) || [0])[0]) || 0) : 0)) })) };
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      try { const token = localStorage.getItem('accessToken'); if (token) headers['Authorization'] = `Bearer ${token}`; } catch(e) {}
      const resp = await fetch(buildUrl('/api/quests/claimable'), { method: 'POST', headers, body: JSON.stringify(payload) });
      if (!resp.ok) {
        console.warn('[Quests] claimable API failed', resp.status);
        return null;
      }
      const json = await resp.json().catch(() => ({}));
      return typeof json?.total === 'number' ? json.total : null;
    } catch (e) {
      console.warn('[Quests] failed to fetch claimable totals', e);
      return null;
    }
  };

  // Refresh claimable totals whenever the user or claimedTasks change
  useEffect(() => {
    let cancelled = false;
    if (!user || !user.id) return;
    (async () => {
      try {
        const [featuredTotal, campaignsTotal, extraTotal] = await Promise.all([
          fetchClaimableFor(featuredQuests),
          fetchClaimableFor(campaignTasks),
          fetchClaimableFor(extraQuests),
        ]);
        if (cancelled) return;
        setClaimableTotals({
          featured: featuredTotal ?? undefined,
          campaigns: campaignsTotal ?? undefined,
          extra: extraTotal ?? undefined,
        });
      } catch (e) {
        console.warn('[Quests] failed to refresh claimable totals', e);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, claimedTasks.length, quests.length]);

  const markVisited = (taskId: string) => {
    if (!visitedTasks.includes(taskId)) {
      const next = [...visitedTasks, taskId];
      setVisitedTasks(next);
    }
  };

  // Render the primary action for a quest. For external links we render a
  // real anchor so browser default behaviors (middle-click, open in new tab,
  // context menu) work. For internal navigation we prefer router navigation.
  const renderActionForQuest = (q: any) => {
  const label = q.actionLabel || 'Open';

  // External link: starts with http/https
  if (q.url && /^https?:\/\//.test(q.url)) {
    return (
      <a
        href={q.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => { e.stopPropagation(); try { markVisited(q.id); } catch(e){} }}
        onContextMenu={(e) => { e.preventDefault(); claimAndAwardXp(q); }}
        className="w-full inline-flex items-center justify-between px-4 py-2 rounded-md bg-primary text-white hover:opacity-95"
        data-testid={`action-quest-${q.id}`}
      >
        <span>{label}</span>
        <ArrowRight className="w-4 h-4 ml-2" />
      </a>
    );
  }

  // Internal navigation: use SPA routing
  if (q.to) {
    return (
      <a
        href={q.to}
        onClick={(e) => { e.preventDefault(); try { setLocation(q.to); } catch(e){} }}
        className="w-full inline-flex items-center justify-between px-4 py-2 rounded-md bg-primary text-white hover:opacity-95"
        data-testid={`action-quest-${q.id}`}
      >
        <span>{label}</span>
        <ArrowRight className="w-4 h-4 ml-2" />
      </a>
    );
  }

  // Fallback: button action
  return (
    <Button
      variant="default"
      className="w-full flex items-center justify-between"
      onClick={() => performQuestAction(q)}
      onContextMenu={(e) => { e.preventDefault(); claimAndAwardXp(q); }}
      data-testid={`action-quest-${q.id}`}
    >
      <span>{label}</span>
      <ArrowRight className="w-4 h-4 ml-2" />
    </Button>
  );
};

  // Claim a quest/task locally and, if the user is signed in, persist XP to the backend
  const claimAndAwardXp = async (quest: any) => {
    if (!quest || !quest.id) return;
    
    // Check if already claimed
    if (claimedTasks.includes(quest.id)) {
      console.log('[Quests] Quest already claimed:', quest.id);
      toast({
        title: 'Already claimed',
        description: 'You have already claimed this quest.',
        variant: 'destructive'
      });
      return;
    }

    // determine xp amount
    let xpAmount = 0;
    if (typeof quest.xp === 'number') xpAmount = quest.xp;
    else if (typeof quest.reward === 'string') {
      const m = quest.reward.match(/(\d+)\s*XP/i);
      if (m) xpAmount = Number(m[1]);
    }

    const questsCompletedDelta = Number(quest.metrics?.quests ?? 0);
    const tasksCompletedDelta = Number(quest.metrics?.tasks ?? 0);

    if (!user || !user.id) {
      console.error('[Quests] No user ID available');
      toast({
        title: 'Error',
        description: 'Please sign in to claim XP.',
        variant: 'destructive'
      });
      return;
    }

    if (xpAmount <= 0) {
      console.warn('[Quests] Invalid XP amount:', xpAmount);
      toast({
        title: 'Error',
        description: 'Invalid quest reward.',
        variant: 'destructive'
      });
      return;
    }

    try {
      console.log('[Quests] Awarding XP:', { userId: user.id, xp: xpAmount, questId: quest.id });

      // Build headers with bearer token
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const token = localStorage.getItem('accessToken');
        if (token) headers['Authorization'] = `Bearer ${token}`;
      } catch (e) { /* ignore */ }

      const resp = await fetch(buildUrl('/api/xp/add'), {
        method: 'POST',
        headers,
        body: JSON.stringify({ userId: user.id, xp: xpAmount, questId: quest.id, questsCompletedDelta, tasksCompletedDelta }),
      });

      if (resp.status === 409) {
        // Quest already completed on server
        console.warn('[Quests] Quest already completed on server:', quest.id);
        // Sync claimedTasks from server
        try {
          const headers2: Record<string, string> = { "Content-Type": "application/json" };
          const token2 = localStorage.getItem('accessToken');
          if (token2) headers2['Authorization'] = `Bearer ${token2}`;
          const r = await fetch(buildUrl(`/api/quests/completed/${user.id}`), { headers: headers2 });
          if (r.ok) {
            const j = await r.json().catch(() => ({}));
            const serverCompleted = Array.isArray(j?.completed) ? j.completed : [];
            setClaimedTasks(serverCompleted);
          } else {
            handleClaimTask(quest.id);
          }
        } catch (e) {
          handleClaimTask(quest.id);
        }
        toast({ title: 'Already claimed', description: 'You have already claimed this quest.', variant: 'destructive' });
        return;
      }

      if (!resp.ok) {
        const text = await resp.text().catch(() => String(resp.status));
        throw new Error(`API returned ${resp.status}: ${text}`);
      }

      const json = await resp.json().catch(() => ({}));
      console.log('[Quests] POST /api/xp/add SUCCESS:', json);

      // Sync claimedTasks from server (authoritative)
      try {
        const headers2: Record<string, string> = { "Content-Type": "application/json" };
        const token2 = localStorage.getItem('accessToken');
        if (token2) headers2['Authorization'] = `Bearer ${token2}`;
        const r = await fetch(buildUrl(`/api/quests/completed/${user.id}`), { headers: headers2 });
        if (r.ok) {
          const j = await r.json().catch(() => ({}));
          const serverCompleted = Array.isArray(j?.completed) ? j.completed : [];
          setClaimedTasks(serverCompleted);
        } else {
          handleClaimTask(quest.id);
        }
      } catch (e) {
        console.warn('[Quests] failed to refresh claimedTasks after claim', e);
        handleClaimTask(quest.id);
      }

      // Emit session change so AuthProvider refetches profile
      try {
        console.log('[Quests] Emitting session change...');
        emitSessionChange();
      } catch (e) {
        console.warn('[Quests] Failed to emit session change:', e);
      }

      // Small delay to allow profile refresh to propagate
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Show success toast — prefer xp value from server result if available
      const totalXp = (json && (json.xp || json.result?.xp)) ?? null;
      toast({ title: 'XP awarded!', description: `+${xpAmount} XP earned${totalXp ? ` — total: ${totalXp} XP` : ''}` });
    } catch (e) {
      console.error('[Quests] Failed to persist XP:', e);
      toast({ title: 'Error', description: 'Failed to award XP. Please try again.', variant: 'destructive' });
    }
  };

  const performQuestAction = (quest: any) => {
    if (quest.kind === 'external' && quest.url) {
      // legacy fallback: open in new tab and mark visited. Prefer using anchors
      // in the UI so middle-click/right-click works — this path remains for
      // programmatic calls but UI now renders anchors for external actions.
      try { window.open(quest.url, '_blank', 'noopener'); } catch (e) {}
      try { markVisited(quest.id); } catch(e){}
      // If this is an X social action, ask the server to verify (follow/like/retweet)
      if (quest.id.startsWith('onetime-x-')) {
        const action = quest.id.replace('onetime-','');
        // map to server endpoints
        const endpoint = action.includes('follow') ? '/quests/verify/follow' : action.includes('like') ? '/quests/verify/like' : action.includes('retweet') ? '/quests/verify/retweet' : null;
        if (endpoint) {
            // send target info if available — use apiRequest so Authorization header is applied
            const target = quest.target || 'your_x_account';
            try {
              apiRequest('POST', endpoint, { target })
                .then(r => r.json().catch(() => null))
                .then(json => {
                  // Do NOT auto-claim on verify success. Mark visited so the Claim button is enabled
                  if (json && json.ok) markVisited(quest.id);
                }).catch(() => {});
            } catch (e) {
              // ignore - the user can manually press Claim after returning
              console.warn('[Quests] verify request failed', e);
            }
            return;
          }
        }
        // Do not auto-claim generic external links; only mark visited so user must press Claim
        return;
    }
    if (quest.kind === 'connect-x') {
      // Start OAuth1 flow by redirecting to server endpoint which begins request_token flow
      try { window.location.href = '/auth/x/login'; } catch (e) {}
      try { markVisited(quest.id); } catch(e){}
      return;
    }
    if (quest.kind === 'connect-discord') {
      setConnectedDiscord(true);
      try { localStorage.setItem('nexura:connected:discord', '1'); } catch(e){}
      // Do not auto-claim; enable claim button after connect
      try { markVisited(quest.id); } catch(e){}
      return;
    }
    // default fallback: just mark visited (do not auto-claim). User must press the Claim button.
    try { markVisited(quest.id); } catch(e){}
  };

function QuestCard({ quest, visitedTasks, claimedTasks, onClaim }: {
  quest: any,
  visitedTasks: string[],
  claimedTasks: string[],
  onClaim: (quest: any) => void
}) {
  const isClaimed = claimedTasks.includes(quest.id);
  const isVisited = visitedTasks.includes(quest.id);

  return (
    <Card key={quest.id} className="overflow-hidden hover-elevate group">
      <div className="relative h-48 overflow-hidden">
        <img 
          src={quest.heroImage || gettingStartedImg} 
          alt={quest.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
          onError={(e: any) => { e.target.src = gettingStartedImg; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute top-4 right-4">
          {isClaimed ? <CheckCircle className="w-5 h-5 text-green-500"/> : <Clock className="w-5 h-5 text-white/80"/>}
        </div>
      </div>

      <CardHeader>
        <CardTitle>{quest.title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{quest.description}</p>

        {quest.progress !== undefined && (
          <div className="w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${(quest.progress / quest.total) * 100}%` }}
            />
          </div>
        )}

        <Button
          className="w-full"
          disabled={!isVisited || isClaimed}
          onClick={() => onClaim(quest)}
          variant={isClaimed ? 'outline' : 'default'}
        >
          {isClaimed ? 'Claimed' : `Claim ${quest.xp || 0} XP`}
        </Button>
      </CardContent>
    </Card>
  );
}
  // React to profile reset: if all progress metrics are zero, clear claimedTasks.
  useEffect(() => {
    if (!user) return;
    const xp = Number((user as any).xp || 0);
    const qc = Number((user as any).questsCompleted || (user as any).quests_completed || 0);
    const tc = Number((user as any).tasksCompleted || (user as any).tasks_completed || 0);
    if (xp === 0 && qc === 0 && tc === 0 && claimedTasks.length > 0) {
      console.log('[Quests] Detected profile reset, clearing claimedTasks cache');
      setClaimedTasks([]);
    }
  }, [user, claimedTasks.length]);

  return (
    <div className="min-h-screen bg-black text-white overflow-auto p-6 relative" data-testid="quests-page">
      <AnimatedBackground />
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Quests</h1>
          </div>
          {user && (
            <div className="glass-card p-4 text-center">
              <div className="text-sm text-muted-foreground">Your XP</div>
              <div className="text-2xl font-bold text-primary">{user.xp || 0}</div>
              <div className="text-xs text-muted-foreground">Level {user.level || 1}</div>
            </div>
          )}
        </div>

        {/* Featured / User-provided Quests */}
          <div className="space-y-4">
          {/* Show total claimable XP for featured quests (server-driven when available) */}
          <div className="text-sm text-muted-foreground mb-2">{
            (() => {
              const server = claimableTotals.featured;
              if (typeof server === 'number') return `Claimable: +${server} XP`;
              // Fallback to local calculation when server not available
              const total = featuredQuests.reduce((acc, q) => {
                const xp = typeof q.xp === 'number' ? q.xp : (typeof q.reward === 'string' ? (Number((q.reward.match(/(\d+)/) || [0])[0]) || 0) : 0);
                return acc + (claimedTasks.includes(q.id) ? 0 : xp);
              }, 0);
              // return `Claimable: +${total} XP`;
            })()
          }</div>

{/* Featured Quests */}
<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {featuredQuests.map(q => (
    <QuestCard
      key={q.id}
      quest={q}
      visitedTasks={visitedTasks}
      claimedTasks={claimedTasks}
      onClaim={claimAndAwardXp}
    />
  ))}
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {campaignTasks.map(q => (
    <QuestCard
      key={q.id}
      quest={q}
      visitedTasks={visitedTasks}
      claimedTasks={claimedTasks}
      onClaim={claimAndAwardXp}
    />
  ))}
</div>

<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
  {extraQuests.map(q => (
    <QuestCard
      key={q.id}
      quest={q}
      visitedTasks={visitedTasks}
      claimedTasks={claimedTasks}
      onClaim={claimAndAwardXp}
    />
  ))}
</div>
        </div>
      </div>
    </div>
  );
}