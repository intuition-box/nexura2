import { Router } from "express";

const router = Router();

// ------ CAMPAIGN DATA ------
// ------ CAMPAIGN DATA ------
export const mockCampaigns = [
  {
    id: "nexura-campaign-1",
    title: "Nexura Growth Sprint",
    description:
      "Complete all tasks to earn XP and share from the 4,000 TRUST reward pool. First 250 users only.",
    project_image: "/campaign.png",
    rewardPool: "4,000 TRUST",
    rewardPerUser: "16 TRUST + 200 XP",
    maxUsers: 250,
    status: "active",

    tasks: [
      {
        id: "task-1",
        title: "Follow Nexura on X",
        type: "link",
        url: "https://x.com/NexuraXYZ",
        points: 20,
      },
      {
        id: "task-2",
        title: "Join Nexura Discord Server & Verify",
        type: "link",
        url: "https://discord.gg/caK9kATBya",
        points: 25,
      },
      {
        id: "task-3",
        title: "Send a Message in Any Nexura Discord Channel",
        type: "link",
        url: "https://discord.gg/caK9kATBya",
        points: 25,
      },
      {
        id: "task-4",
        title: "Support or Oppose the #IntuitionBilly Claim",
        type: "link",
        url: "https://portal.intuition.systems/explore/triple/0x713f27d70772462e67805c6f76352384e01399681398f757725b9cbc7f495dcf?tab=positions",
        points: 30,
      },
      {
        id: "task-5",
        title: "Support or Oppose the Nexura Claim",
        type: "pending-link",
        url: "#",
        points: 30,
      },
      {
        id: "task-6",
        title: "Like & Comment on Nexura’s Pinned Post",
        type: "pending-link",
        url: "#",
        points: 20,
        project_image: "/campaign.png",
      },
    ],

    starts_at: "2025-12-01T00:00:00Z",
    ends_at: "2026-01-03T23:59:59Z",

  },

  // DUPLICATE FIXED
  {
    id: "nexura-campaign-2",
    title: "Nexura Growth Sprint Lite",
    description: "Coming soon — mini version.",
    project_image: "/campaign.png",
    rewardPool: "4,000 TRUST",
    rewardPerUser: "16 TRUST + 200 XP",
    maxUsers: 250,
    status: "active",
    tasks: [],
starts_at: "2025-12-01T00:00:00Z",
ends_at: "2026-01-03T23:59:59Z",
  },

  // UPCOMING 1
  {
    id: "nexura-upcoming-1",
    title: "Nexura Engagement Quest",
    description: "A new engagement challenge launching soon.",
    project_image: "/campaign.png",
    rewardPool: "1,500 XP",
    rewardPerUser: "100 XP",
    maxUsers: 500,
    status: "upcoming",
    tasks: [],
starts_at: "2025-12-01T00:00:00Z",
ends_at: "2026-01-03T23:59:59Z",

  },

  // UPCOMING 2
  {
    id: "nexura-upcoming-2",
    title: "Partner Collab Quest",
    description: "Coming soon — Nexura x Partner campaign.",
    project_image: "/campaign.png",
    rewardPool: "3,000 XP",
    rewardPerUser: "120 XP",
    maxUsers: 300,
    status: "upcoming",
    tasks: [],
starts_at: "2025-12-01T00:00:00Z",
ends_at: "2026-01-03T23:59:59Z",

  }
];


router.get("/", (_req, res) => {
  res.json({
    oneTimeCampaigns: mockCampaigns.filter(c => c.status === "active"),
    featuredCampaigns: mockCampaigns.filter(c => c.status === "featured"),
    upcomingCampaigns: mockCampaigns.filter(c => c.status === "upcoming"),
  });
});

// ------ GET SINGLE CAMPAIGN ------
router.get("/:id", (req, res) => {
  const campaign = mockCampaigns.find((c) => c.id === req.params.id);
  if (!campaign) return res.status(404).json({ message: "Campaign not found" });
  res.json(campaign);
});


export default router;
