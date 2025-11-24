import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Calendar, Clock, Trophy, Target, CheckCircle, Plus } from "lucide-react";
import { useLocation } from "wouter";
import dailyQuestImg from "@assets/generated_images/Daily_Quest_Completion_Image_83de888a.png";
import gettingStartedImg from "@assets/generated_images/Getting_Started_Quest_Image_9a7ae50b.png";

export default function Quests() {
  const [activeTab, setActiveTab] = useState("active");
  const [, setLocation] = useLocation();
  const [claimedTasks, setClaimedTasks] = useState<string[]>([]);

  // Active/Weekly Quest Tasks (formerly Daily)
  const activeQuestTasks = [
    {
      id: "active-task-1",
      title: "Verify Your Identity",
      description: "Complete your identity verification process",
      reward: "10 XP",
      completed: false
    },
    {
      id: "active-task-2", 
      title: "Join Community Discussion",
      description: "Participate in at least one community discussion",
      reward: "15 XP",
      completed: false
    },
    {
      id: "active-task-3",
      title: "Share Intuition Project",
      description: "Share an Intuition project with the community",
      reward: "20 XP",
      completed: false
    },
    {
      id: "active-task-4",
      title: "Create an Attestation",
      description: "Make your first attestation on the Intuition platform",
      reward: "25 XP",
      completed: false
    }
  ];

  const oneTimeQuests = [
    {
      id: "onetime-1",
      title: "Connect X",
      description: "Link your X account to verify your identity and join the community",
      reward: "25 XP",
      completed: false
    },
    {
      id: "onetime-2",
      title: "Connect Discord",
      description: "Join our Discord community to access exclusive channels and updates",
      reward: "25 XP",
      completed: false
    },
    {
      id: "onetime-3",
      title: "Own a .trust domain",
      description: "Register your .trust domain to establish your presence on the Intuition network",
      reward: "50 XP",
      completed: false
    }
  ];

  const handleClaimTask = (taskId: string) => {
    if (!claimedTasks.includes(taskId)) {
      setClaimedTasks(prev => [...prev, taskId]);
    }
  };

  const renderQuestCard = (quest: any, showProgress = false) => (
    <Card key={quest.id} className="overflow-hidden hover-elevate group" data-testid={`quest-${quest.id}`}>
      {/* Hero Image */}
      <div className="relative h-48 overflow-hidden">
        <img 
          src={quest.heroImage} 
          alt={quest.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        
        {/* Completion Status */}
        <div className="absolute top-4 right-4">
          {quest.completed ? (
            <CheckCircle className="w-5 h-5 text-green-500" />
          ) : (
            <Clock className="w-5 h-5 text-white/80" />
          )}
        </div>
      </div>
      
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold">{quest.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-muted-foreground text-sm">{quest.description}</p>
        
        {showProgress && quest.progress !== undefined && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{quest.progress} / {quest.total}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary rounded-full h-2 transition-all"
                style={{ width: `${(quest.progress / quest.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {quest.compulsory && (
              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/30">
                Compulsory
              </Badge>
            )}
            {quest.timeLeft && (
              <div className="text-sm text-muted-foreground">
                {quest.timeLeft} left
              </div>
            )}
          </div>
          <div className="text-right">
            <div className="font-semibold text-foreground">
              <span className="text-blue-500 font-bold">5XP</span>
              <span className="text-muted-foreground mx-1">+</span>
              <span>{quest.reward}</span>
            </div>
          </div>
        </div>

        <Button 
          className="w-full" 
          variant={quest.completed ? "outline" : "quest"}
          disabled={quest.completed}
          onClick={() => !quest.completed && setLocation(`/quest/${quest.id}?from=quests`)}
          data-testid={`button-start-${quest.id}`}
        >
          {quest.completed ? "Completed" : "Start Quest"}
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background overflow-auto p-6" data-testid="quests-page">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Quests</h1>
          <p className="text-muted-foreground">
            Complete active (weekly) tasks and one-time quests to earn XP ⚡
          </p>
        </div>

        {/* Quest Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2" data-testid="quest-tabs">
            <TabsTrigger value="active" data-testid="tab-active">
              <Calendar className="w-4 h-4 mr-2" />
              Active
            </TabsTrigger>
            <TabsTrigger value="onetime" data-testid="tab-onetime">
              <CheckCircle className="w-4 h-4 mr-2" />
              One Time
            </TabsTrigger>
          </TabsList>

          {/* Active Tasks */}
          <TabsContent value="active" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">Active Tasks</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Complete these tasks weekly to earn XP • Resets every 7 days
              </p>
            </div>
            
            {/* Active Tasks List */}
            <div className="space-y-4">
              {activeQuestTasks.map((task) => (
                <Card key={task.id} className="p-6" data-testid={`active-task-${task.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        claimedTasks.includes(task.id) 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300'
                      }`}>
                        {claimedTasks.includes(task.id) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{task.title}</h3>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold text-primary">{task.reward}</div>
                      </div>
                      <Button 
                        size="sm"
                        variant={claimedTasks.includes(task.id) ? "outline" : "quest"}
                        disabled={claimedTasks.includes(task.id)}
                        onClick={() => handleClaimTask(task.id)}
                        data-testid={`claim-task-${task.id}`}
                      >
                        {claimedTasks.includes(task.id) ? 'Claimed' : 'Claim'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* Active Progress Summary */}
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">Active Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {claimedTasks.length} of {activeQuestTasks.length} tasks completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round((claimedTasks.length / activeQuestTasks.length) * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* One Time Quests */}
          <TabsContent value="onetime" className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-4">One Time Quests</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Complete these essential quests to unlock the full NEXURA experience
              </p>
            </div>
            
            {/* One Time Quests List */}
            <div className="space-y-4">
              {oneTimeQuests.map((quest) => (
                <Card key={quest.id} className="p-6" data-testid={`onetime-task-${quest.id}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        claimedTasks.includes(quest.id) 
                          ? 'bg-green-500 border-green-500' 
                          : 'border-gray-300'
                      }`}>
                        {claimedTasks.includes(quest.id) && (
                          <CheckCircle className="w-4 h-4 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">{quest.title}</h3>
                        <p className="text-sm text-muted-foreground">{quest.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <div className="font-semibold text-primary">{quest.reward}</div>
                      </div>
                      <Button 
                        size="sm"
                        variant={claimedTasks.includes(quest.id) ? "outline" : "quest"}
                        disabled={claimedTasks.includes(quest.id)}
                        onClick={() => handleClaimTask(quest.id)}
                        data-testid={`claim-quest-${quest.id}`}
                      >
                        {claimedTasks.includes(quest.id) ? 'Claimed' : 'Claim'}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            
            {/* One Time Quests Progress Summary */}
            <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-foreground">One Time Progress</h3>
                  <p className="text-sm text-muted-foreground">
                    {oneTimeQuests.filter(q => claimedTasks.includes(q.id)).length} of {oneTimeQuests.length} quests completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round((oneTimeQuests.filter(q => claimedTasks.includes(q.id)).length / oneTimeQuests.length) * 100)}%
                  </div>
                  <div className="text-xs text-muted-foreground">Complete</div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
