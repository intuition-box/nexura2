import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { apiRequestV2 } from "@/lib/queryClient";
import { useState, useEffect } from "react";

const rankColors: Record<number, string> = {
  1: "text-yellow-400",
  2: "text-gray-300",
  3: "text-amber-600",
};

interface Leaderboard {
  leaderboardByXp: {
    id: string;
    username: string;
    avatar: string;
    xp: number;
    trust: number;
  }[];
  leaderboardByTrust: {
    id: string;
    username: string;
    avatar: string;
    xp: number;
    trust: number;
  }[];
}

export default function Leaderboard() {
  const [leaderboardData, setLeaderboardData] = useState<Leaderboard>({ leaderboardByXp: [], leaderboardByTrust: [] });
  const storedData = localStorage.getItem("user_profile");
  const userData = JSON.parse(storedData || "{}");
  // const leaderboardData = [
  //   { id: 1, name: "Shebah", avatar: "https://i.pravatar.cc/40?img=1", xp: 820, trust: 12.4 },
  //   { id: 2, name: "Liam", avatar: "https://i.pravatar.cc/40?img=4", xp: 640, trust: 4.2 },
  //   { id: 3, name: "Promise", avatar: "https://i.pravatar.cc/40?img=2", xp: 500, trust: 9.1 },
  //   { id: 4, name: "Daniel", avatar: "https://i.pravatar.cc/40?img=3", xp: 420, trust: 7.8 },
  //   { id: 5, name: "Emma", avatar: "https://i.pravatar.cc/40?img=5", xp: 780, trust: 11.2 },
  //   { id: 6, name: "Noah", avatar: "https://i.pravatar.cc/40?img=6", xp: 670, trust: 6.5 },
  //   { id: 7, name: "Olivia", avatar: "https://i.pravatar.cc/40?img=7", xp: 590, trust: 8.3 },
  //   { id: 8, name: "Ethan", avatar: "https://i.pravatar.cc/40?img=8", xp: 550, trust: 5.7 },
  //   { id: 9, name: "Sophia", avatar: "https://i.pravatar.cc/40?img=9", xp: 510, trust: 7.1 },
  //   { id: 10, name: "Mason", avatar: "https://i.pravatar.cc/40?img=10", xp: 480, trust: 4.9 },
  // ];

  useEffect(() => {
    (async () => {
      const leaderboardResponseData = await apiRequestV2("GET", "/api/leaderboard");
      setLeaderboardData(leaderboardResponseData);
    })();
  }, []);

  // const userRank = { rank: 1, name: "Shebah", avatar: "https://i.pravatar.cc/40?img=1", xp: 820, trust: 12.4 };

  const currentUser = leaderboardData.leaderboardByXp.find((data) => data.username === userData.displayName);
  // displayData.splice(4, 0, { ...userRank, isCurrentUser: true });

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="p-6">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-center">Leaderboard</CardTitle>
          </CardHeader>

          <CardContent className="space-y-2">
            {leaderboardData ? (leaderboardData.leaderboardByXp.map((user, index) => {
              const rank = index + 1;
              const top3Style = rankColors[rank] || "text-gray-400";

              const highlight =
                currentUser ? "border-blue-400 bg-blue-400/10 shadow-sm" : "border-muted";

              return (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${highlight}`}
                >
                  {/* LEFT SIDE: rank + avatar + name */}
                  <div className="flex items-center gap-3">
                    <span className={`w-8 text-sm font-bold ${top3Style}`}>#{rank}</span>

                    <img
                      src={user.avatar ?? "https://i.pravatar.cc/40?img=1"}
                      alt={user.username}
                      className={`w-10 h-10 rounded-full border ${currentUser ? "border-blue-400" : "border-gray-300"
                        }`}
                    />

                    <div className="flex flex-col">
                      <span
                        className={`font-medium text-sm ${currentUser ? "text-blue-600" : "text-foreground"
                          }`}
                      >
                        {user.username}
                      </span>

                      {currentUser && (
                        <span className="text-xs text-blue-500">Your Position</span>
                      )}
                    </div>
                  </div>

                  {/* RIGHT SIDE: metrics */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex flex-col items-end">
                      <span className="font-semibold">{user.xp || 0}</span>
                      <span className="text-[10px] text-muted-foreground">XP</span>
                    </div>

                    <div className="flex flex-col items-end">
                      <span className="font-semibold">{user.trust || 0}</span>
                      <span className="text-[10px] text-muted-foreground">TRUST</span>
                    </div>
                  </div>
                </div>
              );
            })) : "Hurry up and get on the leaderboard, quick!."}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}