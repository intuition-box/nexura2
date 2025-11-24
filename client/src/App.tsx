import { Switch, Route, useLocation } from "wouter";
import { useEffect } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

import NotFound from "@/pages/not-found";
import { Home } from "@/pages/Home";
import Discover from "@/pages/Discover";
import Rewards from "@/pages/Rewards";
import Learn from "@/pages/Learn";
import Campaigns from "@/pages/Campaigns";
import Quests from "@/pages/Quests";
import EcosystemDapps from "@/pages/EcosystemDapps";
import Referrals from "@/pages/Referrals";
import QuestEnvironment from "@/pages/QuestEnvironment";
import CampaignEnvironment from "@/pages/CampaignEnvironment";
import Profile from "@/pages/Profile";
import EditProfile from "@/pages/EditProfile";
import Tiers from "@/pages/Tiers";
import Trade from "@/pages/Trade";
import Leaderboard from "@/pages/Leaderboard";
import Analytics from "@/pages/Analytics"

import QuestflowSidebar from "@/components/QuestflowSidebar";
import ProfileBar from "@/components/ProfileBar";

// Redirect component for root "/"
function RedirectToHome() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/home");
  }, [setLocation]);
  return null;
}

function Router() {
  return (
    <Switch>
      <Route path="/home" component={Home} />
      <Route path="/discover" component={Discover} />
      <Route path="/learn" component={Learn} />
      <Route path="/quests" component={Quests} />
      <Route path="/campaigns" component={Campaigns} />
      <Route path="/ecosystem-dapps" component={EcosystemDapps} />
      <Route path="/referrals" component={Referrals} />
      <Route path="/quest/:questId" component={QuestEnvironment} />
      <Route path="/campaign/:campaignId" component={CampaignEnvironment} />
      <Route path="/trade" component={Trade} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile/edit" component={EditProfile} />
      <Route path="/tiers" component={Tiers} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [location] = useLocation();

  // Hide sidebar, header, ProfileBar on /home
  const hideLayout = location === "/home";

  const sidebarStyle = {
    "--sidebar-width": "18rem",
    "--sidebar-width-icon": "4rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <SidebarProvider style={sidebarStyle as React.CSSProperties}>
          <div className="flex h-screen w-full bg-background">
            {/* Sidebar */}
            {!hideLayout && <QuestflowSidebar />}

            <div className="flex flex-col flex-1">
              {/* Header */}
              {!hideLayout && (
                <header className="flex items-center justify-between p-3 border-b border-border bg-background">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ProfileBar />
                </header>
              )}

              {/* Main content */}
              <main className="flex-1 overflow-y-auto">
                {/* Redirect root "/" visitors to /home */}
                {location === "/" && <RedirectToHome />}
                <Router />
              </main>
            </div>
          </div>
        </SidebarProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
