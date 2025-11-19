import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Target, Star } from "lucide-react";
import { useLocation } from "wouter";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";

// Import protocol logos
import intudexLogo from "@assets/image_1758731610569.png";
import intuitionPortalLogo from "@assets/image_1758731619825.png";
import trustSwapLogo from "@assets/image_1758731629668.png";
import memkopadLogo from "@assets/image_1758731643646.png";
import diceGameLogo from "@assets/image_1758731655425.png";
import gazeBreakerLogo from "@assets/image_1758731666896.png";
import intuitParkLogo from "@assets/image_1758731677908.png";
import twentyFortyEightLogo from "@assets/image_1758731690209.png";
import tetrisLogo from "@assets/Copilot_20250924_173907_1758731966019.png";
import tnsLogo from "@assets/image_1758732361346.png";
// New protocol logos
import intuitionMemeLogo from "@assets/image_1758733760040.png";
import oracleLendLogo from "@assets/image_1758734045558.png";
import intuitionBetsLogo from "@assets/image_1758734662331.png";
import trustEscrowLogo from "@assets/image_1758734736451.png";
import intuitionOracleLogo from "@assets/image_1758735356814.png";
import intuitionTempleLogo from "@assets/image_1758735571330.png";

interface Dapp {
  id: string;
  name: string;
  description: string;
  category: string;
  logo: string;
  questReward: string;
  estimatedTime: string;
  isCompleted?: boolean;
  isClaimed?: boolean;
  websiteUrl: string;
}

export default function EcosystemDapps() {
  const [, setLocation] = useLocation();
  const [claimedDapps, setClaimedDapps] = useState<Set<string>>(new Set());

  const dapps: Dapp[] = [
    // Priority order: intuition portal, oracle lend, intudex, 3,3 dice game, trust name service
    {
      id: "intuition-portal",
      name: "INTUITION PORTAL",
      description: "Stake and make claims. Buy into claims bonding curves to support or negate a claim",
      category: "Portal",
      logo: intuitionPortalLogo,
      questReward: "100 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://portal.intuition.systems"
    },
    {
      id: "oracle-lend",
      name: "ORACLELEND",
      description: "A decentralized lending protocol and DEX for borrowing and swapping tokens on Intuition Testnet",
      category: "Lending Protocols",
      logo: oracleLendLogo,
      questReward: "85 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://oraclelend.intuition.box"
    },
    {
      id: "intudex",
      name: "INTUDEX",
      description: "Swap and stake $INTUIT token seamlessly",
      category: "DeFi",
      logo: intudexLogo,
      questReward: "75 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://dex.intuition.box"
    },
    {
      id: "oracle-lend-defi",
      name: "ORACLE LEND",
      description: "A decentralized lending protocol and DEX for borrowing and swaping tokens on Intuition Testnet",
      category: "DeFi",
      logo: oracleLendLogo,
      questReward: "85 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://oraclelend.xyz"
    },
    {
      id: "dice-game",
      name: "DICE GAME",
      description: "Fair dice game on blockchain",
      category: "Gaming",
      logo: diceGameLogo,
      questReward: "50 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://dice.intuition.box"
    },
    // Trust Name Service removed per request (replaced by Gaze Breaker)
    // Additional protocols
    {
      id: "trustswap",
      name: "TRUSTSWAP",
      description: "Swap and stake different tokens seamlessly",
      category: "DeFi",
      logo: trustSwapLogo,
      questReward: "70 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://trustswap.intuition.box"
    },
    {
      id: "trust-escrow",
      name: "TrustEscrow",
      description: "A secure, decentralized escrow platform built on TRUST",
      category: "DeFi",
      logo: trustEscrowLogo,
      questReward: "70 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://trustescrow.app"
    },
    {
      id: "memkopad",
      name: "Memkopad",
      description: "Discover, create and mint NFTs",
      category: "NFT",
      logo: memkopadLogo,
      questReward: "60 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://memkopad.app"
    },
    {
      id: "gaze-breaker",
      name: "GAZE BREAKER",
      description: "Defeat the eyes of the institution. An eerie, sci-fi shmup",
      category: "Gaming",
      logo: gazeBreakerLogo,
      questReward: "80 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://gaze-breaker.vercel.app"
    },
    {
      id: "intuitpark",
      name: "IntuitPark",
      description: "Play prediction games and minigames to earn INTUIT tokens on the Intuition Network",
      category: "Gaming",
      logo: intuitParkLogo,
      questReward: "90 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://intuitpark.game"
    },
    {
      id: "2048",
      name: "2048",
      description: "Join tiles to reach 2048!",
      category: "Gaming",
      logo: twentyFortyEightLogo,
      questReward: "45 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://2048.intuition.game"
    },
    {
      id: "tetris",
      name: "Tetris",
      description: "Play Tetris, earn TRUST!",
      category: "Gaming",
      logo: tetrisLogo,
      questReward: "55 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://tetris.intuition.game"
    },
    {
      id: "intuition-meme",
      name: "INTUITION MEME",
      description: "Launch Your Meme Token: Fair launch meme tokens with bonding curves on Intuition Testnet",
      category: "Launchpads",
      logo: intuitionMemeLogo,
      questReward: "90 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://intuition-meme.vercel.app"
    },
    {
      id: "intuition-bets",
      name: "Intuition BETs",
      description: "Place your bets and test your intuition",
      category: "Prediction Markets",
      logo: intuitionBetsLogo,
      questReward: "80 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://bets.intuition.systems"
    },
    {
      id: "intuition-oracle",
      name: "The Intuition Oracle",
      description: "Discover Your On-Chain Prophecy",
      category: "Social",
      logo: intuitionOracleLogo,
      questReward: "70 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://oracle.intuition.systems"
    },
    {
      id: "intuition-temple",
      name: "INTUITION TEMPLE",
      description: "pray",
      category: "Social",
      logo: intuitionTempleLogo,
      questReward: "60 XP",
      estimatedTime: "15 min",
      isCompleted: false,
      isClaimed: false,
      websiteUrl: "https://temple.intuition.systems"
    }
  ];

  const handleExploreClick = (dapp: Dapp, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }
    // Open the dapp's website in a new tab
    window.open(dapp.websiteUrl, '_blank', 'noopener,noreferrer');
  };

  const handleClaimClick = (dapp: Dapp, event: React.MouseEvent) => {
    event.stopPropagation();
    // Add to claimed dapps
    setClaimedDapps(prev => {
      const newSet = new Set(prev);
      newSet.add(dapp.id);
      return newSet;
    });
    // Here you would also integrate with backend/blockchain to record the claim
  };

  const handleCardClick = (dapp: Dapp) => {
    // Clicking anywhere on the card opens the website
    handleExploreClick(dapp);
  };


  const getCategoryColor = (category: string) => {
    switch (category) {
      case "Portal":
        return "bg-purple-500/10 text-purple-600";
      case "DeFi":
        return "bg-blue-500/10 text-blue-600";
      case "NFT":
        return "bg-pink-500/10 text-pink-600";
      case "Gaming":
        return "bg-green-500/10 text-green-600";
      case "Domain Name":
        return "bg-cyan-500/10 text-cyan-600";
      case "Social":
        return "bg-indigo-500/10 text-indigo-600";
      case "Launchpads":
        return "bg-orange-500/10 text-orange-600";
      case "Lending Protocols":
        return "bg-emerald-500/10 text-emerald-600";
      case "Prediction Markets":
        return "bg-red-500/10 text-red-600";
      default:
        return "bg-gray-500/10 text-gray-600";
    }
  };

  const categories = ["All", "Portal", "DeFi", "NFT", "Gaming", "Domain Name", "Social", "Launchpads", "Lending Protocols", "Prediction Markets"];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const filteredDapps = selectedCategory === "All" 
    ? dapps 
    : dapps.filter(dapp => dapp.category === selectedCategory);

  return (
    <div className="min-h-screen bg-background overflow-auto p-6" data-testid="ecosystem-dapps-page">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Ecosystem Dapps</h1>
          <p className="text-muted-foreground">
            Explore popular dapps in the ecosystem and complete one-time quests to earn rewards
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              data-testid={`category-${category.toLowerCase()}`}
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Dapps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredDapps.map((dapp) => (
            <Card 
              key={dapp.id} 
              className="cursor-pointer hover-elevate active-elevate-2 transition-all duration-200 relative flex flex-col min-h-[300px]"
              onClick={() => handleCardClick(dapp)}
              data-testid={`dapp-card-${dapp.id}`}
            >
              {dapp.isCompleted && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-green-500 text-white rounded-full p-1">
                    <Star className="w-4 h-4 fill-current" />
                  </div>
                </div>
              )}
              
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                    <Popover>
                      <PopoverTrigger asChild>
                        <div className="w-12 h-12 flex items-center justify-center">
                          {typeof dapp.logo === 'string' && dapp.logo.startsWith('/') ? (
                            <img src={dapp.logo} alt={dapp.name} className="w-8 h-8 object-contain transition-transform transform hover:scale-105" />
                          ) : (
                            <img src={dapp.logo} alt={dapp.name} className="w-8 h-8 object-contain transition-transform transform hover:scale-105" />
                          )}
                        </div>
                      </PopoverTrigger>
                      <PopoverContent side="bottom" align="center" className="w-56">
                        <div className="text-sm text-muted-foreground mb-2">Visit</div>
                        <div className="break-words text-sm mb-3 text-foreground font-medium">{dapp.websiteUrl}</div>
                        <div className="flex gap-2">
                          <Button variant="default" className="flex-1" onClick={(e) => { e.stopPropagation(); handleExploreClick(dapp); }}>
                            Open
                            <ExternalLink className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold">{dapp.name}</CardTitle>
                    <Badge className={getCategoryColor(dapp.category)} variant="secondary">
                      {dapp.category}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="flex flex-col h-full">
                <div className="flex-1 mb-4">
                  <p className="text-sm text-muted-foreground">{dapp.description}</p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Est. Time:</span>
                    <span className="text-xs font-medium">{dapp.estimatedTime}</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Reward:</span>
                    <span className="text-xs font-bold text-primary">{dapp.questReward}</span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-auto">
                  <Button 
                    className="flex-1"
                    variant="outline"
                    onClick={(e) => handleExploreClick(dapp, e)}
                    data-testid={`explore-${dapp.id}`}
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Explore
                  </Button>
                  
                  {!claimedDapps.has(dapp.id) && (
                    <Button 
                      className="flex-1"
                      variant="quest"
                      onClick={(e) => handleClaimClick(dapp, e)}
                      data-testid={`claim-${dapp.id}`}
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Claim
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredDapps.length === 0 && (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Dapps Found</h3>
            <p className="text-muted-foreground">
              Try selecting a different category to see more dapps
            </p>
          </div>
        )}
      </div>
    </div>
  );
}