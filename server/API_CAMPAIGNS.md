Campaigns & Tasks API

Overview
- Campaigns are created under a project: POST /api/projects/:projectId/campaigns
- Campaign tasks are stored in the `campaign_tasks` table (or in-memory map for dev)
- Task-specific freeform data (link, meta, etc.) is stored in `verification_config` (JSON) so Postgres/Neon persists it

Create campaign payload (example)
{
  "name": "Campaign name",
  "description": "Description",
  "startDate": "2025-11-29T00:00:00Z",
  "endDate": null,
  "rewards": { "points": 10, "referralEnabled": false },
  "tasks": [
    {
      "title": "Join Discord",
      "description": "Join our Discord server",
      "group": "discord",
      "type": "join_server",
      "link": "https://discord.gg/...",
      "meta": { "channel": "general" }
    }
  ]
}

Notes
- The server normalizes incoming task objects by mapping `group` -> `taskCategory`, `type` -> `taskSubtype` and embeds `link` and `meta` into `verification_config` so it persists across storage backends.
- Campaign visibility: only published campaigns (is_active = 1 / isActive = true) expose tasks to public GET /api/campaigns/:campaignId/tasks. Project owners (authenticated session matching owner user id or owner address) can access tasks for unpublished campaigns (for preview/editing).
- Only project owners may create/update/delete tasks for a campaign. Attempting to modify tasks as a non-owner returns 403.

Manual test script
- A small test script is provided at `server/scripts/test_campaign_tasks.cjs` which POSTs a test campaign and retrieves tasks. Run with:

node server/scripts/test_campaign_tasks.cjs

Ensure the server is running and replace the project id in the script with a valid project id for your environment (the script uses `test-project` by default).
