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