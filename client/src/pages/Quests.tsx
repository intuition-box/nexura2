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

// Use Vite env var if provided, otherwise fall back to the deployed backend URL.
// `import.meta.env` may not be typed in this project, so access defensively.
// Prefer configured Vite env var; fallback to localhost for dev instead of the deployed Render URL
const BACKEND_BASE = ((import.meta as any).env?.VITE_BACKEND_URL as string) ||
  "http://localhost:5051";

function buildUrl(path: string) {
  if (/^https?:\/\//i.test(path)) return path;
  const base = BACKEND_BASE.replace(/\/+$|\\s+/g, "");
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

  // Daily Quest Tasks (structured as single quest with multiple tasks)
  const dailyQuestTasks = [
    {
      id: "daily-task-1",
      title: "Verify Your Identity",
      description: "Complete your identity verification process",
      reward: "50 XP",
      xp: 50,
      completed: false,
      metrics: { tasks: 1 }
    },
    {
      id: "daily-task-2", 
      title: "Join Community Discussion",
      description: "Participate in at least one community discussion",
      reward: "50 XP",
      xp: 50,
      completed: false,
      metrics: { tasks: 1 }
    },
    {
      id: "daily-task-3",
      title: "Share Intuition Project",
      description: "Share an Intuition project with the community",
      reward: "50 XP",
      xp: 50,
      completed: false,
      metrics: { tasks: 1 }
    },
    {
      id: "daily-task-4",
      title: "Create an Attestation",
      description: "Make your first attestation on the Intuition platform",
      reward: "50 XP",
      xp: 50,
      completed: false,
      metrics: { tasks: 1 }
    }
  ];

  const oneTimeQuests = [
    {
      id: "onetime-x-follow",
      title: "Follow on X",
      description: "Follow our X account to stay updated",
      reward: "50 XP",
      kind: 'external',
      url: 'https://x.com/your_x_account',
      xp: 50,
      actionLabel: 'Follow',
      metrics: { quests: 1 }
    },
    {
      id: "onetime-x-like",
      title: "Like a Tweet",
      description: "Like our pinned tweet to show support",
      reward: "50 XP",
      kind: 'external',
      url: 'https://x.com/your_x_account/status/your_tweet_id',
      targetTweetId: 'your_tweet_id',
      xp: 50,
      actionLabel: 'Like',
      metrics: { quests: 1 }
    },
    {
      id: "onetime-x-retweet",
      title: "Retweet a Tweet",
      description: "Retweet our announcement tweet",
      reward: "50 XP",
      kind: 'external',
      url: 'https://x.com/your_x_account/status/your_tweet_id',
      targetTweetId: 'your_tweet_id',
      xp: 50,
      actionLabel: 'Retweet',
      metrics: { quests: 1 }
    },
    {
      id: "onetime-connect-x",
      title: "Connect X",
      description: "Link your X account to verify your identity and join the community",
      reward: "50 XP",
      kind: 'connect-x',
      xp: 50,
      actionLabel: 'Connect X',
      metrics: { quests: 1 }
    },
    {
      id: "onetime-connect-discord",
      title: "Connect Discord",
      description: "Connect your Discord to access special channels",
      reward: "50 XP",
      kind: 'connect-discord',
      xp: 50,
      actionLabel: 'Connect Discord',
      metrics: { quests: 1 }
    },
    {
      id: "onetime-join-discord",
      title: "Join Discord",
      description: "Join our Discord server to chat with the community",
      reward: "50 XP",
      kind: 'external',
      url: 'https://discord.gg/your_invite_code',
      xp: 50,
      actionLabel: 'Join Discord',
      metrics: { quests: 1 }
    }
  ];

  // Additional user-provided featured quests & campaigns (shown as a compact group)
  const featuredQuests = [
    {
      id: 'std-follow-nexura',
      title: 'Follow Nexura on X',
      description: 'Follow Nexura to stay up to date',
      kind: 'external',
      url: 'https://x.com/NexuraXYZ',
      xp: 50,
      reward: '50 XP',
      actionLabel: 'Follow Nexura',
      metrics: { quests: 1 }
    },
    {
      id: 'std-join-discord',
      title: 'Join Nexura Discord',
      description: 'Join the Nexura community on Discord and verify yourself',
      kind: 'external',
      url: 'https://discord.gg/Up7UjXrdp',
      xp: 50,
      reward: '50 XP',
      actionLabel: 'Join Discord',
      metrics: { quests: 1 }
    },
    {
      id: 'std-complete-campaign',
      title: 'Complete a Campaign',
      description: 'Finish any campaign to qualify for Standard Quests',
      kind: 'internal',
      to: '/projects',
      xp: 50,
      reward: '50 XP',
      actionLabel: 'Browse Campaigns',
      metrics: { quests: 1 }
    }
  ];

  const extraQuests = [
    {
      id: 'quest-support-claim-1',
      title: 'Support or Oppose Claim A',
      description: 'Support or oppose this claim on Intuition',
      kind: 'external',
      url: 'https://testnet.portal.intuition.systems/explore/triple/0xb301f076ea5d81e049e5fc1bb47ee6cdf089ce79c86376053e9a2ff7f3058b7d',
      reward: '50 XP',
      actionLabel: 'Open Claim',
      metrics: { quests: 1 }
    },
    {
      id: 'quest-support-claim-2',
      title: 'Support or Oppose Claim B',
      description: 'Support or oppose this claim on Intuition',
      kind: 'external',
      url: 'https://testnet.portal.intuition.systems/explore/atom/0x15a1eb6044c93eab63862352cbb949c22a537099f8d482e7f05d3e89d80bb1b7',
      reward: '50 XP',
      actionLabel: 'Open Claim',
      metrics: { quests: 1 }
    }
  ];

  const campaignTasks = [
    {
      id: 'camp-learn-quest',
      title: 'Complete at least a quest in Learn tab',
      description: 'Finish any Learn quest to progress campaigns',
      kind: 'internal',
      to: '/learn',
      reward: '50 XP',
      actionLabel: 'Go to Learn',
      metrics: { quests: 1 }
    },
    {
      id: 'camp-join-socials',
      title: 'Join Nexura Socials',
      description: 'Be part of Nexura socials to unlock campaign rewards',
      kind: 'external',
      url: 'https://x.com/NexuraXYZ',
      reward: '50 XP',
      actionLabel: 'Open Socials',
      metrics: { tasks: 1 }
    },
    {
      id: 'camp-support-claim',
      title: 'Support the Nexura Claim',
      description: 'Support the nexura claim on Intuition',
      kind: 'external',
      url: 'https://testnet.portal.intuition.systems/explore/atom/0x985db42765efe28ba3ed6867fa7bd913955227898f6a665e34e3c9171885f1cc',
      reward: '50 XP',
      actionLabel: 'Open Claim',
      metrics: { quests: 1 }
    }
  ];

  const handleClaimTask = (taskId: string) => {
    if (!claimedTasks.includes(taskId)) {
      const next = [...claimedTasks, taskId];
      setClaimedTasks(next);
    }
  };

  const unclaimTask = (taskId: string) => {
    const next = claimedTasks.filter(id => id !== taskId);
    setClaimedTasks(next);
  };

  // visitedTasks is an in-memory UI hint only; do not persist to localStorage for important state
  const [visitedTasks, setVisitedTasks] = useState<string[]>([]);

  const markVisited = (taskId: string) => {
    if (!visitedTasks.includes(taskId)) {
      const next = [...visitedTasks, taskId];
      setVisitedTasks(next);
    }
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
      // open in new tab and mark completed locally
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
                if (json && json.ok) handleClaimTask(quest.id);
              }).catch(() => {});
          } catch (e) {
            // ignore - claim will remain local-only
            console.warn('[Quests] verify request failed', e);
          }
          return;
        }
      }
      // default immediate claim for generic external links
      handleClaimTask(quest.id);
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
      handleClaimTask(quest.id);
      return;
    }
    // default fallback: just claim
    handleClaimTask(quest.id);
  };

  const renderQuestCard = (quest: any, showProgress = false) => (
    <Card key={quest.id} className="overflow-hidden hover-elevate group" data-testid={`quest-${quest.id}`}>
      {/* Hero Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={quest.heroImage} 
          alt={quest.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Completion Status */}
        <div className="absolute top-4 right-4">
          {quest.completed ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <Clock className="w-5 h-5 text-white/80" />
          )}
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{quest.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{quest.description}</p>
        
        {showProgress && quest.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{quest.progress} / {quest.total}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${(quest.progress / quest.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {quest.compulsory && (
              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                Compulsory
              </Badge>
            )}
            {quest.timeLeft && (
              <div className="text-sm text-muted-foreground">
                {quest.timeLeft} left
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="font-semibold text-foreground">
              <span className="text-blue-500 font-bold">
                {typeof quest.xp === 'number' ? `+${quest.xp} XP` : quest.reward}
              </span>
            </div>
          </div>
        </div>

        <Button 
          className="w-full" 
          variant={quest.completed ? "outline" : "quest"}
          disabled={quest.completed}
          onClick={() => !quest.completed && setLocation(`/quest/${quest.id}?from=quests`)}
          data-testid={`button-start-${quest.id}`}
        >
          {quest.completed ? "Completed" : "Start Quest"}
        </Button>
      </CardContent>
    </Card>
  );

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
            <p className="text-muted-foreground">
              Complete daily tasks and one-time quests to earn XP rewards
            </p>
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
          <h2 className="text-xl font-semibold">Featured Quests</h2>
          <p className="text-sm text-muted-foreground mb-2">Quick access to special quests and campaigns.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {featuredQuests.map(q => (
              <Card key={q.id} className="p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{q.title}</h3>
                  <p className="text-sm text-muted-foreground">{q.description}</p>
                </div>
                <div className="mt-4">
                  <Button
                    variant="quest"
                    className="w-full flex items-center justify-between"
                    onClick={() => {
                      if (q.kind === 'external' && q.url) {
                        performQuestAction(q);
                      } else if (q.kind === 'internal' && q.to) {
                        try { setLocation(q.to); } catch(e){}
                      }
                    }}
                    onContextMenu={(e) => { e.preventDefault(); claimAndAwardXp(q); }}
                    title={q.actionLabel}
                  >
                    <span>{q.actionLabel}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  {/* Claim button: enabled only after the user visited (clicked the action) and not already claimed */}
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant={claimedTasks.includes(q.id) ? "outline" : "default"}
                      className="w-full"
                      disabled={!visitedTasks.includes(q.id) || claimedTasks.includes(q.id)}
                      onClick={() => claimAndAwardXp(q)}
                    >
                      {claimedTasks.includes(q.id) ? 'Claimed' : 'Claim XP'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {extraQuests.map(q => (
              <Card key={q.id} className="p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{q.title}</h3>
                  <p className="text-sm text-muted-foreground">{q.description}</p>
                </div>
                <div className="mt-4">
                  <Button
                    variant="default"
                    className="w-full flex items-center justify-between"
                    onClick={() => performQuestAction(q)}
                    onContextMenu={(e) => { e.preventDefault(); claimAndAwardXp(q); }}
                  >
                    <span>{q.actionLabel}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant={claimedTasks.includes(q.id) ? "outline" : "default"}
                      className="w-full"
                      disabled={!visitedTasks.includes(q.id) || claimedTasks.includes(q.id)}
                      onClick={() => claimAndAwardXp(q)}
                    >
                      {claimedTasks.includes(q.id) ? 'Claimed' : 'Claim XP'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campaignTasks.map(q => (
              <Card key={q.id} className="p-4 flex flex-col justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{q.title}</h3>
                  <p className="text-sm text-muted-foreground">{q.description}</p>
                </div>
                <div className="mt-4">
                  <Button
                    variant="default"
                    className="w-full flex items-center justify-between"
                    onClick={() => {
                      if (q.kind === 'external' && q.url) performQuestAction(q);
                      else if (q.kind === 'internal' && q.to) try { setLocation(q.to); } catch(e){}
                    }}
                    onContextMenu={(e) => { e.preventDefault(); claimAndAwardXp(q); }}
                  >
                    <span>{q.actionLabel}</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant={claimedTasks.includes(q.id) ? "outline" : "default"}
                      className="w-full"
                      disabled={!visitedTasks.includes(q.id) || claimedTasks.includes(q.id)}
                      onClick={() => claimAndAwardXp(q)}
                    >
                      {claimedTasks.includes(q.id) ? 'Claimed' : 'Claim XP'}
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Quest Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2" data-testid="quest-tabs">
            <TabsTrigger value="daily" data-testid="tab-daily">
              <Calendar className="w-4 h-4 mr-2" />
              Daily
            </TabsTrigger>
            <TabsTrigger value="onetime" data-testid="tab-onetime">
              <CheckCircle className="w-4 h-4 mr-2" />
              One Time
            </TabsTrigger>
          </TabsList>

          {/* Daily Tasks */}
          <TabsContent value="daily" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Daily Tasks</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Complete these tasks today to earn XP • Resets every 24 hours
              </p>
            </div>
            
            {/* Daily Tasks List */}
            <div className="space-y-4">
              {dailyQuestTasks.map((task) => (
                <Card key={task.id} className="p-6" data-testid={`daily-task-${task.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        claimedTasks.includes(task.id) 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300'
                      }`}>
                        {claimedTasks.includes(task.id) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{task.title}</h3>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold text-primary">{typeof task.xp === 'number' ? `+${task.xp} XP` : task.reward}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="default" onClick={() => { try { setLocation(`/quest/${task.id}`); markVisited(task.id); } catch(e){} }}>
                          Start
                        </Button>
                        <Button 
                          size="sm"
                          variant={claimedTasks.includes(task.id) ? "outline" : "quest"}
                          disabled={!visitedTasks.includes(task.id) || claimedTasks.includes(task.id)}
                          onClick={() => claimAndAwardXp(task)}
                          data-testid={`claim-task-${task.id}`}
                        >
                          {claimedTasks.includes(task.id) ? 'Claimed' : 'Claim XP'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Daily Progress Summary */}
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">Daily Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {claimedTasks.length} of {dailyQuestTasks.length} tasks completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round((claimedTasks.length / dailyQuestTasks.length) * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </div>
            </Card>
          </TabsContent>


          {/* One Time Quests */}
          <TabsContent value="onetime" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">One Time Quests</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Complete these essential quests to unlock the full Nexura experience
              </p>
            </div>
            
            {/* One Time Quests List */}
            <div className="space-y-4">
              {oneTimeQuests.map((quest) => (
                <Card key={quest.id} className="p-6" data-testid={`onetime-task-${quest.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        claimedTasks.includes(quest.id) 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300'
                      }`}>
                        {claimedTasks.includes(quest.id) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{quest.title}</h3>
                        <p className="text-sm text-muted-foreground">{quest.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold text-primary">{typeof quest.xp === 'number' ? `+${quest.xp} XP` : quest.reward}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() => performQuestAction(quest)}
                          data-testid={`action-quest-${quest.id}`}
                        >
                          {quest.actionLabel || 'Open'}
                        </Button>
                        <Button
                          size="sm"
                          variant={claimedTasks.includes(quest.id) ? "outline" : "quest"}
                          disabled={!visitedTasks.includes(quest.id) || claimedTasks.includes(quest.id)}
                          onClick={() => !claimedTasks.includes(quest.id) && claimAndAwardXp(quest)}
                          data-testid={`claim-quest-${quest.id}`}
                        >
                          {claimedTasks.includes(quest.id) ? 'Claimed' : 'Claim XP'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* One Time Quests Progress Summary */}
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">One Time Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {oneTimeQuests.filter(q => claimedTasks.includes(q.id)).length} of {oneTimeQuests.length} quests completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round((oneTimeQuests.filter(q => claimedTasks.includes(q.id)).length / oneTimeQuests.length) * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}