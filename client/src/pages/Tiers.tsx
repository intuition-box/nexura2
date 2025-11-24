import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle } from "lucide-react";

const TIER_LEVEL_RANGES = {
  enchanter: { min: 0, max: 5 },
  illuminated: { min: 5, max: 15 },
  conscious: { min: 15, max: 30 },
  oracle: { min: 30, max: 50 },
  templar: { min: 50, max: Infinity }
};

const TIER_COLORS = {
  enchanter: "#8b5cf6", // purple
  illuminated: "#10b981", // green
  conscious: "#3b82f6", // blue
  oracle: "#8b1538", // wine red
  templar: "#ef4444" // red
};

const tierData = [
  {
    key: "enchanter" as const,
    name: "Enchanter",
    description: "Begin your journey in the NEXURA realm",
    levelRange: "Level 0-5"
  },
  {
    key: "illuminated" as const,
    name: "Illuminated",
    description: "Expand your knowledge and earning potential",
    levelRange: "Level 5-15"
  },
  {
    key: "conscious" as const,
    name: "Conscious",
    description: "Achieve deeper understanding and greater rewards",
    levelRange: "Level 15-30"
  },
  {
    key: "oracle" as const,
    name: "Oracle",
    description: "Master-level knowledge and exceptional opportunities",
    levelRange: "Level 30-50"
  },
  {
    key: "templar" as const,
    name: "Templar",
    description: "The pinnacle of NEXURA mastery",
    levelRange: "Level 50+"
  }
];

export default function Tiers() {
  const [userLevel] = useState(8); // Mock user level
  
  const getUserTier = (level: number) => {
    if (level >= TIER_LEVEL_RANGES.templar.min) return "templar";
    if (level >= TIER_LEVEL_RANGES.oracle.min) return "oracle";
    if (level >= TIER_LEVEL_RANGES.conscious.min) return "conscious";
    if (level >= TIER_LEVEL_RANGES.illuminated.min) return "illuminated";
    return "enchanter";
  };

  const userTier = getUserTier(userLevel);

  return (
    <div className="min-h-screen bg-background overflow-auto p-6" data-testid="tiers-page">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-foreground">NEXURA Tiers</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Advance through five distinct tiers of mastery in the NEXURA ecosystem.
          </p>
        </div>

        {/* Current Tier Highlight */}
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="p-6 text-center">
            <Badge 
              className="text-white border-0 mb-2"
              style={{ backgroundColor: TIER_COLORS[userTier] }}
            >
              Your Current Tier
            </Badge>
            <h2 className="text-2xl font-bold mb-2">
              {tierData.find(t => t.key === userTier)?.name}
            </h2>
            <p className="text-muted-foreground">
              Level {userLevel} • {tierData.find(t => t.key === userTier)?.description}
            </p>
          </CardContent>
        </Card>

        {/* Tiers Grid */}
        <div className="space-y-6">
          {tierData.map((tier, index) => {
            const isCurrentTier = tier.key === userTier;
            const isUnlocked = userLevel >= TIER_LEVEL_RANGES[tier.key].min;
            const isNextTier = !isUnlocked && index === tierData.findIndex(t => t.key === userTier) + 1;

            return (
              <Card 
                key={tier.key}
                className={`relative overflow-hidden transition-all ${
                  isCurrentTier 
                    ? 'border-primary shadow-lg scale-[1.02]' 
                    : isUnlocked 
                      ? 'border-green-500/30 bg-green-500/5'
                      : isNextTier
                        ? 'border-orange-500/30 bg-orange-500/5'
                        : 'border-border'
                }`}
                data-testid={`tier-${tier.key}`}
              >
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    {/* Tier Icon */}
                    <div className="relative flex-shrink-0">
                      <div 
                        className="w-20 h-20 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg"
                        style={{ backgroundColor: TIER_COLORS[tier.key] }}
                      >
                        {tier.name[0]}
                      </div>
                      {isUnlocked && (
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Tier Info */}
                    <div className="flex-1 space-y-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-2xl font-bold">{tier.name}</h3>
                          <Badge variant="outline">{tier.levelRange}</Badge>
                          {isCurrentTier && (
                            <Badge className="bg-primary text-primary-foreground">Current</Badge>
                          )}
                          {isUnlocked && !isCurrentTier && (
                            <Badge className="bg-green-500 text-white">Unlocked</Badge>
                          )}
                          {isNextTier && (
                            <Badge className="bg-orange-500 text-white">Next Tier</Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground">{tier.description}</p>
                      </div>

                    </div>
                  </div>
                </CardContent>

                {/* Current tier highlight overlay */}
                {isCurrentTier && (
                  <div 
                    className="absolute inset-0 opacity-10 pointer-events-none"
                    style={{
                      background: `linear-gradient(135deg, ${TIER_COLORS[tier.key]}, transparent)`
                    }}
                  />
                )}
              </Card>
            );
          })}
        </div>

        {/* Progress to Next Tier */}
        {userTier !== "templar" && (
          <Card className="bg-muted/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-lg font-semibold mb-2">Progress to Next Tier</h3>
              <p className="text-muted-foreground">
                {TIER_LEVEL_RANGES[tierData.find(t => tierData.findIndex(tier => tier.key === t.key) === tierData.findIndex(tier => tier.key === userTier) + 1)?.key as keyof typeof TIER_LEVEL_RANGES]?.min - userLevel} more levels to reach{" "}
                {tierData.find(t => tierData.findIndex(tier => tier.key === t.key) === tierData.findIndex(tier => tier.key === userTier) + 1)?.name}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}