import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import siteLogo from "@assets/logo.png";

export default function Header() {
  const navItems = [
    { label: "Learn", href: "/learn", tag: "Free to use", implemented: false },
    { label: "Discover & Earn", href: "/", active: true, implemented: true },
    { label: "Studio", href: "/studio", implemented: true },
    { label: "Projects", href: "/projects", implemented: true },
    { label: "Community", href: "/community", implemented: false },
    { label: "Rewards", href: "/rewards", implemented: false },
    { label: "Signal", href: "/signal", implemented: false },
    { label: "Staking", href: "/staking", implemented: false },
    { label: "Trade", href: "/trade", implemented: false },
  ];

  const handleNavClick = (label: string) => {
    console.log(`${label} navigation clicked`); // todo: remove mock functionality
  };

  return (
    <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-50" data-testid="header-main">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3" data-testid="link-home">
            <div className="w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-primary to-accent flex items-center justify-center btn-float">
              <img src={siteLogo} alt="Nexura" className="w-7 h-7" />
            </div>
            <span className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground whitespace-nowrap">NEXURA</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const NavButton = (
                <Button
                  variant={item.active ? "secondary" : "ghost"}
                  className="relative text-sm font-medium hover-elevate"
                  data-testid={`nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
                  onClick={item.implemented ? undefined : () => handleNavClick(item.label)}
                >
                  {item.label}
                  {item.tag && (
                    <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-xs px-1 py-0.5 rounded text-[10px]">
                      {item.tag}
                    </span>
                  )}
                </Button>
              );

              if (item.implemented) {
                return (
                  <Link key={item.href} href={item.href}>
                    {NavButton}
                  </Link>
                );
              } else {
                return <div key={item.href}>{NavButton}</div>;
              }
            })}
          </nav>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-3">
            <Button 
              variant="default" 
              size="sm" 
              className="btn-shine btn-float btn-glow"
              data-testid="button-launch-activation"
              onClick={() => handleNavClick('Launch Activation')}
            >
              Launch Activation
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="btn-float"
              data-testid="button-intel"
              onClick={() => handleNavClick('Intel')}
            >
              Intel
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}