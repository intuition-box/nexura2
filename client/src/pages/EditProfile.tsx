import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Save } from "lucide-react";
import { FaDiscord, FaTwitter } from "react-icons/fa";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function EditProfile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [profileData, setProfileData] = useState({
    displayName: "0xD524...9779",
    socialProfiles: {
      twitter: { connected: false, username: "" },
      discord: { connected: false, username: "" }
    }
  });

const handleSave = () => {
  localStorage.setItem("user_profile", JSON.stringify(profileData));

  toast({
    title: "Profile updated",
    description: "Your profile has been successfully updated.",
  });

  setLocation("/profile");
};


  const handleConnect = (service: "twitter" | "discord") => {
    // Redirect to actual social media connection sites
    const urls = {
      twitter: "https://twitter.com/i/oauth/authorize", // This would be configured with proper OAuth params
      discord: "https://discord.com/api/oauth2/authorize" // This would be configured with proper OAuth params
    };
    
    toast({
      title: `Connecting to ${service}`,
      description: `Opening ${service} authentication...`,
    });
    
    // Open in new tab for OAuth flow
    window.open(urls[service], '_blank', 'noopener,noreferrer');
  };

  const handleDisconnect = (service: "twitter" | "discord") => {
    setProfileData(prev => ({
      ...prev,
      socialProfiles: {
        ...prev.socialProfiles,
        [service]: { connected: false, username: "" }
      }
    }));
    toast({
      title: `Disconnected from ${service}`,
      description: `Your ${service} account has been disconnected.`,
    });
  };

  return (
    <div className="min-h-screen bg-background overflow-auto p-6" data-testid="edit-profile-page">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link href="/profile">
              <Button variant="ghost" size="sm" data-testid="button-back-to-profile">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Profile
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground">Edit Profile</h1>
          </div>
          <Button onClick={handleSave} data-testid="button-save-profile">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>

        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={profileData.displayName}
                onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                data-testid="input-display-name"
              />
            </div>
          </CardContent>
        </Card>

        {/* Social Profiles */}
        <Card>
          <CardHeader>
            <CardTitle>Social Profiles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Twitter/X */}
            <div className="flex items-center justify-between" data-testid="twitter-connection">
              <div className="flex items-center space-x-3">
                <FaTwitter className="w-6 h-6 text-[#1DA1F2]" />
                <div>
                  <p className="font-medium">X (Formerly Twitter)</p>
                  {profileData.socialProfiles.twitter.connected ? (
                    <p className="text-sm text-muted-foreground">@{profileData.socialProfiles.twitter.username}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  )}
                </div>
              </div>
              {profileData.socialProfiles.twitter.connected ? (
                <Button 
                  variant="outline" 
                  onClick={() => handleDisconnect("twitter")}
                  data-testid="button-disconnect-twitter"
                >
                  Disconnect
                </Button>
              ) : (
                <Button 
                  onClick={() => handleConnect("twitter")}
                  data-testid="button-connect-twitter"
                >
                  Connect
                </Button>
              )}
            </div>

            <Separator />

            {/* Discord */}
            <div className="flex items-center justify-between" data-testid="discord-connection">
              <div className="flex items-center space-x-3">
                <FaDiscord className="w-6 h-6 text-[#5865F2]" />
                <div>
                  <p className="font-medium">Discord</p>
                  {profileData.socialProfiles.discord.connected ? (
                    <p className="text-sm text-muted-foreground">@{profileData.socialProfiles.discord.username}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground">Not connected</p>
                  )}
                </div>
              </div>
              {profileData.socialProfiles.discord.connected ? (
                <Button 
                  variant="outline" 
                  onClick={() => handleDisconnect("discord")}
                  data-testid="button-disconnect-discord"
                >
                  Disconnect
                </Button>
              ) : (
                <Button 
                  onClick={() => handleConnect("discord")}
                  data-testid="button-connect-discord"
                >
                  Connect
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}