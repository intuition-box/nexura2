import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Copy, Users, Star, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { emitSessionChange } from "@/lib/session";
import { useAuth } from "@/lib/auth";
import type { ReferralStats } from "@shared/schema";

export default function Referrals() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { user } = useAuth();
  const userId = user ? (user.id ?? user._id ?? user.userId ?? null) : null;

  const { data: referralStats, isLoading } = useQuery<ReferralStats>({
    queryKey: userId ? ['/api/referrals/stats', userId] : ['referrals', 'none'],
    enabled: Boolean(userId),
    queryFn: async () => {
      if (!userId) return null as unknown as ReferralStats;
      const res = await apiRequest("GET", `/api/referrals/stats/${userId}`);
      return res.json();
    },
  });

  // Note: Reward claiming functionality will be added later

  const handleCopyLink = () => {
    if (referralStats?.referralLink) {
      navigator.clipboard.writeText(referralStats.referralLink);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Share this link with friends",
      });
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Claim functionality will be added later

  // Calculate progress to next milestone
  const nextMilestone = !referralStats ? 3 : 
    referralStats.totalReferrals >= 10 ? Math.ceil((referralStats.totalReferrals + 1) / 10) * 10 : 
    (referralStats.totalReferrals >= 3 ? 10 : 3);
  const progress = !referralStats ? 0 : (referralStats.totalReferrals / nextMilestone) * 100;

  if (!userId) {
    return (
      <div className="min-h-screen bg-background overflow-auto p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">No referral data available</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background overflow-auto p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading referral data...</p>
        </div>
      </div>
    );
  }

  if (!referralStats) {
    return (
      <div className="min-h-screen bg-background overflow-auto p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Unable to load referral data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background overflow-auto p-6" data-testid="referrals-page">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Referral Program</h1>
          <p className="text-muted-foreground">
            Invite friends to Nexura and grow together
          </p>
        </div>

        {/* Referral Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card data-testid="total-referrals">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Friends joined</p>
            </CardContent>
          </Card>

          <Card data-testid="active-referrals">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Friends joined</p>
            </CardContent>
          </Card>

          <Card data-testid="coming-soon">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Rewards</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Gift className="w-5 h-5 text-green-500" />
                <div className="text-2xl font-bold">Coming Soon</div>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Referral rewards</p>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card data-testid="referral-link-card">
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
            <p className="text-sm text-muted-foreground">
              Share this link with friends to start earning rewards
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input 
                value={referralStats.referralLink} 
                readOnly 
                className="flex-1"
                data-testid="input-referral-link"
              />
              <Button 
                onClick={handleCopyLink}
                variant="outline"
                data-testid="button-copy-link"
              >
                <Copy className="w-4 h-4 mr-2" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Referral Progress */}
        <Card data-testid="referral-progress">
          <CardHeader>
            <CardTitle>Referral Progress</CardTitle>
            <p className="text-sm text-muted-foreground">
              Track your referral milestones
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress to {nextMilestone} referrals</span>
                <span>{referralStats.totalReferrals} / {nextMilestone}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Milestone List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">3 Referrals</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Milestone 1</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {referralStats.totalReferrals >= 3 ? "✅ Completed" : "First milestone"}
                </p>
              </div>

              <div className="bg-muted/20 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">10 Referrals</span>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium">Milestone 2</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  {referralStats.totalReferrals >= 10 ? "✅ Completed" : "Bonus tier"}
                </p>
              </div>
            </div>

            <div className="text-center p-4 bg-muted/20 rounded-lg">
              <p className="text-sm text-muted-foreground">Rewards system coming soon</p>
            </div>
          </CardContent>
        </Card>

        {/* How it Works */}
        <Card data-testid="how-it-works">
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-xl font-bold text-blue-600 dark:text-blue-400">1</span>
                </div>
                <h4 className="font-semibold">Share Your Link</h4>
                <p className="text-sm text-muted-foreground">
                  Send your unique referral link to friends and family
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-xl font-bold text-green-600 dark:text-green-400">2</span>
                </div>
                <h4 className="font-semibold">They Join</h4>
                <p className="text-sm text-muted-foreground">
                  Your friends sign up and start their Nexura journey
                </p>
              </div>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-xl font-bold text-purple-600 dark:text-purple-400">3</span>
                </div>
                <h4 className="font-semibold">Grow Together</h4>
                <p className="text-sm text-muted-foreground">
                  Build your network and reach milestones together
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}