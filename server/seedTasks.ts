import { storage } from "./storage";

// Seed tasks from Quests.tsx into the database
export async function seedTasks() {
  const tasks = [
    // Daily tasks
    {
      id: "daily-task-1",
      title: "Verify Your Identity",
      description: "Complete your identity verification process",
      taskType: "daily",
      xpReward: 50,
      questIncrement: 0,
      taskIncrement: 1,
      metadata: JSON.stringify({ completed: false }),
      isActive: 1
    },
    {
      id: "daily-task-2",
      title: "Join Community Discussion",
      description: "Participate in at least one community discussion",
      taskType: "daily",
      xpReward: 50,
      questIncrement: 0,
      taskIncrement: 1,
      metadata: JSON.stringify({ completed: false }),
      isActive: 1
    },
    {
      id: "daily-task-3",
      title: "Share Intuition Project",
      description: "Share an Intuition project with the community",
      taskType: "daily",
      xpReward: 50,
      questIncrement: 0,
      taskIncrement: 1,
      metadata: JSON.stringify({ completed: false }),
      isActive: 1
    },
    {
      id: "daily-task-4",
      title: "Create an Attestation",
      description: "Make your first attestation on the Intuition platform",
      taskType: "daily",
      xpReward: 50,
      questIncrement: 0,
      taskIncrement: 1,
      metadata: JSON.stringify({ completed: false }),
      isActive: 1
    },
    // One-time quests
    {
      id: "onetime-x-follow",
      title: "Follow on X",
      description: "Follow our X account to stay updated",
      taskType: "onetime",
      xpReward: 50,
      questIncrement: 1,
      taskIncrement: 0,
      metadata: JSON.stringify({
        kind: 'external',
        url: 'https://x.com/your_x_account',
        actionLabel: 'Follow'
      }),
      isActive: 1
    },
    {
      id: "onetime-x-like",
      title: "Like Post on X",
      description: "Like our announcement post",
      taskType: "onetime",
      xpReward: 50,
      questIncrement: 1,
      taskIncrement: 0,
      metadata: JSON.stringify({
        kind: 'external',
        url: 'https://x.com/your_post',
        actionLabel: 'Like Post'
      }),
      isActive: 1
    },
    {
      id: "onetime-discord-join",
      title: "Connect Discord",
      description: "Link your Discord account",
      taskType: "onetime",
      xpReward: 50,
      questIncrement: 1,
      taskIncrement: 0,
      metadata: JSON.stringify({
        kind: 'external',
        url: 'https://discord.com/oauth2/authorize',
        actionLabel: 'Connect Discord'
      }),
      isActive: 1
    },
    {
      id: "onetime-join-discord",
      title: "Join Discord",
      description: "Join our Discord server to chat with the community",
      taskType: "onetime",
      xpReward: 50,
      questIncrement: 1,
      taskIncrement: 0,
      metadata: JSON.stringify({
        kind: 'external',
        url: 'https://discord.gg/your_invite_code',
        actionLabel: 'Join Discord'
      }),
      isActive: 1
    },
    // Featured quests
    {
      id: 'std-follow-nexura',
      title: 'Follow Nexura on X',
      description: 'Follow Nexura to stay up to date',
      taskType: 'featured',
      xpReward: 50,
      questIncrement: 1,
      taskIncrement: 0,
      metadata: JSON.stringify({
        kind: 'external',
        url: 'https://x.com/NexuraXYZ',
        actionLabel: 'Follow Nexura'
      }),
      isActive: 1
    },
    {
      id: 'std-join-discord',
      title: 'Join Nexura Discord',
      description: 'Join the Nexura community on Discord and verify yourself',
      taskType: 'featured',
      xpReward: 50,
      questIncrement: 1,
      taskIncrement: 0,
      metadata: JSON.stringify({
        kind: 'external',
        url: 'https://discord.gg/Up7UjXrdp',
        actionLabel: 'Join Discord'
      }),
      isActive: 1
    },
    {
      id: 'std-complete-campaign',
      title: 'Complete a Campaign',
      description: 'Finish any campaign to qualify for Standard Quests',
      taskType: 'featured',
      xpReward: 50,
      questIncrement: 1,
      taskIncrement: 0,
      metadata: JSON.stringify({
        kind: 'internal',
        to: '/projects',
        actionLabel: 'Browse Campaigns'
      }),
      isActive: 1
    },
    // Extra quests
    {
      id: 'quest-support-claim-1',
      title: 'Support or Oppose Claim A',
      description: 'Support or oppose this claim on Intuition',
      taskType: 'extra',
      xpReward: 50,
      questIncrement: 1,
      taskIncrement: 0,
      metadata: JSON.stringify({
        kind: 'external',
        url: 'https://testnet.portal.intuition.systems/explore/triple/0xb301f076ea5d81e049e5fc1bb47ee6cdf089ce79c86376053e9a2ff7f3058b7d',
        actionLabel: 'Open Claim'
      }),
      isActive: 1
    },
    {
      id: 'quest-support-claim-2',
      title: 'Support or Oppose Claim B',
      description: 'Support or oppose this claim on Intuition',
      taskType: 'extra',
      xpReward: 50,
      questIncrement: 1,
      taskIncrement: 0,
      metadata: JSON.stringify({
        kind: 'external',
        url: 'https://testnet.portal.intuition.systems/explore/atom/0x15a1eb6044c93eab63862352cbb949c22a537099f8d482e7f05d3e89d80bb1b7',
        actionLabel: 'Open Claim'
      }),
      isActive: 1
    },
    // Campaign tasks
    {
      id: 'camp-learn-quest',
      title: 'Complete at least a quest in Learn tab',
      description: 'Finish any Learn quest to progress campaigns',
      taskType: 'campaign',
      xpReward: 50,
      questIncrement: 1,
      taskIncrement: 0,
      metadata: JSON.stringify({
        kind: 'internal',
        to: '/learn',
        actionLabel: 'Go to Learn'
      }),
      isActive: 1
    },
    {
      id: 'camp-join-socials',
      title: 'Join Nexura Socials',
      description: 'Be part of Nexura socials to unlock campaign rewards',
      taskType: 'campaign',
      xpReward: 50,
      questIncrement: 0,
      taskIncrement: 1,
      metadata: JSON.stringify({
        kind: 'external',
        url: 'https://x.com/NexuraXYZ',
        actionLabel: 'Open Socials'
      }),
      isActive: 1
    },
    {
      id: 'camp-support-claim',
      title: 'Support the Nexura Claim',
      description: 'Support the nexura claim on Intuition',
      taskType: 'campaign',
      xpReward: 50,
      questIncrement: 1,
      taskIncrement: 0,
      metadata: JSON.stringify({
        kind: 'external',
        url: 'https://testnet.portal.intuition.systems/explore/atom/0x985db42765efe28ba3ed6867fa7bd913955227898f6a665e34e3c9171885f1cc',
        actionLabel: 'Open Claim'
      }),
      isActive: 1
    }
  ];

  console.log(`Seeding ${tasks.length} tasks...`);
  
  for (const task of tasks) {
    try {
      await storage.createTask(task);
      console.log(`✓ Created task: ${task.id}`);
    } catch (error) {
      console.error(`✗ Failed to create task ${task.id}:`, error);
    }
  }
  
  console.log('Task seeding complete!');
}

// Note: seeding is invoked from server/index.ts in development. Do not run this file
// directly in ESM environments.
