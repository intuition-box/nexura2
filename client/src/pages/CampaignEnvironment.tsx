import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, CheckCircle, Circle, Trophy, Clock } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AnimatedBackground from "@/components/AnimatedBackground";
import { useAuth } from "@/lib/auth";
import { apiRequest } from "@/lib/queryClient";

interface CampaignTask {
  id: string;
  title: string;
  description: string;
  taskCategory: string;
  taskSubtype: string;
  xpReward: number;
  verificationConfig?: any;
  isActive: number;
  orderIndex: number;
  createdAt: string;
}

interface Campaign {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  metadata?: any;
  isActive: boolean;
  project_name?: string;
  project_id?: string;
  createdAt: string;
}

export default function CampaignEnvironment() {
  const { campaignId } = useParams();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch campaign details
  const { data: campaign, isLoading: campaignLoading } = useQuery<Campaign>({
    queryKey: [`/api/campaigns/${campaignId}`],
     queryFn: () => apiRequest("GET", `/api/campaigns/${campaignId}`).then((res) => res.json()),
    enabled: !!campaignId,
  });

  // Fetch campaign tasks
  const { data: tasks = [], isLoading: tasksLoading } = useQuery<CampaignTask[]>({
    queryKey: [`/api/campaigns/${campaignId}/tasks`],
     queryFn: () => apiRequest("GET", `/api/campaigns/${campaignId}/tasks`).then((res) => res.json()),
    enabled: !!campaignId,
  });

  // Fetch completed tasks for current user
  const { data: completedTaskIds = [] } = useQuery<string[]>({
    queryKey: [`/api/campaigns/${campaignId}/tasks/completed/${user?.id}`],
     queryFn: () =>
       apiRequest("GET", `/api/campaigns/${campaignId}/tasks/completed/${user?.id}`)
         .then((res) => res.json())
         .then((body: any) => body.taskIds || []),
    enabled: !!campaignId && !!user?.id,
  });

  // Claim task mutation
  const claimTaskMutation = useMutation({
    mutationFn: (taskId: string) =>
      apiRequest("POST", `/api/campaigns/${campaignId}/tasks/${taskId}/claim`, {}),
    onSuccess: () => {
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: [`/api/campaigns/${campaignId}/tasks/completed/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/profile"] }); // Refresh user XP
    },
  });

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

  const handleClaimTask = async (taskId: string) => {
    if (!user) {
      alert("Please log in to claim tasks");
      return;
    }

    try {
      await claimTaskMutation.mutateAsync(taskId);
    } catch (error: any) {
      alert(error.message || "Failed to claim task");
    }
  };

  const isTaskCompleted = (taskId: string) => completedTaskIds.includes(taskId);

  if (campaignLoading || tasksLoading) {
    return (
      <div className="min-h-screen bg-black text-white overflow-auto p-6 relative">
        <AnimatedBackground />
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="text-center py-16">
            <div className="text-white/60">Loading campaign...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-black text-white overflow-auto p-6 relative">
        <AnimatedBackground />
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="text-center py-16">
            <Card className="glass glass-hover rounded-3xl max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-3xl font-bold text-white">Campaign Not Found</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/60">
                  The campaign you're looking for doesn't exist or has been removed.
                </p>
                <Button
                  onClick={() => setLocation(getBackLocation())}
                  className="mt-4"
                >
                  {getBackButtonText()}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-auto p-6 relative" data-testid="campaign-environment-page">
      <AnimatedBackground />
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
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

        {/* Campaign Header */}
        <div className="text-center space-y-4">
          {campaign.imageUrl && (
            <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-white/20">
              <img
                src={campaign.imageUrl}
                alt={campaign.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">{campaign.title}</h1>
            {campaign.project_name && (
              <p className="text-white/60 text-lg">by {campaign.project_name}</p>
            )}
            <p className="text-white/80 mt-4 max-w-2xl mx-auto">{campaign.description}</p>
          </div>
        </div>

        {/* Campaign Tasks */}
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">Campaign Tasks</h2>
            <p className="text-white/60">Complete these tasks to earn XP and contribute to the campaign</p>
          </div>

          {tasks.length === 0 ? (
            <Card className="glass glass-hover rounded-3xl max-w-md mx-auto">
              <CardContent className="text-center py-8">
                <Clock className="w-12 h-12 mx-auto text-white/40 mb-4" />
                <p className="text-white/60">No tasks available yet</p>
                <p className="text-sm text-white/40 mt-2">Check back soon for tasks to complete</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {tasks.map((task) => (
                <Card key={task.id} className="glass glass-hover rounded-3xl overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-bold text-white mb-1">
                          {task.title}
                        </CardTitle>
                        <div className="flex items-center space-x-2 text-sm text-white/60">
                          <Trophy className="w-4 h-4" />
                          <span>{task.xpReward} XP</span>
                        </div>
                      </div>
                      {isTaskCompleted(task.id) ? (
                        <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                      ) : (
                        <Circle className="w-6 h-6 text-white/40 flex-shrink-0" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 text-sm mb-4">{task.description}</p>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-white/50">
                        {task.taskCategory} • {task.taskSubtype}
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleClaimTask(task.id)}
                        disabled={isTaskCompleted(task.id) || claimTaskMutation.isPending}
                        className="rounded-full"
                      >
                        {isTaskCompleted(task.id) ? "Completed" :
                         claimTaskMutation.isPending ? "Claiming..." : "Claim Reward"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}