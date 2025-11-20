import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search } from "lucide-react";
import { useLocation } from "wouter";
import { queryClient } from "@/lib/queryClient";
import HeroCampaign from "@/components/HeroCampaign";
import QuestCard from "@/components/QuestCard";
import CampaignCard from "@/components/CampaignCard";

// Import generated images
import questHero1 from "@assets/generated_images/Web3_quest_hero_image_9eff8349.png";
import questHero2 from "@assets/generated_images/DeFi_staking_interface_99fa0ee4.png";
import questHero3 from "@assets/generated_images/Gaming_quest_interface_0f81d47c.png";
import gettingStartedImg from "@assets/generated_images/Getting_Started_Quest_Image_9a7ae50b.png";
import identityCreationImg from "@assets/generated_images/Identity_Creation_Quest_Image_7c214425.png";
import attestationMasteryImg from "@assets/generated_images/Attestation_Mastery_Quest_Image_6ca48d9a.png";
import campaignLaunchImg from "@assets/generated_images/Campaign_Launch_Image_67ee22bc.png";
import trustNetworkImg from "@assets/generated_images/Trust_Network_Campaign_Image_a68c295f.png";
import developerAdoptionImg from "@assets/generated_images/Developer_Adoption_Campaign_Image_f372ebd6.png";
// Using Intuition branding for all project logos

// Import user avatar images for trending claims
import avatar1 from "@assets/stock_images/professional_headsho_07f6e854.jpg";
import avatar2 from "@assets/stock_images/professional_headsho_fbbd0164.jpg";
import avatar3 from "@assets/stock_images/professional_headsho_9cd76fc2.jpg";
import avatar4 from "@assets/stock_images/professional_headsho_daa79957.jpg";
import avatar5 from "@assets/stock_images/professional_headsho_e503cf0f.jpg";
import avatar6 from "@assets/stock_images/professional_headsho_c3077801.jpg";

// Import protocol logos for trending dapps
import intuitionPortalLogo from "@assets/image_1758731619825.png";
import oracleLendLogo from "@assets/image_1758734045558.png";
import intudexLogo from "@assets/image_1758731610569.png";
import diceGameLogo from "@assets/image_1758731655425.png";
import tnsLogo from "@assets/image_1758732361346.png";
import trustSwapLogo from "@assets/image_1758731629668.png";

export default function Discover() {
  const [activeTab, setActiveTab] = useState("all");
  const [refreshCountdown, setRefreshCountdown] = useState(0);
  const [, setLocation] = useLocation();

  // Initialize and manage 24-hour refresh
  useEffect(() => {
    const initializeRefreshTimer = () => {
      const lastRefresh = localStorage.getItem('lastTaskRefresh');
      const now = Date.now();
      
      if (!lastRefresh) {
        // First time - set the refresh time to now
        localStorage.setItem('lastTaskRefresh', now.toString());
        setRefreshCountdown(86400); // 24 hours
      } else {
        // Calculate remaining time
        const timeSinceRefresh = Math.floor((now - parseInt(lastRefresh)) / 1000);
        const remainingTime = Math.max(0, 86400 - timeSinceRefresh);
        setRefreshCountdown(remainingTime);
      }
    };

    initializeRefreshTimer();

    const timer = setInterval(() => {
      setRefreshCountdown(prev => {
        if (prev <= 1) {
          // Tasks refresh - invalidate all queries and reset timer
          queryClient.invalidateQueries();
          const now = Date.now();
          localStorage.setItem('lastTaskRefresh', now.toString());
          console.log("Tasks refreshed! Data cache invalidated.");
          return 86400; // Reset to 24 hours
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Fetch campaigns and quests from the backend. If none are available,
  // do not render hardcoded demo content.
  const { data: campaignsData } = useQuery({
    queryKey: ["/campaigns"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/campaigns");
      return res.json();
    },
    retry: false,
  });

  const { data: questsData } = useQuery({
    queryKey: ["/quests"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/quests");
      return res.json();
    },
    retry: false,
  });

  const trendingDapps = [
    { name: "Intuition Portal", logo: intuitionPortalLogo, category: "Portal" },
    { name: "Oracle Lend", logo: oracleLendLogo, category: "Lending" },
    { name: "Intudex", logo: intudexLogo, category: "DeFi" },
    { name: "3,3 Dice Game", logo: diceGameLogo, category: "Gaming" },
    { name: "Trust Name Service", logo: tnsLogo, category: "Domain" },
    { name: "TrustSwap", logo: trustSwapLogo, category: "DeFi" }
  ];

  const trendingClaims = [
    {
      author: "CryptoExplorer",
      avatar: avatar1,
      content: "Intuition's reputation system will revolutionize how we build trust in Web3. The attestation mechanism creates verifiable credentials that span across multiple protocols.",
      timeAgo: "2 hours ago",
      attestations: 47,
      category: "Tech Innovation",
      categoryColor: "bg-blue-500"
    },
    {
      author: "DeFiAnalyst", 
      avatar: avatar2,
      content: "The integration between Intuition and major DeFi protocols is creating new opportunities for reputation-based lending and yield farming strategies.",
      timeAgo: "4 hours ago",
      attestations: 32,
      category: "DeFi Analysis",
      categoryColor: "bg-green-500"
    },
    {
      author: "Web3Builder",
      avatar: avatar3,
      content: "Building on Intuition's infrastructure has been game-changing for our dApp. The trust score integration reduced user onboarding friction by 60%.",
      timeAgo: "6 hours ago",
      attestations: 28,
      category: "Developer Experience",
      categoryColor: "bg-purple-500"
    },
    {
      author: "BlockchainResearcher",
      avatar: avatar4,
      content: "Intuition's approach to decentralized identity verification addresses critical gaps in current Web3 infrastructure. This could be the missing piece for mainstream adoption.",
      timeAgo: "8 hours ago",
      attestations: 56,
      category: "Research Insights",
      categoryColor: "bg-orange-500"
    },
    {
      author: "CommunityLead",
      avatar: avatar5,
  content: "The Nexura platform integration with Intuition creates a seamless experience for both quest completion and reputation building. Great UX design!",
      timeAgo: "10 hours ago",
      attestations: 19,
      category: "User Experience",
      categoryColor: "bg-pink-500"
    },
    {
      author: "TrustExpert",
      avatar: avatar6,
      content: "Seeing real-world applications of Intuition's trust protocols in various ecosystems. The network effects are starting to compound beautifully.",
      timeAgo: "12 hours ago",
      attestations: 41,
      category: "Network Effects",
      categoryColor: "bg-cyan-500"
    }
  ];


  return (
    <div className="min-h-screen bg-black text-white overflow-auto relative" data-testid="discover-page">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-blue-600/20 rounded-full blur-[120px] animate-blob mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] bg-purple-600/20 rounded-full blur-[120px] animate-blob animation-delay-2000 mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] w-[45vw] h-[45vw] bg-indigo-600/20 rounded-full blur-[120px] animate-blob animation-delay-4000 mix-blend-screen" />
      </div>

      {/* Top Bar */}
      <div className="relative z-10 flex items-center justify-between p-4 border-b border-white/10 glass">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="text"
              placeholder="Search"
              className="pl-10 pr-4 py-2 glass rounded-full border-0 focus:ring-2 focus:ring-primary/20 w-64 text-white placeholder:text-white/40"
              data-testid="input-search"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 relative z-10">
  {/* Hero Campaign Section */}
  <HeroCampaign campaigns={campaignsData?.campaigns ?? []} />

        {/* Tab Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-fit grid-cols-1 bg-muted/50">
            <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-12">
            {/* Trending Campaigns */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">Trending Campaigns</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLocation('/campaigns')}
                  data-testid="button-show-all-trending-campaigns"
                >
                  Show all
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.isArray(campaignsData?.campaigns) && campaignsData.campaigns.length > 0 ? (
                  campaignsData.campaigns.map((campaign: any, index: number) => (
                    <div key={`campaign-${index}`} className="transform-wrapper" style={{ transform: 'scale(0.85)', transformOrigin: 'top left' }}>
                      <CampaignCard {...campaign} from="explore" />
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">No campaigns available.</div>
                )}
              </div>
            </section>

            {/* Trending Dapps */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">Trending Dapps</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setLocation('/ecosystem-dapps')}
                  data-testid="button-show-all-trending-dapps"
                >
                  Show all
                </Button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {trendingDapps.map((dapp, index) => (
                  <div 
                    key={`dapp-${index}`} 
                    className="group flex flex-col items-center p-4 rounded-2xl glass glass-hover transition-all cursor-pointer"
                    onClick={() => setLocation('/ecosystem-dapps')}
                    data-testid={`trending-dapp-${dapp.name.toLowerCase()}`}
                  >
                    <div className="w-12 h-12 mb-3 rounded-full overflow-hidden bg-white/5 flex items-center justify-center">
                      {typeof dapp.logo === 'string' && dapp.logo.startsWith('/') ? (
                        <img src={dapp.logo} alt={dapp.name} className="w-full h-full object-cover" />
                      ) : (
                        <img src={dapp.logo} alt={dapp.name} className="w-full h-full object-cover" />
                      )}
                    </div>
                    <span className="text-sm font-medium text-white group-hover:text-blue-400 transition-colors text-center">
                      {dapp.name}
                    </span>
                    <div className="text-xs text-white/50 mt-1">
                      {dapp.category}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Trending Claims in Intuition Portal */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-4xl font-bold tracking-tight text-white">Trending Claims in Intuition Portal</h2>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  data-testid="button-show-all-trending-claims"
                >
                  Show all
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingClaims.map((claim, index) => (
                  <div 
                    key={`claim-${index}`} 
                    className="glass glass-hover rounded-3xl p-6 cursor-pointer transition-all duration-300 relative overflow-hidden"
                    data-testid={`trending-claim-${index}`}
                  >
                    {/* Background Pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                    
                    {/* Content */}
                    <div className="relative z-10">
                      {/* Category Badge */}
                      <div className="flex justify-between items-start mb-4">
                        <div className={`${claim.categoryColor} text-white text-xs font-medium px-3 py-1 rounded-full`}>
                          {claim.category}
                        </div>
                      </div>
                      
                      {/* User Avatar Area */}
                      <div className="flex justify-center mb-4">
                        <div className="relative">
                          {/* Hexagonal border */}
                          <div className="w-20 h-20 bg-gray-700 border-2 border-gray-600 transform rotate-45 rounded-lg flex items-center justify-center overflow-hidden">
                            <div className="w-14 h-14 transform -rotate-45 rounded-lg overflow-hidden">
                              <img 
                                src={claim.avatar} 
                                alt={`${claim.author} avatar`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Author and Time */}
                      <div className="text-center mb-3">
                        <div className="text-sm font-semibold text-white mb-1">{claim.author}</div>
                        <div className="text-xs text-gray-400">{claim.timeAgo}</div>
                      </div>
                      
                      {/* Claim Content */}
                      <div className="mb-4">
                        <p className="text-sm text-white/70 leading-relaxed line-clamp-4">{claim.content}</p>
                      </div>
                      
                      {/* Engagement Metrics */}
                      <div className="flex justify-between items-center text-xs text-gray-400">
                        <span>{claim.attestations} attestations</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </TabsContent>



        </Tabs>
      </div>
    </div>
  );
}