import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";
import { Link, useLocation } from "wouter";

interface ProfileBarProps {
  userId?: string;
}

import { TIER_ORDER, TIER_DISPLAY, type Tier } from "@shared/schema";

export default function ProfileBar({ userId = "user-123" }: ProfileBarProps) {
  const [location] = useLocation();

  // Always declare hooks first
  const [userData] = useState({
    username: "0xD524...9779",
    xp: 175,
    questsCompleted: 12,
    tier: "illuminated" as Tier,
  });

  const currentTier = userData.tier;
  const tierNumber = TIER_ORDER[currentTier];
  const tierDisplayName = TIER_DISPLAY[currentTier];

  const [, setLocation] = useLocation();

  const handleLogout = () => {
    console.log("Logging out...");
    setLocation("/home");
  };

  // Conditionally render inside JSX
  const shouldRender = location !== "/" && location !== "/home";

  return shouldRender ? (
    <div className="flex items-center gap-4 ml-auto">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="relative h-12 w-12 rounded-full p-0"
            data-testid="profile-dropdown"
          >
            <Avatar className="h-12 w-12 border-2 border-border">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="h-6 w-6" />
              </AvatarFallback>
              <div className="absolute bottom-0 left-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full z-0"></div>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-64 p-2"
          align="end"
          data-testid="profile-dropdown-menu"
        >
          <DropdownMenuItem asChild>
            <Link
              href="/profile"
              className="w-full cursor-pointer p-3 text-base flex items-center"
            >
              <User className="mr-3 h-5 w-5" />
              <span>My Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleLogout}
            className="cursor-pointer p-3 text-base flex items-center"
          >
            <LogOut className="mr-3 h-5 w-5" />
            <span>Log Out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  ) : null;
}
