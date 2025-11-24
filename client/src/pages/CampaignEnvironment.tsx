import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient"; 
import { useLocation } from "wouter";

type Task = {
  id: string;
  task: string;
  xp: string;
  link: string;
};

type CampaignCompleted = {
  tasksCompleted: boolean;
  campaignCmpleted: boolean;
};

export default function CampaignEnvironment() {
  const [, setLocation] = useLocation();
  const [tasks, setCampaignTasks] = useState<Task[]>([]);
  const [campaignCompleted, setCampaignCompleted] = useState<CampaignCompleted>();

  const campaignId = "12"; // get campaign id from search
  useEffect(() => {
    (async () => {
      const campaignTasks = await apiRequest("GET", `/api/campaign/tasks?id=${campaignId}`);
      setCampaignTasks(campaignTasks.tasks)
      setCampaignCompleted(campaignTasks.campaignCompleted);
    })();
  }, []);

  // Determine back navigation based on referrer or query param
  const getBackLocation = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    if (fromParam === 'explore') {
      return '/';
    }
    return '/campaigns';
  };

  const getBackButtonText = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    if (fromParam === 'explore') {
      return 'Back to Explore';
    }
    return 'Back to Campaigns';
  };

  const performCampaignTask = async () => {
    await apiRequest("POST", `/api/campaign/performTask?id=${campaignId}`);
  };

  const claimReward = async () => {
    // use the user wallet to connect to the smart contract and call the claim fn

    await apiRequest("POST", `/api/campaign/claim?id=${campaignId}`);
  };

  return (
    <div className="min-h-screen bg-background overflow-auto p-6" data-testid="campaign-environment-page">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation(getBackLocation())}
            data-testid="button-back-to-campaigns"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {getBackButtonText()}
          </Button>
        </div>

        {/* Campaign Page Content */}
        <div className="text-center py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-foreground">Campaign Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-muted-foreground mb-6">
                NO QUESTS YET
              </p>
              <p className="text-sm text-muted-foreground">
                This campaign is currently being prepared. Check back soon for available quests and activities.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}