import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart2, Activity, Trophy, Calendar, Gift } from "lucide-react";

export default function Analytics() {
  const [view, setView] = useState<"user" | "platform">("user");

  // Mock data - in a real app, this would come from API
  const userData = {
    xp: 175,
    level: 8,
    badges: 3, // Nexons
    questsCompleted: 12,
    rewardsEarned: 42,
    tTrustEarned: 6.0
  };

  const platformData = {
    totalUsers: 245,
    totalQuests: 110,
    weeklyActiveUsers: 75,
    totalXps: 4300,
    totalRewards: 512,
    totalTTrust: 120.5,
    totalBadges: 540
  };

  return (
    <div className="min-h-screen bg-background overflow-auto p-6" data-testid="analytics-page">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
  <BarChart2 className="w-8 h-8 text-primary" />
</div>

          <h1 className="text-3xl font-bold text-foreground mb-4">Analytics</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Visual insights and performance metrics from across the Intuition ecosystem.
          </p>
        </div>

        {/* Toggle Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <Button
            variant={view === "user" ? "default" : "outline"}
            onClick={() => setView("user")}
          >
            User Analytics
          </Button>
          <Button
            variant={view === "platform" ? "default" : "outline"}
            onClick={() => setView("platform")}
          >
            Platform Analytics
          </Button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {view === "user" ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total XP</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userData.xp}</div>
                  <p className="text-xs text-muted-foreground">XP earned</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Level</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userData.level}</div>
                  <p className="text-xs text-muted-foreground">Current Level</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Badges</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userData.badges}</div>
                  <p className="text-xs text-muted-foreground">Nexons earned</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Quests Completed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userData.questsCompleted}</div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">tTRUST Earned</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{userData.tTrustEarned}</div>
                  <p className="text-xs text-muted-foreground">tTRUST earned</p>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformData.totalUsers}</div>
                  <p className="text-xs text-muted-foreground">All registered users</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Quests</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformData.totalQuests}</div>
                  <p className="text-xs text-muted-foreground">Quests created</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Weekly Active Users</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformData.weeklyActiveUsers}</div>
                  <p className="text-xs text-muted-foreground">Active this week</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total XP</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformData.totalXps}</div>
                  <p className="text-xs text-muted-foreground">Total XP earned</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total tTRUST</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformData.totalTTrust}</div>
                  <p className="text-xs text-muted-foreground">tTRUST distributed</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Total Badges</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformData.totalBadges}</div>
                  <p className="text-xs text-muted-foreground">Badges distributed</p>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
