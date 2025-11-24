import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import layer3Logo from "@assets/generated_images/Layer3_project_logo_ebf532c0.png";
import userAvatar from "@assets/generated_images/User_avatar_Web3_0f8d9459.png";

export default function HeroSection() {
  return (
    <div className="bg-gradient-to-br from-background via-background to-card py-16 px-4" data-testid="hero-section">
      <div className="max-w-7xl mx-auto">
        {/* Main Hero */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4" data-testid="hero-title">
            Grow with Layer3
          </h1>
          <p className="text-xl text-muted-foreground mb-8" data-testid="hero-subtitle">
            Create impact onchain and earn
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button size="lg" className="bg-primary hover:bg-primary/90" data-testid="button-launch-activation-hero">
              Launch Activation
            </Button>
            <Button size="lg" variant="outline" data-testid="button-intel-hero">
              Intel
            </Button>
          </div>
        </div>

        {/* Featured Quest Card */}
        <Card className="max-w-2xl mx-auto p-8 bg-card/50 backdrop-blur-sm border-card-border hover-elevate" data-testid="featured-quest-card">
          <div className="flex items-start space-x-4">
            <img src={layer3Logo} alt="Layer3" className="w-16 h-16 rounded-full" />
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <span className="bg-accent/20 text-accent px-2 py-1 rounded text-sm font-medium">
                  Activation
                </span>
              </div>
              <h3 className="text-2xl font-bold text-card-foreground mb-2">Get Started</h3>
              <p className="text-muted-foreground mb-4">
                Learn crypto through curated lessons at your own pace, and mint CUBEs as your proof of progress at no cost.
              </p>
              
              <div className="flex items-center space-x-4">
                <div className="flex -space-x-2">
                  {[...Array(3)].map((_, i) => (
                    <img
                      key={i}
                      src={userAvatar}
                      alt="Participant"
                      className="w-8 h-8 rounded-full border-2 border-card"
                    />
                  ))}
                </div>
                <div>
                  <div className="text-lg font-bold text-card-foreground">29K</div>
                  <div className="text-sm text-muted-foreground">Participants</div>
                </div>
                <div className="ml-auto">
                  <div className="text-lg font-bold text-card-foreground">133</div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}