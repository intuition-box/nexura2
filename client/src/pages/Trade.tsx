import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart2, Activity, Trophy, Calendar, Gift } from "lucide-react";

export default function Trade() {
  return (
    <div className="min-h-screen bg-background overflow-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
  <Activity className="w-8 h-8 text-primary" />
</div>
          <h1 className="text-3xl font-bold text-foreground mb-4">Trade</h1>
        </div>

        <Card className="p-8" data-testid="coming-soon-card">
          <CardHeader className="text-center pb-6">
            <CardTitle className="text-xl font-bold">No Trade Data Yet</CardTitle>
          </CardHeader>
          <CardContent className="text-center text-muted-foreground">
            Trading functionality will appear here once the marketplace is live.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
