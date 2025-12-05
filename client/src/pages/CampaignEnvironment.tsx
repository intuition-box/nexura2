import { useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";
import AnimatedBackground from "@/components/AnimatedBackground";

// Define campaign tasks
const campaignTasks = [
  { text: "Follow Nexura on X", link: "https://x.com/NexuraXYZ" },
  { text: "Join Nexura Discord Server and verify yourself", link: "https://discord.gg/caK9kATBya" },
  { text: "Drop a message on Nexura Discord Server (on any channel)", link: "https://discord.gg/caK9kATBya" },
  { text: "Support or Oppose the #Intuitionbilly Claim on Intuition Portal", link: "https://portal.intuition.systems/explore/triple/0x713f27d70772462e67805c6f76352384e01399681398f757725b9cbc7f495dcf?tab=positions" },
  { text: "Support or Oppose the Nexura Claim on the Intuition Portal", link: "#" },
  { text: "Like and Comment on Nexura's pinned post", link: "#" },
];

export default function CampaignEnvironment() {
  const [, setLocation] = useLocation();
  const [taskIndex, setTaskIndex] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);

  const currentTask = campaignTasks[taskIndex];
  const progressPercentage = ((taskIndex + 1) / campaignTasks.length) * 100;

  return (
    <div className="min-h-screen bg-black text-white p-4 relative">
      <AnimatedBackground />
      <div className="max-w-xl mx-auto space-y-6 relative z-10">

        {/* Header */}
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={() => setLocation("/campaigns")}>
            ← Back
          </Button>
          <h1 className="text-2xl font-bold">Campaign Tasks</h1>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>

        {/* Task Card */}
        <Card className="rounded-xl overflow-hidden shadow-lg">
          <div className="relative h-44 bg-black">
            <img
              src="/campaign.png"
              alt="Campaign Image"
              className="w-full h-full object-cover rounded-t-xl"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          </div>

          <CardContent className="p-4 space-y-3">
            <p className="text-sm text-gray-200">{currentTask.text}</p>

            {currentTask.link && (
              <a
                href={currentTask.link}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-block text-center px-3 py-2 bg-[#1f6feb] hover:bg-[#388bfd] rounded-lg font-medium"
              >
                <ExternalLink className="w-4 h-4 inline mr-2" /> Open Task
              </a>
            )}

            {taskIndex < campaignTasks.length - 1 ? (
              <Button className="w-full mt-2" onClick={() => setTaskIndex(taskIndex + 1)}>
                Continue
              </Button>
            ) : (
              <div className="text-center mt-2 space-y-2">
                {!rewardClaimed ? (
                  <Button
                    className="w-full bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg"
                    onClick={() => setRewardClaimed(true)}
                  >
                    Claim Reward: 200 XP + 16 TRUST
                  </Button>
                ) : (
                  <p className="text-green-400 font-semibold">
                    Reward claimed! 🎉 FCFS 250 users
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-sm text-gray-400 mt-2 text-center">
          Total Campaign Reward Pool: 4,000 TRUST (First Come First Serve)
        </p>
      </div>
    </div>
  );
}
