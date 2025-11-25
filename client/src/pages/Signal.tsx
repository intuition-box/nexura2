import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, BarChart3 } from "lucide-react";

export default function Signal() {
  return (
    <div className="min-h-screen bg-background overflow-auto p-6" data-testid="signal-page">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Signal</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Analytics, insights, and data-driven intelligence for the Intuition ecosystem.
          </p>
        </div>

        {/* Coming Soon Card */}
        <Card className="p-8" data-testid="coming-soon-card">
          <CardHeader className="text-center pb-6">
            <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-6 h-6 text-muted-foreground" />
            </div>
            <CardTitle className="text-xl font-bold">No Analytics Available</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-muted-foreground mb-4">
              We're developing comprehensive analytics and insights tools to help you track ecosystem growth,
              quest completion rates, and TRUST token metrics across the Intuition testnet.
            </p>
            <div className="text-sm text-muted-foreground">
              Coming soon: Real-time analytics, trend analysis, and ecosystem insights
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}