import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen, Clock } from "lucide-react";

export default function Learn() {
  return (
    <div className="min-h-screen bg-background overflow-auto p-6" data-testid="learn-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Learn</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Educational content and tutorials about Web3, blockchain, and the Intuition ecosystem.
          </p>
        </div>
        
        {/* Coming Soon Card */}
        <Card className="p-8" data-testid="coming-soon-card">
          <CardHeader className="text-center pb-6">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl font-bold">No Learning Materials Available</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              We're currently preparing comprehensive learning materials about Web3, DeFi, and Intuition. 
              Check back soon for tutorials, guides, and educational content.
            </p>
            <div className="text-sm text-muted-foreground">
              Coming soon: Interactive tutorials, video guides, and step-by-step walkthroughs
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}