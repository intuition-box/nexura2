// Simple manual test script for campaign/task creation and retrieval
// Usage: node server/scripts/test_campaign_tasks.cjs
// Ensure the server is running (e.g., npm run dev or node dist/index.js)

const BASE = process.env.BACKEND || 'http://localhost:5051';

async function run() {
  try {
    console.log('Posting test campaign...');
    const campaignPayload = {
      name: 'Test Campaign from script',
      description: 'A campaign created by automated script',
      startDate: new Date().toISOString(),
      endDate: null,
      rewards: { points: 10, referralEnabled: false },
      tasks: [
        {
          title: 'Visit website',
          description: 'Click the project website link',
          group: 'link',
          type: 'click_link',
          link: 'https://example.com',
          meta: { importance: 'low' }
        }
      ]
    };

    const createRes = await fetch(`${BASE}/api/projects/test-project/campaigns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(campaignPayload),
    });

    const text = await createRes.text();
    console.log('Create response status:', createRes.status);
    console.log(text);

    // If creation succeeded, try to parse JSON and fetch tasks
    if (createRes.ok) {
      const created = JSON.parse(text);
      const campaignId = created.id || created.campaign_id || created.id;
      if (campaignId) {
        const tasksRes = await fetch(`${BASE}/api/campaigns/${campaignId}/tasks`);
        console.log('Tasks status:', tasksRes.status);
        console.log(await tasksRes.text());
      }
    }
  } catch (e) {
    console.error('Test script error', e);
  }
}

run();
