import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Copy, Users, Star, Gift } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function Referrals() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  // ---- LOCAL STATIC DATA (NO API) ----
  const [referralStats, setReferralStats] = useState({
    totalReferrals: 5,
    totalEarned: 3.5,
    claimableRewards: 1.2,
    referralLink: "https://nexura.app/ref/abc123",
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralStats.referralLink);
    setCopied(true);
    toast({
      title: "Link copied!",
      description: "Share this link to earn TRUST rewards",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClaimRewards = () => {
    // Fake claim – just set claimableRewards to 0
    setReferralStats(prev => ({ ...prev, claimableRewards: 0 }));
    toast({
      title: "Rewards claimed!",
      description: "Your rewards have been added to your account.",
    });
  };

  // Calculate milestone logic
  const nextMilestone =
    referralStats.totalReferrals >= 10 ? 20 :
      referralStats.totalReferrals >= 3 ? 10 :
        3;

  const progress = (referralStats.totalReferrals / nextMilestone) * 100;

  return (
    <div className="min-h-screen bg-background overflow-auto p-6" data-testid="referrals-page">
      <div className="max-w-4xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-2">Referral Program</h1>
          <p className="text-muted-foreground">
            Invite friends to NEXURA and earn TRUST rewards together
          </p>
        </div>

        {/* Referral Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Total Referrals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Users className="w-5 h-5 text-blue-500" />
                <div className="text-2xl font-bold">{referralStats.totalReferrals}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Total Earned</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5" />
                <div className="text-2xl font-bold">{referralStats.totalEarned} TRUST</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm text-muted-foreground">Claimable</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-2">
                <Gift className="w-5 h-5" />
                <div className="text-2xl font-bold">{referralStats.claimableRewards} TRUST</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Referral Link */}
        <Card>
          <CardHeader>
            <CardTitle>Your Referral Link</CardTitle>
            <p className="text-sm text-muted-foreground">
              Share this link with friends to start earning rewards
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-2">
              <Input value={referralStats.referralLink} readOnly className="flex-1" />
              <Button onClick={handleCopyLink} variant="outline">
                <Copy className="w-4 h-4 mr-2" />
                {copied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reward Milestones */}
        <Card>
          <CardHeader>
            <CardTitle>Reward Milestones</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  Progress to {nextMilestone} referrals
                </span>
                <span>{referralStats.totalReferrals} / {nextMilestone}</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Milestones */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-muted/20 rounded-lg p-4">
                <p className="font-semibold">3 Referrals</p>
                <p className="text-sm text-muted-foreground">
                  {referralStats.totalReferrals >= 3 ? "✅ Completed" : "Get your first reward"}
                </p>
              </div>

              <div className="bg-muted/20 rounded-lg p-4">
                <p className="font-semibold">10 Referrals</p>
                <p className="text-sm text-muted-foreground">
                  {referralStats.totalReferrals >= 10 ? "✅ Completed" : "Bonus reward tier"}
                </p>
              </div>
            </div>

            {/* Claim button */}
            {referralStats.claimableRewards > 0 && (
              <Button onClick={handleClaimRewards} className="w-full">
                <Gift className="w-4 h-4 mr-2" />
                Claim {referralStats.claimableRewards} TRUST
              </Button>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
