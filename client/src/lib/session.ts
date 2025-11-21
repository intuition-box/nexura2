type SessionChangeCb = (token: string | null) => void;

const KEY = "accessToken";
const listeners = new Set<SessionChangeCb>();

export function getSessionToken(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function setSessionToken(token: string) {
  try {
    localStorage.setItem(KEY, token);
    listeners.forEach((cb) => {
      try {
        const res = cb(token);
        if (res && typeof (res as any).catch === "function") {
          // handle rejected promises from async listeners
          (res as Promise<any>).catch((e) => {
            console.warn("session listener rejected:", e);
          });
        }
      } catch (e) {
        console.warn("session listener threw:", e);
      }
    });
  } catch { /* ignore */ }
}

export function clearSession() {
  try {
    localStorage.removeItem(KEY);
    listeners.forEach((cb) => {
      try {
        const res = cb(null);
        if (res && typeof (res as any).catch === "function") {
          (res as Promise<any>).catch((e) => {
            console.warn("session listener rejected:", e);
          });
        }
      } catch (e) {
        console.warn("session listener threw:", e);
      }
    });
  } catch { /* ignore */ }
}

export function onSessionChange(cb: SessionChangeCb) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function emitSessionChange() {
  const token = getSessionToken();
  listeners.forEach((cb) => {
    try {
      const res = cb(token);
      if (res && typeof (res as any).catch === "function") {
        (res as Promise<any>).catch((e) => {
          console.warn("session listener rejected:", e);
        });
      }
    } catch (e) {
      console.warn("session listener threw:", e);
    }
  });
}

export default { getSessionToken, setSessionToken, clearSession, onSessionChange };
