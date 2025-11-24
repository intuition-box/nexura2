import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

// Level achievement data
const levelAchievementsInitial = [
  { level: 5, xpRequired: 100, color: "#8b5cf6", unlocked: true },
  { level: 10, xpRequired: 200, color: "#6b7280", unlocked: false },
  { level: 20, xpRequired: 400, color: "#6b7280", unlocked: false },
  { level: 30, xpRequired: 600, color: "#8b1538", unlocked: false },
  { level: 40, xpRequired: 800, color: "#6b7280", unlocked: false },
  { level: 50, xpRequired: 1000, color: "#6b7280", unlocked: false },
];

export default function Achievements() {
  const [userXp, setUserXp] = useState(100); // Mock user XP
  const [levelAchievements, setLevelAchievements] = useState(levelAchievementsInitial);

  // Determine next level to mint (first level whose XP is full but not unlocked)
  const nextLevelToMint = levelAchievements.find(
    (l) => userXp >= l.xpRequired && !l.unlocked
  );

  const handleMint = (level: number) => {
    console.log(`Mint reward for Level ${level}`);
    
    // Unlock the level
    setLevelAchievements((prev) =>
      prev.map((l) => (l.level === level ? { ...l, unlocked: true } : l))
    );

    // Optionally: reset XP for next level (or keep XP as is if accumulating)
    // For example, XP rolls over to next level:
    const completedLevel = levelAchievements.find((l) => l.level === level);
    if (completedLevel) {
      const excessXp = userXp - completedLevel.xpRequired;
      setUserXp(excessXp); // roll over XP to next level
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-auto p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Levels</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {levelAchievements.map((achievement) => {
            const progress = Math.min((userXp / achievement.xpRequired) * 100, 100);
            const isUnlocked = achievement.unlocked;
            const canMint = nextLevelToMint?.level === achievement.level;

            return (
              <Card
                key={achievement.level}
                className={`relative overflow-hidden transition-all hover-elevate ${
                  isUnlocked ? "border-primary/50 bg-primary/5" : "border-border"
                }`}
              >
                {/* Mint Button */}
                {canMint && (
                  <button
                    className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-lg text-xs font-semibold hover:bg-green-600 z-10"
                    onClick={() => handleMint(achievement.level)}
                  >
                    Mint
                  </button>
                )}

                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg"
                      style={{
                        backgroundColor: isUnlocked ? achievement.color : "#6b7280",
                      }}
                    >
                      {achievement.level}
                    </div>

                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {Math.floor(progress)}%
                      </div>
                      {isUnlocked && (
                        <Badge className="bg-green-500 mt-1">Unlocked</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-bold text-lg">Level {achievement.level}</h3>
                    <p className="text-sm text-muted-foreground">
                      Reach Level {achievement.level} by earning XP
                    </p>
                  </div>

                  <div className="mt-4 space-y-2">
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
                        "--progress-background": isUnlocked
                          ? achievement.color
                          : "#6b7280",
                      } as React.CSSProperties}
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
