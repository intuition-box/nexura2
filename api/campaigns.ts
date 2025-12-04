import { Router } from "express";

const router = Router();

router.get("/", (_req, res) => {
  const now = new Date();

  // Example campaigns
  const campaigns = [
    {
      id: "1",
      name: "Campaign Alpha",
      description: "First campaign live now.",
      project_name: "Project Alpha",
      // Web3-style dynamic image URL using DiceBear (NFT avatar)
      project_image: "/campaign.jpeg",
      starts_at: new Date(now.getTime() - 1000 * 60 * 60 * 24).toISOString(), // yesterday
      ends_at: new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString(),   // tomorrow
      metadata: JSON.stringify({ participants: 120, category: "NFT" }),
      rewards: {
        amount: 3000,
        currency: "tTrust",
      },
    },
    {
      id: "2",
      name: "Campaign Beta",
      description: "Second campaign coming soon.",
      project_name: "Project Beta",
      project_image: "/beta.png",
      starts_at: new Date(now.getTime() + 1000 * 60 * 60 * 24).toISOString(), // tomorrow
      ends_at: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2).toISOString(), // day after
      metadata: JSON.stringify({ participants: 50, category: "DeFi" }),
      rewards: {
        amount: 3000,
        currency: "tTrust",
      }
    },
    {
      id: "3",
      name: "Campaign Gamma",
      description: "Upcoming campaign for testing.",
      project_name: "Project Gamma",
      project_image: "/gamma.jpeg",
      starts_at: new Date(now.getTime() + 1000 * 60 * 60 * 48).toISOString(), // 2 days later
      ends_at: new Date(now.getTime() + 1000 * 60 * 60 * 72).toISOString(), // 3 days later
      metadata: JSON.stringify({ participants: 75, category: "AI" }),
      rewards: {
        amount: 3000,
        currency: "tTrust",
      }
    }
  ];

  res.json(campaigns);
});

export default router;
