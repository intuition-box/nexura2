import WebSocket, { WebSocketServer } from "ws";

let wss: WebSocketServer | null = null;

export function initWebsocketServer(httpServer: any) {
  if (wss) return wss;
  wss = new WebSocketServer({ server: httpServer });
  wss.on("connection", (ws) => {
    try { ws.send(JSON.stringify({ type: "connected", ts: Date.now() })); } catch (e) {}
    ws.on("message", (msg) => {
      // noop for now
    });
  });
  return wss;
}

export function broadcast(payload: any) {
  if (!wss) return;
  const txt = JSON.stringify(payload);
  wss.clients.forEach((c: any) => {
    try { c.send(txt); } catch (e) {}
  });
}

export default { initWebsocketServer, broadcast };
