import { useAuth } from "@/lib/auth";
import { useLocation } from "wouter";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ProjectLogoutButton() {
  const auth = useAuth();
  const [, setLocation] = useLocation();

  const handleLogout = () => {
    try {
      auth.signOut();
    } catch (e) {
      fetch('/auth/logout', { method: 'POST', credentials: 'include' }).catch(() => {});
    }
    setLocation('/profile');
  };

  return (
    <Button
      onClick={handleLogout}
      variant="outline"
      size="sm"
      className="fixed bottom-4 left-4 z-50"
    >
      <LogOut className="mr-2 h-4 w-4" />
      Logout
    </Button>
  );
}
