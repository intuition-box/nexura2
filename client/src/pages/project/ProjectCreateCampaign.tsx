import React, { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import AnimatedBackground from "@/components/AnimatedBackground";

type Task = {
  id: string;
  group?: string;
  type?: string;
  title?: string;
  description?: string;
  link?: string;
  meta?: Record<string, any>;
};

export default function ProjectCreateCampaign() {
  const [location, setLocation] = useLocation();
  const m = location.match(/^\/project\/([^\/]+)/);
  const projectId = m ? m[1] : "unknown";

  const [tab, setTab] = useState<number>(0);
  const tabTitles = useMemo(() => ["Details", "Tasks", "Rewards & Referrals"], []);

  // Details
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [detailErrors, setDetailErrors] = useState<string[]>([]);

  // Tasks
  const [tasks, setTasks] = useState<Task[]>([{ id: Math.random().toString(36).slice(2, 9) }]);
  const [selectedTaskIndex, setSelectedTaskIndex] = useState<number>(0);
  const [taskErrors, setTaskErrors] = useState<string[]>([]);

  // Rewards
  const [rewardPoints, setRewardPoints] = useState<number | "">("");
  const [referralEnabled, setReferralEnabled] = useState<boolean>(false);
  const [rewardErrors, setRewardErrors] = useState<string[]>([]);

  const addTask = () => {
    const id = Math.random().toString(36).slice(2, 9);
    setTasks((s) => {
      const next = [...s, { id }];
      setSelectedTaskIndex(next.length - 1);
      return next;
    });
  };

  const removeTask = (id: string) => {
    const idx = tasks.findIndex((t) => t.id === id);
    if (idx === -1) return;
    const newTasks = tasks.filter((t) => t.id !== id);
    setTasks(newTasks);
    if (selectedTaskIndex >= newTasks.length) setSelectedTaskIndex(Math.max(0, newTasks.length - 1));
  };

  const getTaskOptionsForGroup = (group?: string) => {
    if (!group) return [] as { value: string; label: string }[];
    switch (group) {
      case "discord":
        return [
          { value: "join_server", label: "Join server" },
          { value: "verify_role", label: "Verify role" },
        ];
      case "twitter":
        return [
          { value: "like_post", label: "Like a post" },
          { value: "share_post", label: "Share a post" },
          { value: "retweet", label: "Retweet" },
          { value: "quote", label: "Quote" },
          { value: "follow", label: "Follow" },
          { value: "bookmark", label: "Bookmark" },
        ];
      case "poh":
        return [
          { value: "passport_xyz", label: "Passport.xyz verify" },
          { value: "authena", label: "Authena verify" },
        ];
      case "onchain":
        return [
          { value: "verify_holding_token", label: "Verify token holding" },
          { value: "verify_holding_nft", label: "Verify NFT holding" },
          { value: "mint_nft", label: "Mint NFT" },
          { value: "defi_action", label: "DeFi action" },
        ];
      case "quiz":
        return [
          { value: "scored_quiz", label: "Scored quiz" },
          { value: "casual_quiz", label: "Casual quiz" },
        ];
      case "telegram":
        return [
          { value: "join_group", label: "Join group" },
          { value: "join_channel", label: "Join channel" },
        ];
      case "link":
        return [{ value: "click_link", label: "Click a link" }];
      default:
        return [] as { value: string; label: string }[];
    }
  };

  const validateDetails = () => {
    const errs: string[] = [];
    if (!name.trim()) errs.push("Campaign name is required");
    if (!description.trim()) errs.push("Description is required");
    if (!startDate) errs.push("Start date is required");
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) errs.push("End date must be after start date");
    setDetailErrors(errs);
    return errs.length === 0;
  };

  const validateTasks = () => {
    const errs: string[] = [];
    if (tasks.length === 0) errs.push("At least one task is required for the campaign");
    tasks.forEach((t, i) => {
      if (!t.group) errs.push(`Task ${i + 1}: group is required`);
      if (!t.type) errs.push(`Task ${i + 1}: type is required`);
      if (!t.title || !t.title.trim()) errs.push(`Task ${i + 1}: title is required`);
      if (t.group === "link" && (!t.link || !t.link.trim())) errs.push(`Task ${i + 1}: link is required for link tasks`);
    });
    setTaskErrors(errs);
    return errs.length === 0;
  };

  const validateRewards = () => {
    const errs: string[] = [];
    const pts = typeof rewardPoints === "number" ? rewardPoints : 0;
    if (pts <= 0 && !referralEnabled) errs.push("Set reward points (positive) or enable referrals");
    setRewardErrors(errs);
    return errs.length === 0;
  };

  function goNext() {
    if (tab === 0) {
      if (!validateDetails()) return;
      setTab(1);
    } else if (tab === 1) {
      if (!validateTasks()) return;
      setTab(2);
    }
  }

  function goBack() {
    if (tab > 0) setTab(tab - 1);
  }

  async function submitCampaign() {
    if (!validateDetails()) {
      setTab(0);
      return;
    }
    if (!validateTasks()) {
      setTab(1);
      return;
    }
    if (!validateRewards()) {
      setTab(2);
      return;
    }

    const payload = {
      projectId,
      name: name.trim(),
      description: description.trim(),
      startDate: startDate || null,
      endDate: endDate || null,
      rewards: { points: typeof rewardPoints === "number" ? rewardPoints : 0, referralEnabled },
      tasks,
    };

    try {
      const res = await fetch(`/api/projects/${projectId}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Failed to create campaign");
      }
      setLocation(`/project/${projectId}/campaigns`);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("create campaign error", err);
      alert("Failed to create campaign: " + (err instanceof Error ? err.message : String(err)));
    }
  }

  return (
    <div className="min-h-screen bg-black text-white overflow-auto p-6 relative" data-testid="project-create-campaign-page">
      <AnimatedBackground />
      <div className="max-w-4xl mx-auto space-y-8 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Create Campaign</h1>
            <p className="text-sm text-muted-foreground mt-1">Creating a campaign for project: {projectId}</p>
          </div>
          <div>
            <button
              type="button"
              className="rounded-full px-3 py-1 text-sm bg-transparent border border-border/20 hover:bg-white/5"
              onClick={() => setLocation(`/project/${projectId}/campaigns`)}
            >
              Back to campaigns
            </button>
          </div>
        </div>

        <div className="mt-6">
          <div className="flex gap-2">
            {tabTitles.map((tTitle, idx) => (
              <button
                key={tTitle}
                onClick={() => setTab(idx)}
                className={`px-4 py-2 rounded-md ${tab === idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                {tTitle}
              </button>
            ))}
          </div>

          <div className="mt-6 rounded-md border border-border/30 bg-card p-6 relative">
            {tab === 0 && (
              <div>
                <h2 className="text-lg font-semibold">Campaign Details</h2>
                <div className="mt-4 grid grid-cols-1 gap-4">
                  <label className="flex flex-col">
                    <span className="text-sm font-medium">Campaign name *</span>
                    <input value={name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setName(e.target.value)} className="mt-1 input w-full" />
                  </label>
                  <label className="flex flex-col">
                    <span className="text-sm font-medium">Description *</span>
                    <textarea value={description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)} className="mt-1 textarea w-full" rows={4} />
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex flex-col">
                      <span className="text-sm font-medium">Start date *</span>
                      <input type="date" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} className="mt-1 input" />
                    </label>
                    <label className="flex flex-col">
                      <span className="text-sm font-medium">End date</span>
                      <input type="date" value={endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} className="mt-1 input" />
                    </label>
                  </div>
                  {detailErrors.length > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      {detailErrors.map((d) => <div key={d}> {d}</div>)}
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === 1 && (
              <div>
                <h2 className="text-lg font-semibold">Tasks</h2>
                <p className="text-sm text-muted-foreground mt-1">Add tasks that users will complete as part of this campaign.</p>
                <div className="mt-4">
                  <div className="flex gap-2 items-center overflow-x-auto">
                    {tasks.map((t, idx) => (
                      <button
                        key={t.id}
                        onClick={() => setSelectedTaskIndex(idx)}
                        className={`px-3 py-1 rounded-md ${selectedTaskIndex === idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                        {t.title ?? `Task ${idx + 1}`}
                      </button>
                    ))}
                    <div className="flex-1" />
                  </div>

                  {tasks[selectedTaskIndex] && (
                    <div className="mt-4 grid grid-cols-1 gap-3">
                      <label className="flex flex-col">
                        <span className="text-sm font-medium">Task group</span>
                        <select
                          value={tasks[selectedTaskIndex].group ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const newTasks = [...tasks];
                            newTasks[selectedTaskIndex] = { ...newTasks[selectedTaskIndex], group: e.target.value, type: '' };
                            setTasks(newTasks);
                          }}
                          className="mt-1 input w-full"
                        >
                          <option value="">Select group</option>
                          <option value="discord">Discord</option>
                          <option value="twitter">Twitter</option>
                          <option value="poh">Proof of Humanity</option>
                          <option value="onchain">On-chain</option>
                          <option value="quiz">Quiz</option>
                          <option value="telegram">Telegram</option>
                          <option value="link">Link</option>
                        </select>
                      </label>

                      <label className="flex flex-col">
                        <span className="text-sm font-medium">Task type</span>
                        <select
                          value={tasks[selectedTaskIndex].type ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                            const newTasks = [...tasks];
                            newTasks[selectedTaskIndex] = { ...newTasks[selectedTaskIndex], type: e.target.value };
                            setTasks(newTasks);
                          }}
                          className="mt-1 input w-full"
                        >
                          <option value="">Select task</option>
                          {getTaskOptionsForGroup(tasks[selectedTaskIndex].group).map((opt) => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </select>
                      </label>

                      <label className="flex flex-col">
                        <span className="text-sm font-medium">Task name</span>
                        <input
                          value={tasks[selectedTaskIndex].title ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newTasks = [...tasks];
                            newTasks[selectedTaskIndex] = { ...newTasks[selectedTaskIndex], title: e.target.value };
                            setTasks(newTasks);
                          }}
                          className="mt-1 input w-full"
                        />
                      </label>

                      <label className="flex flex-col">
                        <span className="text-sm font-medium">Task description</span>
                        <textarea
                          value={tasks[selectedTaskIndex].description ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                            const newTasks = [...tasks];
                            newTasks[selectedTaskIndex] = { ...newTasks[selectedTaskIndex], description: e.target.value };
                            setTasks(newTasks);
                          }}
                          className="mt-1 textarea w-full"
                          rows={3}
                        />
                      </label>

                      <label className="flex flex-col">
                        <span className="text-sm font-medium">Task link (if applicable)</span>
                        <input
                          value={tasks[selectedTaskIndex].link ?? ''}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            const newTasks = [...tasks];
                            newTasks[selectedTaskIndex] = { ...newTasks[selectedTaskIndex], link: e.target.value };
                            setTasks(newTasks);
                          }}
                          className="mt-1 input w-full"
                        />
                      </label>

                      <div className="flex items-center gap-2">
                        <button className="px-4 py-2 rounded-md bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-lg hover:shadow-xl hover:scale-105 active:scale-95" onClick={() => removeTask(tasks[selectedTaskIndex].id)}>Remove task</button>
                      </div>
                    </div>
                  )}

                  {taskErrors.length > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      {taskErrors.map((d) => <div key={d}> {d}</div>)}
                    </div>
                  )}

                  <div className="mt-4">
                    <h3 className="text-sm font-medium">Current tasks</h3>
                    <ul className="mt-2 space-y-2">
                      {tasks.map((t) => (
                        <li key={t.id} className="flex items-start justify-between bg-muted p-3 rounded-md">
                          <div>
                            <div className="font-medium">{t.title ?? 'Untitled'}</div>
                            {t.description && <div className="text-sm text-muted-foreground">{t.description}</div>}
                          </div>
                          <div>
                            <button className="text-red-600 text-sm" onClick={() => removeTask(t.id)}>Remove</button>
                          </div>
                        </li>
                      ))}
                      {tasks.length === 0 && <li className="text-sm text-muted-foreground">No tasks yet</li>}
                    </ul>
                  </div>

                  <div className="absolute right-6 bottom-6">
                    <button title="Add task" aria-label="Add task" className="rounded-full bg-primary text-white w-12 h-12 flex items-center justify-center shadow-lg" onClick={addTask}>+</button>
                  </div>
                </div>
              </div>
            )}

            {tab === 2 && (
              <div>
                <h2 className="text-lg font-semibold">Rewards & Referrals</h2>
                <div className="mt-4 grid grid-cols-1 gap-4">
                  <label className="flex flex-col">
                    <span className="text-sm font-medium">Reward points per completion</span>
                    <input type="number" min={0} value={rewardPoints === '' ? '' : rewardPoints} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRewardPoints(e.target.value === '' ? '' : Number(e.target.value))} className="mt-1 input w-40" />
                  </label>

                  <label className="flex items-center gap-2">
                    <input type="checkbox" checked={referralEnabled} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReferralEnabled(e.target.checked)} />
                    <span className="text-sm">Enable referral bonuses for this campaign</span>
                  </label>

                  {rewardErrors.length > 0 && (
                    <div className="mt-2 text-sm text-red-600">
                      {rewardErrors.map((d) => <div key={d}> {d}</div>)}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between">
              <div>
                <button className="px-4 py-2 rounded-md bg-transparent text-white/70 hover:text-white hover:bg-white/5 hover:scale-105" onClick={goBack} disabled={tab === 0}>Back</button>
              </div>
              <div className="flex items-center gap-2">
                {tab < 2 ? (
                  <button className="px-4 py-2 rounded-md bg-white text-black shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95" onClick={goNext}>Next</button>
                ) : (
                  <button className="px-4 py-2 rounded-md bg-white text-black shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95" onClick={submitCampaign}>Create Campaign</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
