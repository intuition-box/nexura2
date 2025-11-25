import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "lucide-react";
import { Link } from "wouter";

// User Analytics Data
const userAnalytics = {
  xp: 175,
  level: 8,
  badges: 3,
  questsCompleted: 12,
  trustEarned: 6.0
};

// Updated level achievements with new titles (Level 1–10)
const levelAchievementsInitial = [
  { level: 1, title: "Trail Initiate", xpRequired: 100, color: "#8b5cf6", unlocked: true },
  { level: 2, title: "Pathfinder", xpRequired: 300, color: "#6b7280", unlocked: false },
  { level: 3, title: "Scout of Lore", xpRequired: 600, color: "#6b7280", unlocked: false },
  { level: 4, title: "Relic Runner", xpRequired: 1000, color: "#6b7280", unlocked: false },
  { level: 5, title: "Rune Raider", xpRequired: 1500, color: "#6b7280", unlocked: false },
  { level: 6, title: "Vault Sever", xpRequired: 2100, color: "#6b7280", unlocked: false },
  { level: 7, title: "Crypt Diver", xpRequired: 2800, color: "#6b7280", unlocked: false },
  { level: 8, title: "Temple Warden", xpRequired: 3600, color: "#6b7280", unlocked: false },
  { level: 9, title: "Relic Master", xpRequired: 4500, color: "#6b7280", unlocked: false },
  { level: 10, title: "Nexon Vanguard", xpRequired: 5500, color: "#6b7280", unlocked: false }
];

export default function Profile() {
  const [userData] = useState(() => {
    const saved = localStorage.getItem("user_profile");
    return saved
      ? JSON.parse(saved)
      : {
        username: "0xD524...9779",
        displayName: "0xD524...9779",
        joinedDate: "Nov 2024",
      };
  });


  const [userXp, setUserXp] = useState(100);
  const [levelAchievements, setLevelAchievements] = useState(levelAchievementsInitial);

  const nextLevelToMint = levelAchievements.find(
    (l) => userXp >= l.xpRequired && !l.unlocked
  );

  const handleMint = (level) => {
    setLevelAchievements((prev) =>
      prev.map((l) => (l.level === level ? { ...l, unlocked: true } : l))
    );

    const completedLevel = levelAchievements.find((l) => l.level === level);
    if (completedLevel) {
      const excessXp = userXp - completedLevel.xpRequired;
      setUserXp(excessXp);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-auto p-6">
      <div className="max-w-5xl mx-auto space-y-10">

        {/* ---------------------------- PROFILE HEADER ---------------------------- */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">My Profile</h1>
          <Link href="/profile/edit">
            <Button>Edit Profile</Button>
          </Link>
        </div>

        <Card className="relative overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-start space-x-6">
              <Avatar className="w-32 h-32 border-4 border-background">
                <AvatarImage src="" />
                <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-green-500 via-blue-500 to-red-500 text-white">
                  {userData.displayName.charAt(0)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <h2 className="text-2xl font-bold">{userData.displayName}</h2>

                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  Joined {userData.joinedDate}
                </div>
              </div>

              <div className="text-right">
                <div className="text-sm text-muted-foreground">User ID</div>
                <div className="text-sm font-mono">{userData.username}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ---------------------------- USER ANALYTICS ---------------------------- */}
        <section>
          <h2 className="text-2xl font-bold mb-4">User Analytics</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Total XP</p><p className="text-2xl font-bold">{userAnalytics.xp}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Level</p><p className="text-2xl font-bold">{userAnalytics.level}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Badges</p><p className="text-2xl font-bold">{userAnalytics.badges}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">Quests Completed</p><p className="text-2xl font-bold">{userAnalytics.questsCompleted}</p></CardContent></Card>
            <Card><CardContent className="p-6"><p className="text-sm text-muted-foreground">TRUST Earned</p><p className="text-2xl font-bold">{userAnalytics.trustEarned}</p></CardContent></Card>
          </div>
        </section>

        {/* ---------------------------- ACHIEVEMENTS / LEVELS ---------------------------- */}
        <section>
          <h2 className="text-2xl font-bold mb-4">Achievements</h2>

          <div className="flex flex-col gap-6">
            {levelAchievements.map((achievement) => {
              const progress = Math.min((userXp / achievement.xpRequired) * 100, 100);
              const isUnlocked = achievement.unlocked;
              const canMint = nextLevelToMint?.level === achievement.level;

              return (
                <Card
                  key={achievement.level}
                  className={`${isUnlocked ? "border-primary/50 bg-primary/5" : ""}`}
                >
                  <CardContent className="p-6 relative">
                    {canMint && (
                      <button
                        onClick={() => handleMint(achievement.level)}
                        className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-green-600"
                      >
                        Mint
                      </button>
                    )}

                    <div className="flex items-center justify-between mb-4">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: isUnlocked ? achievement.color : "#6b7280" }}
                      >
                        {achievement.level}
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">{Math.floor(progress)}%</p>
                        {isUnlocked && <Badge className="bg-green-500 mt-1">Unlocked</Badge>}
                      </div>
                    </div>

                    <h3 className="font-bold text-lg mb-1">{achievement.title}</h3>

                    <p className="text-sm text-muted-foreground mb-4">
                      Complete {achievement.title} by earning {achievement.xpRequired} XP
                    </p>

                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span>
                          {Math.min(userXp, achievement.xpRequired)} / {achievement.xpRequired}
                        </span>
                      </div>

                      <Progress
                        value={progress}
                        className="h-2"
                        style={{
                          "--progress-background": isUnlocked ? achievement.color : "#6b7280",
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

      </div>
    </div>
  );
}
