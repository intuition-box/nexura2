type SessionChangeCb = (token: string | null) => void;

const KEY = "accessToken";
const listeners = new Set<SessionChangeCb>();

export function getSessionToken(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function setSessionToken(token: string) {
  try {
    localStorage.setItem(KEY, token);
    listeners.forEach((cb) => cb(token));
  } catch { /* ignore */ }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
    listeners.forEach((cb) => cb(null));
  } catch { /* ignore */ }
}

export function onSessionChange(cb: SessionChangeCb) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function emitSessionChange() {
  const token = getSessionToken();
  listeners.forEach((cb) => cb(token));
}

export default { getSessionToken, setSessionToken, clearSession, onSessionChange };
