import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { useLocation } from "wouter";
import { Plus, X, ChevronRight, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import {
  TASK_CATEGORIES,
  TASK_CATEGORY_LABELS,
  TASK_CATEGORY_ICONS,
  TASK_SUBTYPES_BY_CATEGORY,
  type TaskCategory,
  type CampaignTaskData,
} from "@shared/taskTypes";

type TaskBuilderStep = "category" | "subtype" | "configure";

interface TaskInProgress extends Partial<CampaignTaskData> {
  tempId: string;
}

export default function CampaignCreate() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Campaign fields
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Task builder state
  const [tasks, setTasks] = useState<TaskInProgress[]>([]);
  const [showTaskBuilder, setShowTaskBuilder] = useState(false);
  const [builderStep, setBuilderStep] = useState<TaskBuilderStep>("category");
  const [selectedCategory, setSelectedCategory] = useState<TaskCategory | null>(null);
  const [selectedSubtype, setSelectedSubtype] = useState<string | null>(null);
  
  // Current task being configured
  const [currentTask, setCurrentTask] = useState<TaskInProgress>({
    tempId: Date.now().toString(),
    title: "",
    description: "",
    xpReward: 10,
    verificationConfig: {},
  });

  const startNewTask = () => {
    setCurrentTask({
      tempId: Date.now().toString(),
      title: "",
      description: "",
      xpReward: 10,
      verificationConfig: {},
    });
    setSelectedCategory(null);
    setSelectedSubtype(null);
    setBuilderStep("category");
    setShowTaskBuilder(true);
  };

  const selectCategory = (category: TaskCategory) => {
    setSelectedCategory(category);
    setCurrentTask({ ...currentTask, taskCategory: category });
    setBuilderStep("subtype");
  };

  const selectSubtype = (subtype: string) => {
    setSelectedSubtype(subtype);
    setCurrentTask({ ...currentTask, taskSubtype: subtype });
    setBuilderStep("configure");
  };

  const addTaskToList = () => {
    if (!currentTask.title || !currentTask.taskCategory || !currentTask.taskSubtype) {
      alert("Please fill in all required fields");
      return;
    }
    setTasks([...tasks, { ...currentTask }]);
    setShowTaskBuilder(false);
  };

  const removeTask = (tempId: string) => {
    setTasks(tasks.filter(t => t.tempId !== tempId));
  };

  const handleSubmit = async () => {
    if (!campaignName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a campaign name",
        variant: "destructive",
      });
      return;
    }
    
    if (tasks.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one task",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // TODO: Get actual project ID from context/auth
      const projectId = "temp-project-id";
      
      // Create campaign
      const campaignData = {
        projectId,
        name: campaignName,
        description: campaignDescription,
        startsAt: startDate ? new Date(startDate).toISOString() : null,
        endsAt: endDate ? new Date(endDate).toISOString() : null,
      };
      
      // For now, we'll need a campaigns endpoint - let's log for now
      console.log("Campaign data:", campaignData);
      console.log("Tasks:", tasks);
      
      toast({
        title: "Success",
        description: "Campaign created successfully (mock)",
      });
      
      // Navigate back to campaigns list
      setTimeout(() => {
        setLocation("/campaigns");
      }, 1000);
      
    } catch (error: any) {
      console.error("Failed to create campaign:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCategorySelection = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowTaskBuilder(false)}
          className="text-white/60 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Cancel
        </Button>
        <h3 className="text-lg font-bold text-white">Select Task Category</h3>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        {Object.values(TASK_CATEGORIES).map((category) => (
          <Card
            key={category}
            className="glass glass-hover rounded-3xl p-6 cursor-pointer transition-all"
            onClick={() => selectCategory(category)}
          >
            <div className="text-4xl mb-3">{TASK_CATEGORY_ICONS[category]}</div>
            <h4 className="text-white font-bold text-lg">{TASK_CATEGORY_LABELS[category]}</h4>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderSubtypeSelection = () => {
    if (!selectedCategory) return null;
    const subtypes = TASK_SUBTYPES_BY_CATEGORY[selectedCategory];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBuilderStep("category")}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <p className="text-white/60 text-sm">Category: {TASK_CATEGORY_LABELS[selectedCategory]}</p>
            <h3 className="text-lg font-bold text-white">Select Task Type</h3>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(subtypes).map(([subtype, label]) => (
            <Card
              key={subtype}
              className="glass glass-hover rounded-3xl p-6 cursor-pointer transition-all"
              onClick={() => selectSubtype(subtype)}
            >
              <div className="flex items-center justify-between">
                <h4 className="text-white font-bold">{label}</h4>
                <ChevronRight className="w-5 h-5 text-white/40" />
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  const renderTaskConfiguration = () => {
    if (!selectedCategory || !selectedSubtype) return null;
    const subtypes = TASK_SUBTYPES_BY_CATEGORY[selectedCategory];

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBuilderStep("subtype")}
            className="text-white/60 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <p className="text-white/60 text-sm">
              {TASK_CATEGORY_LABELS[selectedCategory]} → {subtypes[selectedSubtype]}
            </p>
            <h3 className="text-lg font-bold text-white">Configure Task</h3>
          </div>
        </div>

        <Card className="glass rounded-3xl p-6 space-y-4">
          <div>
            <label className="text-white font-bold text-sm mb-2 block">Task Title *</label>
            <Input
              value={currentTask.title}
              onChange={(e) => setCurrentTask({ ...currentTask, title: e.target.value })}
              placeholder="e.g., Follow us on Twitter"
              className="glass rounded-full"
            />
          </div>

          <div>
            <label className="text-white font-bold text-sm mb-2 block">Description *</label>
            <Textarea
              value={currentTask.description}
              onChange={(e) => setCurrentTask({ ...currentTask, description: e.target.value })}
              placeholder="Describe what users need to do..."
              className="glass rounded-3xl min-h-[100px]"
            />
          </div>

          <div>
            <label className="text-white font-bold text-sm mb-2 block">XP Reward *</label>
            <Input
              type="number"
              value={currentTask.xpReward}
              onChange={(e) => setCurrentTask({ ...currentTask, xpReward: parseInt(e.target.value) || 0 })}
              className="glass rounded-full"
            />
          </div>

          {renderTaskSpecificFields()}

          <div className="flex gap-3 pt-4">
            <Button
              onClick={addTaskToList}
              className="rounded-full font-bold flex-1"
            >
              Add Task
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTaskBuilder(false)}
              className="rounded-full"
            >
              Cancel
            </Button>
          </div>
        </Card>
      </div>
    );
  };

  const renderTaskSpecificFields = () => {
    if (!selectedCategory) return null;

    switch (selectedCategory) {
      case "twitter":
        return (
          <div>
            <label className="text-white font-bold text-sm mb-2 block">Twitter URL</label>
            <Input
              placeholder="https://twitter.com/..."
              className="glass rounded-full"
              onChange={(e) =>
                setCurrentTask({
                  ...currentTask,
                  verificationConfig: { ...currentTask.verificationConfig, tweetUrl: e.target.value },
                })
              }
            />
          </div>
        );

      case "discord":
        return (
          <>
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Server Invite Link</label>
              <Input
                placeholder="https://discord.gg/..."
                className="glass rounded-full"
                onChange={(e) =>
                  setCurrentTask({
                    ...currentTask,
                    verificationConfig: { ...currentTask.verificationConfig, serverInvite: e.target.value },
                  })
                }
              />
            </div>
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Server ID (optional)</label>
              <Input
                placeholder="123456789"
                className="glass rounded-full"
                onChange={(e) =>
                  setCurrentTask({
                    ...currentTask,
                    verificationConfig: { ...currentTask.verificationConfig, serverId: e.target.value },
                  })
                }
              />
            </div>
          </>
        );

      case "onchain":
        return (
          <>
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Chain ID</label>
              <Input
                type="number"
                placeholder="1 (Ethereum Mainnet)"
                className="glass rounded-full"
                onChange={(e) =>
                  setCurrentTask({
                    ...currentTask,
                    verificationConfig: { ...currentTask.verificationConfig, chainId: parseInt(e.target.value) },
                  })
                }
              />
            </div>
            <div>
              <label className="text-white font-bold text-sm mb-2 block">Contract Address (optional)</label>
              <Input
                placeholder="0x..."
                className="glass rounded-full"
                onChange={(e) =>
                  setCurrentTask({
                    ...currentTask,
                    verificationConfig: { ...currentTask.verificationConfig, contractAddress: e.target.value },
                  })
                }
              />
            </div>
          </>
        );

      case "telegram":
        return (
          <div>
            <label className="text-white font-bold text-sm mb-2 block">Group/Channel Invite Link</label>
            <Input
              placeholder="https://t.me/..."
              className="glass rounded-full"
              onChange={(e) =>
                setCurrentTask({
                  ...currentTask,
                  verificationConfig: { ...currentTask.verificationConfig, groupInvite: e.target.value },
                })
              }
            />
          </div>
        );

      case "email":
        return (
          <div>
            <label className="text-white font-bold text-sm mb-2 block">
              <input
                type="checkbox"
                className="mr-2"
                onChange={(e) =>
                  setCurrentTask({
                    ...currentTask,
                    verificationConfig: { ...currentTask.verificationConfig, requireVerification: e.target.checked },
                  })
                }
              />
              Require email verification
            </label>
          </div>
        );

      case "quiz":
        return (
          <div className="glass rounded-3xl p-4">
            <p className="text-white/60 text-sm">Quiz questions can be configured after task creation</p>
          </div>
        );

      case "poh":
        return (
          <div>
            <label className="text-white font-bold text-sm mb-2 block">Minimum Score (optional)</label>
            <Input
              type="number"
              placeholder="20"
              className="glass rounded-full"
              onChange={(e) =>
                setCurrentTask({
                  ...currentTask,
                  verificationConfig: { ...currentTask.verificationConfig, minScore: parseInt(e.target.value) },
                })
              }
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Create Campaign</h1>
            <p className="text-white/60 mt-2">Build an engaging campaign with custom tasks</p>
          </div>
          <Button
            variant="ghost"
            onClick={() => setLocation("/campaigns")}
            className="text-white/60 hover:text-white rounded-full"
          >
            Cancel
          </Button>
        </div>

        {!showTaskBuilder ? (
          <div className="space-y-6">
            {/* Campaign Details */}
            <Card className="glass rounded-3xl p-8">
              <h2 className="text-xl font-bold text-white mb-6">Campaign Details</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-white font-bold text-sm mb-2 block">Campaign Name *</label>
                  <Input
                    value={campaignName}
                    onChange={(e) => setCampaignName(e.target.value)}
                    placeholder="Enter campaign name"
                    className="glass rounded-full"
                  />
                </div>

                <div>
                  <label className="text-white font-bold text-sm mb-2 block">Description</label>
                  <Textarea
                    value={campaignDescription}
                    onChange={(e) => setCampaignDescription(e.target.value)}
                    placeholder="Describe your campaign..."
                    className="glass rounded-3xl min-h-[120px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-white font-bold text-sm mb-2 block">Start Date</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="glass rounded-full"
                    />
                  </div>
                  <div>
                    <label className="text-white font-bold text-sm mb-2 block">End Date</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="glass rounded-full"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Tasks Section */}
            <Card className="glass rounded-3xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Campaign Tasks</h2>
                <Button
                  onClick={startNewTask}
                  className="rounded-full font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Task
                </Button>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-white/60">No tasks added yet</p>
                  <p className="text-white/40 text-sm mt-2">Click "Add Task" to create your first task</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.map((task, index) => (
                    <Card key={task.tempId} className="glass glass-hover rounded-3xl p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{task.taskCategory && TASK_CATEGORY_ICONS[task.taskCategory]}</span>
                            <div>
                              <h4 className="text-white font-bold">{task.title}</h4>
                              <p className="text-white/60 text-sm">
                                {task.taskCategory && TASK_CATEGORY_LABELS[task.taskCategory]} · {task.xpReward} XP
                              </p>
                            </div>
                          </div>
                          <p className="text-white/50 text-sm ml-11">{task.description}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTask(task.tempId)}
                          className="text-white/40 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>

            {/* Submit Button */}
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation("/campaigns")}
                className="rounded-full"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!campaignName.trim() || tasks.length === 0 || isSubmitting}
                className="rounded-full font-bold px-8"
              >
                {isSubmitting ? "Creating..." : "Create Campaign"}
              </Button>
            </div>
          </div>
        ) : (
          <Card className="glass rounded-3xl p-8">
            {builderStep === "category" && renderCategorySelection()}
            {builderStep === "subtype" && renderSubtypeSelection()}
            {builderStep === "configure" && renderTaskConfiguration()}
          </Card>
        )}
      </div>
    </div>
  );
}

