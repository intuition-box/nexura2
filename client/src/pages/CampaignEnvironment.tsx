import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function CampaignEnvironment() {
  const [, setLocation] = useLocation();

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

  return (
    <div className="min-h-screen bg-black overflow-auto p-6" data-testid="campaign-environment-page">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Navigation */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setLocation(getBackLocation())}
            data-testid="button-back-to-campaigns"
            className="rounded-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {getBackButtonText()}
          </Button>
        </div>

        {/* Campaign Page Content */}
        <div className="text-center py-16">
          <Card className="glass glass-hover rounded-3xl max-w-md mx-auto">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-white">Campaign Details</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg text-white/60 mb-6 font-bold">
                NO QUESTS YET
              </p>
              <p className="text-sm text-white/60">
                This campaign is currently being prepared. Check back soon for available quests and activities.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}