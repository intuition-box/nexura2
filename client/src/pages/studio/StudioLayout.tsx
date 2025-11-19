import React from "react";
import siteLogo from "@assets/logo.png";
import { Link } from "wouter";

export default function StudioLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-surface">
      <header className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center space-x-3">
          <img src={siteLogo} alt="Studio Nexura" className="w-10 h-10" />
          <div>
            <div className="text-lg font-extrabold">NEXURA STUDIO</div>
            <div className="text-xs text-muted-foreground">Project registration & management</div>
          </div>
        </div>
        <nav>
          <Link href="/" className="text-sm text-muted-foreground hover:underline">Back to Nexura</Link>
        </nav>
      </header>

      <main className="p-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
