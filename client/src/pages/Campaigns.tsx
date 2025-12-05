import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ExternalLink, Clock } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AnimatedBackground from "@/components/AnimatedBackground";

interface Campaign {
  id: string;
  title: string;
  description: string;
  project_name?: string;
  project_image?: string;
  starts_at?: string;
  ends_at?: string;
  metadata?: string;
  reward?: string | { amount: number; currency: string };
  url?: string;
  status?: string;
}

// Main TASKS card
const TASKS_CARD: Campaign = {
  id: "tasks-card",
  title: "Start Campaign Tasks",
  description: "Complete unique tasks in the Nexura ecosystem and earn rewards",
  project_name: "Intuition Ecosystem",
  reward: "500 XP + 16 TRUST",
  project_image: "/campaign.png",
  starts_at: new Date().toISOString(),
  ends_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString(),
  metadata: JSON.stringify({ category: "Tasks" }),
};

export default function Campaigns() {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [, setLocation] = useLocation();
  const [visitedTasks, setVisitedTasks] = useState<string[]>([]);
  const [claimedTasks, setClaimedTasks] = useState<string[]>([]);

  const { data: campaigns, isLoading } = useQuery<{
    oneTimeCampaigns: Campaign[];
    featuredCampaigns: Campaign[];
    upcomingCampaigns: Campaign[];
  }>({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const res = await fetch(`${backendUrl}/api/campaigns`);
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      return res.json();
    },
  });

  const now = new Date();

  const allCampaigns: Campaign[] = [
    TASKS_CARD,
    ...(campaigns?.oneTimeCampaigns ?? []),
    ...(campaigns?.featuredCampaigns ?? []),
    ...(campaigns?.upcomingCampaigns ?? []),
  ];

  // Active campaigns: status active OR within start/end date
  const activeCampaigns = allCampaigns.filter((c) => {
    const start = c.starts_at ? new Date(c.starts_at) : null;
    const end = c.ends_at ? new Date(c.ends_at) : null;
    return c.status === "active" || (start && end && start <= now && now <= end);
  });

  // Upcoming campaigns: use status from backend
  const upcomingCampaigns = allCampaigns.filter(c => c.status === "upcoming");

  const claimAndAwardReward = (campaign: Campaign) => {
    if (!claimedTasks.includes(campaign.id)) {
      setClaimedTasks([...claimedTasks, campaign.id]);
    }
  };

  const visitTask = (campaign: Campaign) => {
    if (!visitedTasks.includes(campaign.id)) setVisitedTasks([...visitedTasks, campaign.id]);
    if (campaign.url) window.open(campaign.url, "_blank");
  };

  const renderCampaignCard = (campaign: Campaign, isActive: boolean) => {
    let metadata: any = {};
    try {
      metadata = campaign.metadata ? JSON.parse(campaign.metadata) : {};
    } catch {
      metadata = {};
    }

    const status = isActive ? "Active" : "Coming Soon";

    return (
      <Card
        key={campaign.id}
        className="bg-[#0d1117] border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition"
      >
        <div className="relative h-44 bg-black">
          {campaign.project_image && (
            <img
              src={campaign.project_image}
              alt={campaign.title}
              className="w-full h-full object-cover rounded-t-2xl"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <div className="absolute top-3 right-3">
            <Badge
              className={
                isActive
                  ? "bg-green-500/20 text-green-400 border border-green-500/30"
                  : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
              }
            >
              {status}
            </Badge>
          </div>

          {metadata.category && (
            <div className="absolute top-3 left-3 text-xs text-white/80 font-medium">
              {metadata.category}
            </div>
          )}
        </div>

        <div className="p-5 space-y-3">
          <h2 className="text-lg font-semibold text-white">{campaign.title}</h2>
          <p className="text-sm text-gray-400">{campaign.description}</p>

          {campaign.project_name && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Project:</span>
              <span className="text-white">{campaign.project_name}</span>
            </div>
          )}

          {campaign.reward && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Rewards:</span>
              <span className="text-white flex items-center space-x-1">
                {typeof campaign.reward === "string"
                  ? campaign.reward
                  : `${campaign.reward.amount} ${campaign.reward.currency}`}
              </span>
            </div>
          )}

          <Button
            className={`w-full mt-3 font-medium rounded-xl ${
              isActive
                ? "bg-[#1f6feb] hover:bg-[#388bfd] text-white"
                : "bg-gray-600 cursor-not-allowed text-gray-300"
            }`}
            onClick={() => {
              if (!isActive) return;
              if (campaign.id === "tasks-card") setLocation("/campaigns/tasks");
              else setLocation(`/campaigns/${campaign.id}`);
            }}
            disabled={!isActive}
          >
            {isActive ? (
              <>
                <ExternalLink className="w-4 h-4 mr-2" />{" "}
                {campaign.id === "tasks-card" ? "Start Tasks" : "Do Task"}
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" /> Coming Soon
              </>
            )}
          </Button>
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white overflow-auto p-6 relative">
      <AnimatedBackground />
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Campaigns</h1>
          <p className="text-muted-foreground">
            Complete unique tasks and earn rewards in the Nexura ecosystem.
          </p>
        </div>

        {/* Active Campaigns */}
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-white">Active Campaigns</h2>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading campaigns...</div>
          ) : activeCampaigns.length === 0 ? (
            <Card className="glass glass-hover rounded-3xl p-8 text-center">
              <p className="text-white/60">No active campaigns at the moment. Check back soon!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCampaigns.map((campaign) => renderCampaignCard(campaign, true))}
            </div>
          )}
        </div>

        {/* Upcoming Campaigns */}
        {upcomingCampaigns.length > 0 && (
          <div className="space-y-6 mt-12">
            <h2 className="text-2xl font-semibold text-white">Upcoming Campaigns</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingCampaigns.map((campaign) => renderCampaignCard(campaign, false))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
