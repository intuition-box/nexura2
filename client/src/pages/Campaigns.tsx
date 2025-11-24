import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Clock, Users, ExternalLink } from "lucide-react";
import { useLocation } from "wouter";
import campaignLaunchImg from "@assets/generated_images/Campaign_Launch_Image_67ee22bc.png";
import attestationMasteryImg from "@assets/generated_images/Attestation_Mastery_Quest_Image_6ca48d9a.png";
import trustNetworkImg from "@assets/generated_images/Trust_Network_Campaign_Image_a68c295f.png";
import developerAdoptionImg from "@assets/generated_images/Developer_Adoption_Campaign_Image_f372ebd6.png";

export default function Campaigns() {
  const [, setLocation] = useLocation();

  const activeCampaigns = [
    {
      id: "intuition-core-campaign",
      title: "Intuition Core Experience",
      description: "Explore the revolutionary trust and reputation system built for the decentralized future. Join thousands of early adopters.",
      projectName: "Intuition",
      participants: 3200,
      // rewardPool: "100,000 tTRUST",
      startDate: "Sep 19, 2024",
      endDate: "Nov 19, 2024",
      status: "Active",
      category: "Platform Launch",
      heroImage: campaignLaunchImg
    },
    {
      id: "attestation-master-campaign", 
      title: "Attestation Master Challenge",
      description: "Master the art of creating meaningful attestations and build your reputation on Intuition.",
      projectName: "Intuition",
      participants: 1850,
      // rewardPool: "50,000 tTRUST",
      startDate: "Sep 25, 2024",
      endDate: "Oct 25, 2024",
      status: "Active",
      category: "Skill Building",
      heroImage: attestationMasteryImg
    },
    {
      id: "trust-network-campaign",
      title: "Trust Network Expansion",
      description: "Help expand the trust network by creating quality attestations and building meaningful connections.",
      projectName: "Intuition",
      participants: 950,
      // rewardPool: "25,000 tTRUST",
      startDate: "Oct 5, 2024",
      endDate: "Nov 5, 2024",
      status: "Active",
      category: "Network Growth",
      heroImage: trustNetworkImg
    }
  ];

  const upcomingCampaigns = [
    {
      id: "ecosystem-builder-campaign",
      title: "Ecosystem Builder Program",
      description: "Join the next phase of Intuition's ecosystem development. Help shape the future of decentralized trust.",
      projectName: "Intuition",
      participants: 0,
      // rewardPool: "200,000 tTRUST",
      startDate: "Dec 1, 2024",
      endDate: "Feb 1, 2025",
      status: "Coming Soon",
      category: "Ecosystem",
      heroImage: developerAdoptionImg
    }
  ];

  const renderCampaignCard = (campaign: any) => (
    <Card key={campaign.id} className="overflow-hidden hover-elevate group" data-testid={`campaign-${campaign.id}`}>
      {/* Hero Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={campaign.heroImage} 
          alt={campaign.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Status Badge */}
        <div className="absolute top-4 right-4">
          <Badge 
            className={
              campaign.status === "Active" 
                ? "bg-green-500/10 text-green-500 border-green-500/30"
                : "bg-blue-500/10 text-blue-500 border-blue-500/30"
            }
          >
            {campaign.status}
          </Badge>
        </div>
        
        {/* Category */}
        <div className="absolute top-4 left-4">
          <div className="text-sm text-white/80 font-medium">{campaign.category}</div>
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{campaign.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{campaign.description}</p>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Project:</span>
            <span className="font-medium">{campaign.projectName}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Participants:</span>
            <span className="font-medium">{campaign.participants.toLocaleString()}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Duration:</span>
            <span className="font-medium">{campaign.startDate} - {campaign.endDate}</span>
          </div>
        </div>

        <Button 
          className="w-full" 
          disabled={campaign.status !== "Active"}
          onClick={() => campaign.status === "Active" && setLocation(`/campaign/${campaign.id}`)}
          data-testid={`button-join-${campaign.id}`}
        >
          {campaign.status === "Active" ? (
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

  return (
    <div className="min-h-screen bg-background overflow-auto p-6" data-testid="campaigns-page">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Campaigns</h1>
          <p className="text-muted-foreground">
            Join unique project campaigns and contribute to the growth of the NEXURA ecosystem
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeCampaigns.map((campaign, index) => (
              <div key={`active-${index}`} className="transform-wrapper" style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}>
                {renderCampaignCard(campaign)}
              </div>
            ))}
          </div>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingCampaigns.map((campaign, index) => (
              <div key={`upcoming-${index}`} className="transform-wrapper" style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}>
                {renderCampaignCard(campaign)}
              </div>
            ))}
          </div>
        </div>

        {/* Information Box */}
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <Users className="w-6 h-6 text-primary mt-1" />
              <div>
                <h3 className="font-semibold text-foreground mb-2">What are Campaigns?</h3>
                <p className="text-sm text-muted-foreground">
                  Campaigns are unique, project-specific initiatives that allow you to contribute to ecosystem growth. 
                  Unlike daily quests, campaigns have specific durations, larger reward pools, and focus on meaningful 
                  contributions to the NEXURA ecosystem and partner projects.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}