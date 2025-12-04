import handler from './server';

// Catch-all Vercel serverless function to route every /api/* request to the Express wrapper
export default async function allHandler(req: any, res: any) {
  // Delegate to the server wrapper which dynamically loads your Express app.
  return handler(req, res);
}
