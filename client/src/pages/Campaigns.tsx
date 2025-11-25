import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import AnimatedBackground from "@/components/AnimatedBackground";

interface Campaign {
  id: string;
  name: string;
  description: string;
  project_name?: string;
  project_image?: string;
  starts_at?: string;
  ends_at?: string;
  metadata?: string;
  created_at: string;
}

export default function Campaigns() {
  const [, setLocation] = useLocation();

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["/api/campaigns"],
  });

  // Separate active and upcoming campaigns
  const now = new Date();
  const activeCampaigns = campaigns.filter(c => {
    if (!c.starts_at || !c.ends_at) return false;
    const start = new Date(c.starts_at);
    const end = new Date(c.ends_at);
    return start <= now && now <= end;
  });

  const upcomingCampaigns = campaigns.filter(c => {
    if (!c.starts_at) return false;
    const start = new Date(c.starts_at);
    return start > now;
  });

  const renderCampaignCard = (campaign: Campaign) => {
    const metadata = campaign.metadata ? JSON.parse(campaign.metadata) : {};
    const isActive = activeCampaigns.some(c => c.id === campaign.id);
    const status = isActive ? "Active" : "Coming Soon";
    
    return (
      <Card key={campaign.id} className="overflow-hidden hover-elevate group" data-testid={`campaign-${campaign.id}`}>
        {/* Hero Image */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-purple-700/20 via-blue-600/20 to-cyan-500/20">
          {campaign.project_image && (
            <img 
              src={campaign.project_image} 
              alt={campaign.name}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
          
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <Badge 
              className={
                isActive
                  ? "bg-green-500/10 text-green-500 border-green-500/30"
                  : "bg-blue-500/10 text-blue-500 border-blue-500/30"
              }
            >
              {status}
            </Badge>
          </div>
          
          {/* Category */}
          {metadata.category && (
            <div className="absolute top-4 left-4">
              <div className="text-sm text-white/80 font-medium">{metadata.category}</div>
            </div>
          )}
        </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{campaign.name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{campaign.description}</p>
        
        <div className="space-y-3">
          {campaign.project_name && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Project:</span>
              <span className="font-medium">{campaign.project_name}</span>
            </div>
          )}
          {metadata.participants !== undefined && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Participants:</span>
              <span className="font-medium">{metadata.participants?.toLocaleString() || 0}</span>
            </div>
          )}
          {metadata.rewardPool && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Rewards:</span>
              <div className="flex items-center space-x-1">
                <span className="text-blue-500 font-bold">50XP</span>
                <span className="text-muted-foreground">+</span>
                <span className="font-medium text-primary">{metadata.rewardPool}</span>
              </div>
            </div>
          )}
          {campaign.starts_at && campaign.ends_at && (
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Duration:</span>
              <span className="font-medium">
                {new Date(campaign.starts_at).toLocaleDateString()} - {new Date(campaign.ends_at).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>

        <Button 
          className="w-full" 
          disabled={!isActive}
          onClick={() => isActive && setLocation(`/campaign/${campaign.id}`)}
          data-testid={`button-join-${campaign.id}`}
        >
          {isActive ? (
            <>
              <ExternalLink className="w-4 h-4 mr-2" />
              Join Campaign
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 mr-2" />
              Coming Soon
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

  return (
    <div className="min-h-screen bg-black text-white overflow-auto p-6 relative" data-testid="campaigns-page">
      <AnimatedBackground />
      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Campaigns</h1>
          <p className="text-muted-foreground">
            Join unique project campaigns and contribute to the growth of the Nexura ecosystem
          </p>
        </div>

        {/* Active Campaigns */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Active Campaigns
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Ongoing campaigns you can join right now
            </p>
          </div>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading campaigns...</div>
          ) : activeCampaigns.length === 0 ? (
            <Card className="glass glass-hover rounded-3xl p-8 text-center">
              <p className="text-white/60">No active campaigns at the moment. Check back soon!</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeCampaigns.map((campaign) => renderCampaignCard(campaign))}
            </div>
          )}
        </div>

        {/* Upcoming Campaigns */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Upcoming Campaigns
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Get ready for these exciting upcoming campaigns
            </p>
          </div>
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">Loading campaigns...</div>
          ) : upcomingCampaigns.length === 0 ? (
            <Card className="glass glass-hover rounded-3xl p-8 text-center">
              <p className="text-white/60">No upcoming campaigns scheduled.</p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingCampaigns.map((campaign) => renderCampaignCard(campaign))}
            </div>
          )}
        </div>

        {/* Information Box */}
        <Card className="glass glass-hover rounded-3xl">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Users className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">What are Campaigns?</h3>
                <p className="text-sm text-muted-foreground">
                  Campaigns are unique, project-specific initiatives that allow you to contribute to ecosystem growth. 
                  Unlike daily quests, campaigns have specific durations, larger reward pools, and focus on meaningful 
                  contributions to the Nexura ecosystem and partner projects.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}