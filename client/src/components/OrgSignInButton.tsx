import React, { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/hooks/use-wallet";

export default function OrgSignInButton() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { connectWallet } = useWallet();

  const start = () => {
    setError(null);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setLoading(false);
    setError(null);
  };

  const handleConnect = async () => {
    setError(null);
    setLoading(true);
    try {
  // Use the central wallet hook; ask it NOT to reload the page so we can navigate
  const ok = await connectWallet({ noReload: true });
      if (!ok) throw new Error("Wallet connection failed");
      close();
      // After successful wallet connect, ask the server for user+profile
      try {
        const meRes = await fetch(buildUrl(`/api/me`), { credentials: 'include' });
        if (meRes.ok) {
          const json = await meRes.json().catch(() => ({}));
          // If this wallet owns a project, go directly to that project's dashboard.
          if (json?.hasProject && json?.projectId) {
            setLocation(`/project/${json.projectId}/dashboard`);
            return;
          }
          // If a server-side profile exists, go to the Studio dashboard.
          if (json?.hasProfile) {
            setLocation("/studio");
          } else {
            setLocation("/studio/register");
          }
        } else {
          // fallback to register page
          setLocation("/studio/register");
        }
      } catch (e) {
        setLocation("/studio/register");
      }
    } catch (e: any) {
      setError(e?.message ?? String(e));
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed left-4 bottom-4 z-50 flex flex-col items-start gap-2">
        <p className="text-xs text-white/60">Are you an Organization?</p>
        <Button size="sm" className="whitespace-nowrap" onClick={start}>
          Sign In
        </Button>
      </div>

      {open && (
        // ensure the modal sits above any site chrome; use an explicit high z-index
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={close} />
          <div className="relative bg-card rounded-xl p-6 w-full max-w-md mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold mb-2">Organization Sign In</h3>
            <p className="text-sm text-muted-foreground mb-4">Connect your wallet to sign into Nexura Studio.</p>

            {error && <div className="text-sm text-destructive mb-3">{error}</div>}

            <div className="flex items-center gap-3">
              <Button size="default" className="btn-float" onClick={handleConnect} disabled={loading}>
                {loading ? "Connecting…" : "Connect Wallet"}
              </Button>
              <Button variant="outline" size="default" onClick={close} disabled={loading}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
