import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useRoute, Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Trophy, Target } from "lucide-react";

export default function QuestEnvironment() {
  const [match, params] = useRoute("/quest/:questId");
  const [questData, setQuestData] = useState<any>(null);
  const [, setLocation] = useLocation();

  // Determine back navigation based on referrer or query param
  const getBackLocation = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    if (fromParam === 'explore') {
      return '/';
    }
    if (fromParam === 'ecosystem-dapps') {
      return '/ecosystem-dapps';
    }
    return '/quests';
  };

  const getBackButtonText = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const fromParam = urlParams.get('from');
    if (fromParam === 'explore') {
      return 'Back to Explore';
    }
    if (fromParam === 'ecosystem-dapps') {
      return 'Back to Ecosystem Dapps';
    }
    return 'Back to Quests';
  };

  useEffect(() => {
    if (params?.questId) {
      // Try fetching quests from the backend and pick the one matching the id.
      (async () => {
        try {
          const res = await apiRequest("GET", "/quests");
          const json = await res.json();
          // backend returns { oneTimeQuests, dailyQuests }
          const candidates: any[] = [
            ...(json.oneTimeQuests ?? []),
            ...(json.dailyQuests ?? []),
          ];

          const found = candidates.find((q: any) => q.id === params.questId || q.questId === params.questId);
          setQuestData(found ?? null);
        } catch (e) {
          console.warn("Could not fetch quest data", e);
          setQuestData(null);
        }
      })();
    }
  }, [params?.questId]);

  if (!match) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6" data-testid="quest-environment">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <div className="flex items-center space-x-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLocation(getBackLocation())}
            data-testid="button-back-to-quests"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {getBackButtonText()}
          </Button>
        </div>

        {questData ? (
          <>
            {/* Quest Header */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">{questData.type}</div>
                    <CardTitle className="text-2xl">{questData.title}</CardTitle>
                    <p className="text-muted-foreground">{questData.description}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-sm text-muted-foreground mb-2">
                      <Clock className="w-4 h-4" />
                      <span>{questData.timeLeft} left</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Trophy className="w-5 h-5 text-yellow-500" />
                      <span className="font-semibold text-lg">{questData.reward}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>

            {/* Quest Content Area */}
            <Card className="min-h-[400px]">
              <CardContent className="p-8">
                <div className="text-center space-y-6">
                  <Target className="w-16 h-16 mx-auto text-muted-foreground" />
                  <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-muted-foreground">NOTHING HERE YET</h2>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Quest content and interactions will be implemented here. 
                      This is where users will complete their quest objectives.
                    </p>
                  </div>
                  
                  {/* Placeholder Action Button */}
                  <Button size="lg" disabled data-testid="button-quest-action">
                    Quest Content Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        ) : (
          <Card className="min-h-[400px]">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <Target className="w-16 h-16 mx-auto text-muted-foreground" />
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold text-muted-foreground">QUEST NOT FOUND</h2>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    The quest you're looking for doesn't exist or has been removed.
                  </p>
                </div>
                
                <Button 
                  size="lg" 
                  onClick={() => setLocation(getBackLocation())}
                  data-testid="button-back-to-quests-from-error"
                >
                  Return to {getBackLocation() === '/' ? 'Explore' : 'Quests'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}