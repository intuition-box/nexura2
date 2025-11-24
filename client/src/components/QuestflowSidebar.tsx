import { 
  Sidebar, 
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar";
import { 
  BookOpen, 
  Compass, 
  Users, 
  Zap, 
  Calendar, 
  Target, 
  Activity, 
  TrendingUp,
  BarChart2
} from "lucide-react";
import { Link, useLocation } from "wouter";

const mainNavItems = [
  { title: "Learn", icon: BookOpen, href: "/learn" },
  { title: "Explore", icon: Compass, href: "/discover" },
  { title: "Referrals", icon: Users, href: "/referrals" },
  { title: "Quests", icon: Zap, href: "/quests" },
  { title: "Campaigns", icon: Calendar, href: "/campaigns" },
  { title: "Ecosystem Dapps", icon: Target, href: "/ecosystem-dapps" },
  { title: "Trade", icon: Activity, href: "/trade" },
  { title: "Leaderboard", icon: TrendingUp, href: "/leaderboard" },
  { title: "Analytics", icon: BarChart2, href: "/analytics" },
];

export default function QuestflowSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar className="border-r border-border/40 sm:w-64">
      <SidebarContent className="bg-background">
        {/* Logo */}
        <div className="p-6 border-b border-border/40">
          <Link href="/home" className="flex items-center">
            <img
              src="/nexura-logo.jpg"
              alt="Nexura Logo"
              className="h-10 w-auto object-contain"
            />
          </Link>
        </div>

        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive =
                  location === item.href ||
                  (item.href === "/" &&
                    (location === "/" || location === "/discover"));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                        isActive
                          ? "bg-primary/10 text-primary font-semibold"
                          : "text-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Link
                        href={item.href}
                        className="flex w-full items-center gap-3"
                      >
                        <item.icon className="w-4 h-4" />
                        <span className="text-base font-medium">{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
