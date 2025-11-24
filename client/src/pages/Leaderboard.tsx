import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const rankColors = {
  1: "text-yellow-400",
  2: "text-gray-300",
  3: "text-amber-600",
};

export default function Leaderboard() {
  const leaderboardData = [
    { id: 1, name: "Shebah", avatar: "https://i.pravatar.cc/40?img=1", xp: 820, tTrust: 12.4 },
    { id: 2, name: "Liam", avatar: "https://i.pravatar.cc/40?img=4", xp: 640, tTrust: 4.2 },
    { id: 3, name: "Promise", avatar: "https://i.pravatar.cc/40?img=2", xp: 500, tTrust: 9.1 },
    { id: 4, name: "Daniel", avatar: "https://i.pravatar.cc/40?img=3", xp: 420, tTrust: 7.8 },
    { id: 5, name: "Emma", avatar: "https://i.pravatar.cc/40?img=5", xp: 780, tTrust: 11.2 },
    { id: 6, name: "Noah", avatar: "https://i.pravatar.cc/40?img=6", xp: 670, tTrust: 6.5 },
    { id: 7, name: "Olivia", avatar: "https://i.pravatar.cc/40?img=7", xp: 590, tTrust: 8.3 },
    { id: 8, name: "Ethan", avatar: "https://i.pravatar.cc/40?img=8", xp: 550, tTrust: 5.7 },
    { id: 9, name: "Sophia", avatar: "https://i.pravatar.cc/40?img=9", xp: 510, tTrust: 7.1 },
    { id: 10, name: "Mason", avatar: "https://i.pravatar.cc/40?img=10", xp: 480, tTrust: 4.9 },
  ];

  const userRank = { rank: 1, name: "Shebah", avatar: "https://i.pravatar.cc/40?img=1", xp: 820, tTrust: 12.4 };

  const displayData = [...leaderboardData];
  displayData.splice(4, 0, { ...userRank, isCurrentUser: true });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">Leaderboard</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {displayData.map((user, index) => {
              const rank = index + 1;
              const top3Style = rankColors[rank] || "text-gray-400";

              const highlight =
                user.isCurrentUser ? "border-blue-400 bg-blue-400/10 shadow-sm" : "border-muted";

              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${highlight}`}
                >
                  {/* LEFT SIDE: rank + avatar + name */}
                  <div className="flex items-center gap-3">
                    <span className={`w-8 text-sm font-bold ${top3Style}`}>#{rank}</span>

                    <img
                      src={user.avatar}
                      alt={user.name}
                      className={`w-10 h-10 rounded-full border ${
                        user.isCurrentUser ? "border-blue-400" : "border-gray-300"
                      }`}
                    />

                    <div className="flex flex-col">
                      <span
                        className={`font-medium text-sm ${
                          user.isCurrentUser ? "text-blue-600" : "text-foreground"
                        }`}
                      >
                        {user.name}
                      </span>

                      {user.isCurrentUser && (
                        <span className="text-xs text-blue-500">Your Position</span>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDE: metrics */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex flex-col items-end">
                      <span className="font-semibold">{user.xp}</span>
                      <span className="text-[10px] text-muted-foreground">XP</span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-semibold">{user.tTrust}</span>
                      <span className="text-[10px] text-muted-foreground">tTRUST</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
