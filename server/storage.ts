import { type User, type InsertUser, type ReferralEvent, type InsertReferralEvent, type ReferralClaim, type InsertReferralClaim, type ReferralStats } from "@shared/schema";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
// optional Neon/Postgres-backed storage
let NeonPool: any = null;
try {
  // lazy require so local dev without the env doesn't crash
  // @neondatabase/serverless provides a createPool compatible API
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createPool } = require("@neondatabase/serverless");
  if (process.env.DATABASE_URL) {
    NeonPool = createPool(process.env.DATABASE_URL);
  }
} catch (e) {
  // ignore - dependency may not be available in some envs
}

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByAddress(address: string): Promise<User | undefined>;
  createProject(project: any): Promise<any>;
  getProjectById(id: string): Promise<any | undefined>;
  listProjects(): Promise<any[]>;
  createUser(user: InsertUser): Promise<User>;
  
  // Referral system methods
  createReferralEvent(event: InsertReferralEvent): Promise<ReferralEvent>;
  getReferralEventsByReferrer(referrerId: string): Promise<ReferralEvent[]>;
  createReferralClaim(claim: InsertReferralClaim): Promise<ReferralClaim>;
  getReferralClaimsByUser(userId: string): Promise<ReferralClaim[]>;
  getReferralStats(userId: string): Promise<ReferralStats>;
  // XP & NFT helpers
  getUserProfile(userId: string): Promise<any | undefined>;
  updateUserProfile(userId: string, updates: { displayName?: string; avatar?: string; socialProfiles?: any }): Promise<void>;
  addXpToUser(
    userId: string,
    xpAmount: number,
    options?: { questsCompletedInc?: number; tasksCompletedInc?: number }
  ): Promise<{ previousLevel: number; newLevel: number; xp: number; questsCompleted: number; tasksCompleted: number }>;
  getLevelNftRecord(userId: string, level: number): Promise<any | undefined>;
  createOrGetLevelNftRecord(record: { userId: string; level: number; metadataCid?: string; status?: string; jobId?: string; txHash?: string; tokenId?: string; metadataUri?: string }): Promise<any>;
  // OAuth token storage helpers
  upsertUserOAuth(userId: string, provider: string, data: any): Promise<void>;
  getOAuthToken(userId: string, provider: string): Promise<any | undefined>;
  // Quest completion tracking
  isQuestCompleted(userId: string, questId: string): Promise<boolean>;
  recordQuestCompletion(userId: string, questId: string, xpAwarded: number): Promise<void>;
  getUserCompletedQuests(userId: string): Promise<string[]>;
  // Task management
  createTask(task: any): Promise<any>;
  getTaskById(taskId: string): Promise<any | undefined>;
  getAllTasks(taskType?: string): Promise<any[]>;
  isTaskCompleted(userId: string, taskId: string): Promise<boolean>;
  recordTaskCompletion(userId: string, taskId: string, xpAwarded: number): Promise<void>;
  getUserCompletedTasks(userId: string): Promise<string[]>;
  // Campaign methods
  getAllCampaigns(): Promise<any[]>;
  getCampaignById(id: string): Promise<any | undefined>;
  // Campaign task methods
  createCampaignTask(task: any): Promise<any>;
  getCampaignTask(taskId: string): Promise<any | undefined>;
  getCampaignTasks(campaignId: string): Promise<any[]>;
  updateCampaignTask(taskId: string, updates: any): Promise<void>;
  deleteCampaignTask(taskId: string): Promise<void>;
  isCampaignTaskCompleted(userId: string, taskId: string): Promise<boolean>;
  recordCampaignTaskCompletion(userId: string, taskId: string, campaignId: string, xpAwarded: number, verificationData?: any): Promise<void>;
  getUserCampaignTaskCompletions(userId: string, campaignId?: string): Promise<string[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private userProfiles: Map<string, any>;
  private levelNfts: Map<string, any>;
  private referralEvents: Map<string, ReferralEvent>;
  private referralClaims: Map<string, ReferralClaim>;
  private oauthTokens: Map<string, any>;
  private questCompletions: Map<string, Set<string>>; // userId -> Set of questIds
  private tasks: Map<string, any>; // taskId -> task
  private taskCompletions: Map<string, Set<string>>; // userId -> Set of taskIds
  private campaignTasks: Map<string, any>; // taskId -> campaign task
  private campaignTaskCompletions: Map<string, Set<string>>; // userId -> Set of campaign taskIds

  constructor() {
    this.users = new Map();
    this.userProfiles = new Map();
    this.levelNfts = new Map();
    this.referralEvents = new Map();
    this.referralClaims = new Map();
    this.oauthTokens = new Map();
    this.questCompletions = new Map();
    this.tasks = new Map();
    this.taskCompletions = new Map();
    this.campaignTasks = new Map();
    this.campaignTaskCompletions = new Map();
    
    // Seed test data
    this.seedTestData();

    // attempt to load persisted data from disk
    try {
      const dataDir = path.resolve(process.cwd(), "server", "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

      const pn = path.join(dataDir, "user_profiles.json");
      if (fs.existsSync(pn)) {
        const raw = fs.readFileSync(pn, "utf8");
        const parsed = JSON.parse(raw || "{}");
        Object.entries(parsed).forEach(([k, v]) => this.userProfiles.set(k, v));
      }

      const ln = path.join(dataDir, "level_nfts.json");
      if (fs.existsSync(ln)) {
        const raw = fs.readFileSync(ln, "utf8");
        const parsed = JSON.parse(raw || "{}");
        Object.entries(parsed).forEach(([k, v]) => this.levelNfts.set(k, v));
      }
      // load persisted users and projects if present
      const usersFile = path.join(dataDir, "users.json");
      if (fs.existsSync(usersFile)) {
        const raw = fs.readFileSync(usersFile, "utf8");
        const parsed: Record<string, any> = JSON.parse(raw || "{}");
        Object.entries(parsed).forEach(([k, v]) => this.users.set(k, v as User));
      }

      const projectsFile = path.join(dataDir, "projects.json");
      if (fs.existsSync(projectsFile)) {
        const raw = fs.readFileSync(projectsFile, "utf8");
        const parsed: Record<string, any> = JSON.parse(raw || "{}");
        (this as any).projects = new Map<string, any>();
        Object.entries(parsed).forEach(([k, v]) => (this as any).projects.set(k, v));
      }
      // load oauth tokens if present
      const oauthFile = path.join(dataDir, "oauth_tokens.json");
      if (fs.existsSync(oauthFile)) {
        try {
          const raw = fs.readFileSync(oauthFile, "utf8");
          const parsed = JSON.parse(raw || "{}");
          Object.entries(parsed).forEach(([k, v]) => this.oauthTokens.set(k, v));
        } catch (e) {
          // ignore parse errors
        }
      }
      
      // load referral events if present
      const referralEventsFile = path.join(dataDir, "referral_events.json");
      if (fs.existsSync(referralEventsFile)) {
        try {
          const raw = fs.readFileSync(referralEventsFile, "utf8");
          const parsed = JSON.parse(raw || "{}");
          Object.entries(parsed).forEach(([k, v]) => this.referralEvents.set(k, v as any));
        } catch (e) {
          console.warn("failed to load referral events", e);
        }
      }
      
      // load referral claims if present
      const referralClaimsFile = path.join(dataDir, "referral_claims.json");
      if (fs.existsSync(referralClaimsFile)) {
        try {
          const raw = fs.readFileSync(referralClaimsFile, "utf8");
          const parsed = JSON.parse(raw || "{}");
          Object.entries(parsed).forEach(([k, v]) => this.referralClaims.set(k, v as any));
        } catch (e) {
          console.warn("failed to load referral claims", e);
        }
      }
      
      // load quest completions if present
      const questCompletionsFile = path.join(dataDir, "quest_completions.json");
      if (fs.existsSync(questCompletionsFile)) {
        try {
          const raw = fs.readFileSync(questCompletionsFile, "utf8");
          const parsed: Record<string, string[]> = JSON.parse(raw || "{}");
          Object.entries(parsed).forEach(([userId, questIds]) => {
            this.questCompletions.set(userId, new Set(questIds));
          });
        } catch (e) {
          console.warn("failed to load quest completions", e);
        }
      }
    } catch (e) {
      console.warn("failed to load persisted storage", e);
    }
  }

  private persistOAuthTokens() {
    try {
      const dataDir = path.resolve(process.cwd(), "server", "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const oauthFile = path.join(dataDir, "oauth_tokens.json");
      const obj: Record<string, any> = {};
      this.oauthTokens.forEach((v, k) => { obj[k] = v; });
      fs.writeFileSync(oauthFile, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.warn("failed to persist oauth tokens", e);
    }
  }

  /** Persist users map to disk (server/data/users.json) */
  private persistUsers() {
    try {
      const dataDir = path.resolve(process.cwd(), "server", "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const usersFile = path.join(dataDir, "users.json");
      const obj: Record<string, any> = {};
      this.users.forEach((v, k) => { obj[k] = v; });
      fs.writeFileSync(usersFile, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.warn("failed to persist users", e);
    }
  }

  /** Persist projects map to disk (server/data/projects.json) */
  private persistProjects() {
    try {
      const dataDir = path.resolve(process.cwd(), "server", "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const projectsFile = path.join(dataDir, "projects.json");
      (this as any).projects = (this as any).projects || new Map();
      const obj: Record<string, any> = {};
      (this as any).projects.forEach((v: any, k: string) => { obj[k] = v; });
      fs.writeFileSync(projectsFile, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.warn("failed to persist projects", e);
    }
  }

  private seedTestData() {
    // Create mock referral events for user-123
    const userId = "user-123";
    
    // Add 7 referral events to show realistic data
    for (let i = 1; i <= 7; i++) {
      const eventId = randomUUID();
      const event: ReferralEvent = {
        id: eventId,
        referrerUserId: userId,
        referredUserId: `referred-user-${i}`,
        createdAt: new Date(Date.now() - (i * 24 * 60 * 60 * 1000)), // Spread over past days
      };
      this.referralEvents.set(eventId, event);
    }

    // Sample referral data removed - will be recreated when rewards are implemented
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async getUserByAddress(address: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => (user as any).address?.toLowerCase() === address?.toLowerCase(),
    );
  }

  async getUserProfile(userId: string): Promise<any | undefined> {
    return this.userProfiles.get(userId);
  }

  async updateUserProfile(userId: string, updates: { displayName?: string; avatar?: string; socialProfiles?: any }): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }
    
    // Update user fields for backward compatibility
    if (updates.displayName !== undefined) {
      (user as any).displayName = updates.displayName;
    }
    if (updates.avatar !== undefined) {
      (user as any).avatar = updates.avatar;
    }
    
    // Update or create profile
    const profile = this.userProfiles.get(userId) || {
      xp: 0,
      level: 1,
      questsCompleted: 0,
      tasksCompleted: 0,
      socialProfiles: {}
    };
    
    // Update profile fields
    if (updates.displayName !== undefined) {
      profile.displayName = updates.displayName;
    }
    if (updates.avatar !== undefined) {
      profile.avatar = updates.avatar;
    }
    if (updates.socialProfiles !== undefined) {
      profile.socialProfiles = updates.socialProfiles;
    }
    
    this.userProfiles.set(userId, profile);
    
    // Persist changes
    this.persistUsers();
    try {
      const dataDir = path.resolve(process.cwd(), "server", "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const pn = path.join(dataDir, "user_profiles.json");
      const obj: Record<string, any> = {};
      this.userProfiles.forEach((v, k) => { obj[k] = v; });
      fs.writeFileSync(pn, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.warn("failed to persist user profiles", e);
    }
  }

  async addXpToUser(
    userId: string,
    xpAmount: number,
    options?: { questsCompletedInc?: number; tasksCompletedInc?: number }
  ): Promise<{ previousLevel: number; newLevel: number; xp: number; questsCompleted: number; tasksCompleted: number }> {
    const current = this.userProfiles.get(userId) || { xp: 0, level: 0, questsCompleted: 0, tasksCompleted: 0 };
    const prevLevel = current.level || 0;
    const newXp = (current.xp || 0) + xpAmount;
    // XP_PER_LEVEL is imported from shared schema at runtime; fallback to 100
    const XP_PER_LEVEL = 100;
    const newLevel = Math.floor(newXp / XP_PER_LEVEL);
    const questsCompleted = (current.questsCompleted || 0) + (options?.questsCompletedInc || 0);
    const tasksCompleted = (current.tasksCompleted || 0) + (options?.tasksCompletedInc || 0);
    const updated = { ...current, xp: newXp, level: newLevel, questsCompleted, tasksCompleted };
    this.userProfiles.set(userId, updated);
    console.log(`[MemStorage] addXpToUser userId=${userId} xpAmount=${xpAmount} prevXp=${current.xp||0} newXp=${newXp} prevLevel=${prevLevel} newLevel=${newLevel} questsCompleted=${questsCompleted} tasksCompleted=${tasksCompleted} (increments: +${options?.questsCompletedInc || 0} quests, +${options?.tasksCompletedInc || 0} tasks)`);
    // persist to disk
    try {
      const dataDir = path.resolve(process.cwd(), "server", "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const pn = path.join(dataDir, "user_profiles.json");
      const obj: Record<string, any> = {};
      this.userProfiles.forEach((v, k) => { obj[k] = v; });
      fs.writeFileSync(pn, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.warn("failed to persist user profiles", e);
    }

    return { previousLevel: prevLevel, newLevel, xp: newXp, questsCompleted, tasksCompleted };
  }

  async getLevelNftRecord(userId: string, level: number): Promise<any | undefined> {
    return this.levelNfts.get(`${userId}:${level}`);
  }

  async createOrGetLevelNftRecord(record: { userId: string; level: number; metadataCid?: string; status?: string; jobId?: string; txHash?: string; tokenId?: string; metadataUri?: string }): Promise<any> {
    const key = `${record.userId}:${record.level}`;
    const existing = this.levelNfts.get(key);
    if (existing) return existing;
    const toStore = { ...record, createdAt: new Date().toISOString() };
    this.levelNfts.set(key, toStore);
    // persist level nfts to disk
    try {
      const dataDir = path.resolve(process.cwd(), "server", "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const ln = path.join(dataDir, "level_nfts.json");
      const obj: Record<string, any> = {};
      this.levelNfts.forEach((v, k) => { obj[k] = v; });
      fs.writeFileSync(ln, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.warn("failed to persist level nfts", e);
    }
    return toStore;
  }

  // OAuth token helpers (provider keyed by `${userId}:${provider}`)
  async upsertUserOAuth(userId: string, provider: string, data: any): Promise<void> {
    const key = `${userId}:${provider}`;
    this.oauthTokens.set(key, { ...data, updatedAt: new Date().toISOString() });
    try { this.persistOAuthTokens(); } catch (e) { /* ignore */ }
  }

  async getOAuthToken(userId: string, provider: string): Promise<any | undefined> {
    const key = `${userId}:${provider}`;
    return this.oauthTokens.get(key);
  }

  async createProject(project: any): Promise<any> {
    const id = randomUUID();
    const p = { ...project, id, createdAt: new Date().toISOString() };
    (this as any).projects = (this as any).projects || new Map();
    (this as any).projects.set(id, p);
    // persist projects to disk for dev
    try {
      this.persistProjects();
    } catch (e) {
      console.warn("failed to persist projects after create", e);
    }
    return p;
  }

  async getProjectById(id: string): Promise<any | undefined> {
    (this as any).projects = (this as any).projects || new Map();
    return (this as any).projects.get(id);
  }

  async listProjects(): Promise<any[]> {
    (this as any).projects = (this as any).projects || new Map();
    return Array.from((this as any).projects.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { ...insertUser, id, address: (insertUser as any).address ?? null } as any;
    this.users.set(id, user);
    // persist users map to disk for dev
    try {
      this.persistUsers();
    } catch (e) {
      console.warn("failed to persist users after create", e);
    }
    return user;
  }

  async createReferralEvent(insertEvent: InsertReferralEvent): Promise<ReferralEvent> {
    const id = randomUUID();
    const event: ReferralEvent = {
      ...insertEvent,
      id,
      createdAt: new Date(),
    };
    this.referralEvents.set(id, event);
    
    // Persist to disk
    try {
      const dataDir = path.resolve(process.cwd(), "server", "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const filePath = path.join(dataDir, "referral_events.json");
      const obj: Record<string, any> = {};
      this.referralEvents.forEach((v, k) => { obj[k] = v; });
      fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.warn("failed to persist referral events", e);
    }
    
    return event;
  }

  async getReferralEventsByReferrer(referrerId: string): Promise<ReferralEvent[]> {
    return Array.from(this.referralEvents.values()).filter(
      (event) => event.referrerUserId === referrerId,
    );
  }

  async createReferralClaim(insertClaim: InsertReferralClaim): Promise<ReferralClaim> {
    const id = randomUUID();
    const claim: ReferralClaim = {
      ...insertClaim,
      id,
      createdAt: new Date(),
    };
    this.referralClaims.set(id, claim);
    
    // Persist to disk
    try {
      const dataDir = path.resolve(process.cwd(), "server", "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const filePath = path.join(dataDir, "referral_claims.json");
      const obj: Record<string, any> = {};
      this.referralClaims.forEach((v, k) => { obj[k] = v; });
      fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.warn("failed to persist referral claims", e);
    }
    
    return claim;
  }

  async getReferralClaimsByUser(userId: string): Promise<ReferralClaim[]> {
    return Array.from(this.referralClaims.values()).filter(
      (claim) => claim.userId === userId,
    );
  }

  async getReferralStats(userId: string): Promise<ReferralStats> {
    const referralEvents = await this.getReferralEventsByReferrer(userId);
    const totalReferrals = referralEvents.length;
    
    // Rewards system coming later
    return {
      totalReferrals,
      totalEarned: 0,
      claimableRewards: 0,
      referralLink: `${(process.env.APP_URL || '').replace(/\/+$/g, '')}/ref/${userId}`,
    };
  }

  async isQuestCompleted(userId: string, questId: string): Promise<boolean> {
    const completedQuests = this.questCompletions.get(userId);
    return completedQuests ? completedQuests.has(questId) : false;
  }

  async recordQuestCompletion(userId: string, questId: string, xpAwarded: number): Promise<void> {
    let completedQuests = this.questCompletions.get(userId);
    if (!completedQuests) {
      completedQuests = new Set<string>();
      this.questCompletions.set(userId, completedQuests);
    }
    
    // Check if already completed - throw error for duplicate
    if (completedQuests.has(questId)) {
      const error = new Error(`Quest ${questId} already completed by user ${userId}`);
      (error as any).code = 'DUPLICATE_QUEST_COMPLETION';
      throw error;
    }
    
    completedQuests.add(questId);
    
    // Persist to disk
    try {
      const dataDir = path.resolve(process.cwd(), "server", "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const filePath = path.join(dataDir, "quest_completions.json");
      const obj: Record<string, string[]> = {};
      this.questCompletions.forEach((quests, uid) => { 
        obj[uid] = Array.from(quests); 
      });
      fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.warn("failed to persist quest completions", e);
    }
  }

  async getUserCompletedQuests(userId: string): Promise<string[]> {
    const completedQuests = this.questCompletions.get(userId);
    return completedQuests ? Array.from(completedQuests) : [];
  }

  async getAllCampaigns(): Promise<any[]> {
    // Return empty array for now - campaigns stored per project
    const projects = (this as any).projects || new Map();
    const campaigns: any[] = [];
    // In memory storage, campaigns would be nested in projects
    // For now return empty, will be populated when campaigns are created
    return campaigns;
  }

  async getCampaignById(id: string): Promise<any | undefined> {
    // Search through projects for campaign
    const projects = (this as any).projects || new Map();
    for (const project of projects.values()) {
      if (project.campaigns) {
        const campaign = project.campaigns.find((c: any) => c.id === id);
        if (campaign) return campaign;
      }
    }
    return undefined;
  }

  async createTask(task: any): Promise<any> {
    this.tasks.set(task.id, task);
    return task;
  }

  async getTaskById(taskId: string): Promise<any | undefined> {
    return this.tasks.get(taskId);
  }

  async getAllTasks(taskType?: string): Promise<any[]> {
    const allTasks = Array.from(this.tasks.values());
    if (taskType) {
      return allTasks.filter(t => t.taskType === taskType && t.isActive);
    }
    return allTasks.filter(t => t.isActive);
  }

  async isTaskCompleted(userId: string, taskId: string): Promise<boolean> {
    const completedTasks = this.taskCompletions.get(userId);
    return completedTasks ? completedTasks.has(taskId) : false;
  }

  async recordTaskCompletion(userId: string, taskId: string, xpAwarded: number): Promise<void> {
    let completedTasks = this.taskCompletions.get(userId);
    if (!completedTasks) {
      completedTasks = new Set<string>();
      this.taskCompletions.set(userId, completedTasks);
    }
    
    // Check if already completed - throw error for duplicate
    if (completedTasks.has(taskId)) {
      const error = new Error(`Task ${taskId} already completed by user ${userId}`);
      (error as any).code = 'DUPLICATE_TASK_COMPLETION';
      throw error;
    }
    
    completedTasks.add(taskId);
    
    // Persist to disk
    try {
      const dataDir = path.resolve(process.cwd(), "server", "data");
      if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
      const filePath = path.join(dataDir, "task_completions.json");
      const obj: Record<string, string[]> = {};
      this.taskCompletions.forEach((tasks, uid) => { 
        obj[uid] = Array.from(tasks); 
      });
      fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), "utf8");
    } catch (e) {
      console.warn("failed to persist task completions", e);
    }
  }

  async getUserCompletedTasks(userId: string): Promise<string[]> {
    const completedTasks = this.taskCompletions.get(userId);
    return completedTasks ? Array.from(completedTasks) : [];
  }

  // Campaign task methods for MemStorage
  async createCampaignTask(task: any): Promise<any> {
    const id = task.id || randomUUID();
    const fullTask = {
      ...task,
      id,
      createdAt: new Date(),
      updatedAt: null,
    };
    this.campaignTasks.set(id, fullTask);
    return fullTask;
  }

  async getCampaignTask(taskId: string): Promise<any | undefined> {
    return this.campaignTasks.get(taskId);
  }

  async getCampaignTasks(campaignId: string): Promise<any[]> {
    return Array.from(this.campaignTasks.values())
      .filter(t => t.campaignId === campaignId && t.isActive !== 0)
      .sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
  }

  async updateCampaignTask(taskId: string, updates: any): Promise<void> {
    const task = this.campaignTasks.get(taskId);
    if (!task) return;
    Object.assign(task, updates, { updatedAt: new Date() });
    this.campaignTasks.set(taskId, task);
  }

  async deleteCampaignTask(taskId: string): Promise<void> {
    const task = this.campaignTasks.get(taskId);
    if (task) {
      task.isActive = 0;
      task.updatedAt = new Date();
      this.campaignTasks.set(taskId, task);
    }
  }

  async isCampaignTaskCompleted(userId: string, taskId: string): Promise<boolean> {
    const completedTasks = this.campaignTaskCompletions.get(userId);
    return completedTasks ? completedTasks.has(taskId) : false;
  }

  async recordCampaignTaskCompletion(userId: string, taskId: string, campaignId: string, xpAwarded: number, verificationData?: any): Promise<void> {
    let completedTasks = this.campaignTaskCompletions.get(userId);
    if (!completedTasks) {
      completedTasks = new Set<string>();
      this.campaignTaskCompletions.set(userId, completedTasks);
    }
    
    if (completedTasks.has(taskId)) {
      const error = new Error(`Campaign task ${taskId} already completed by user ${userId}`);
      (error as any).code = 'DUPLICATE_CAMPAIGN_TASK_COMPLETION';
      throw error;
    }
    
    completedTasks.add(taskId);
  }

  async getUserCampaignTaskCompletions(userId: string, campaignId?: string): Promise<string[]> {
    const completedTasks = this.campaignTaskCompletions.get(userId);
    if (!completedTasks) return [];
    
    if (campaignId) {
      // Filter by campaign ID
      const taskIds = Array.from(completedTasks);
      return taskIds.filter(tid => {
        const task = this.campaignTasks.get(tid);
        return task && task.campaignId === campaignId;
      });
    }
    
    return Array.from(completedTasks);
  }
}

/**
 * Neon-backed storage implementation using raw SQL via @neondatabase/serverless.
 * Falls back gracefully to MemStorage when no DATABASE_URL or pool is unavailable.
 */
class NeonStorage implements IStorage {
  private pool: any;
  constructor(pool: any) {
    this.pool = pool;
  }

  private async query(sql: string, params: any[] = []) {
    return this.pool.query(sql, params);
  }

  async getUser(id: string) {
    const r = await this.query(`select * from users where id = $1 limit 1`, [id]);
    return r?.rows?.[0] || undefined;
  }

  async getUserByUsername(username: string) {
    const r = await this.query(`select * from users where username = $1 limit 1`, [username]);
    return r?.rows?.[0] || undefined;
  }

  async getUserByAddress(address: string) {
    if (!address) return undefined;
    const r = await this.query(`select * from users where lower(address) = lower($1) limit 1`, [address]);
    return r?.rows?.[0] || undefined;
  }

  async createProject(project: any) {
    const r = await this.query(
      `insert into projects (owner_user_id, owner_address, name, description, website, image_url, metadata) values ($1,$2,$3,$4,$5,$6,$7) returning *`,
      [project.ownerUserId || null, project.ownerAddress || null, project.name, project.description || null, project.website || null, project.imageUrl || null, project.metadata ? JSON.stringify(project.metadata) : "{}"],
    );
    return r.rows[0];
  }

  async getProjectById(id: string) {
    const r = await this.query(`select * from projects where id = $1 limit 1`, [id]);
    return r?.rows?.[0] || undefined;
  }

  async listProjects() {
    const r = await this.query(`select * from projects order by created_at desc limit 100`);
    return r?.rows || [];
  }

  async createUser(insertUser: InsertUser) {
    const r = await this.query(`insert into users (username, password, address) values ($1,$2,$3) returning *`, [insertUser.username, (insertUser as any).password || "", (insertUser as any).address || null]);
    return r.rows[0];
  }

  async createReferralEvent(insertEvent: InsertReferralEvent) {
    const r = await this.query(`insert into referral_events (referrer_user_id, referred_user_id) values ($1,$2) returning *`, [insertEvent.referrerUserId, insertEvent.referredUserId]);
    return r.rows[0];
  }

  async getReferralEventsByReferrer(referrerId: string) {
    const r = await this.query(`select * from referral_events where referrer_user_id = $1 order by created_at desc`, [referrerId]);
    return r.rows || [];
  }

  async createReferralClaim(insertClaim: InsertReferralClaim) {
    const r = await this.query(`insert into referral_claims (user_id, amount, referral_count) values ($1,$2,$3) returning *`, [insertClaim.userId, insertClaim.amount, insertClaim.referralCount]);
    return r.rows[0];
  }

  async getReferralClaimsByUser(userId: string) {
    const r = await this.query(`select * from referral_claims where user_id = $1 order by created_at desc`, [userId]);
    return r.rows || [];
  }

  async getReferralStats(userId: string) {
    const eventsRes = await this.query(`select count(*)::int as cnt from referral_events where referrer_user_id = $1`, [userId]);
    const claimsRes = await this.query(`select coalesce(sum(amount),0)::int as total from referral_claims where user_id = $1`, [userId]);
    const totalReferrals = eventsRes.rows?.[0]?.cnt || 0;
    const totalEarned = (claimsRes.rows?.[0]?.total || 0) / 100;
    // calculate milestone claimable rewards same as MemStorage
    let earnedFromMilestones = 0;
    if (totalReferrals >= 10) {
      earnedFromMilestones = Math.floor(totalReferrals / 10) * 150;
      const remainder = totalReferrals % 10;
      if (remainder >= 3) earnedFromMilestones += Math.floor(remainder / 3) * 100;
    } else if (totalReferrals >= 3) {
      earnedFromMilestones = Math.floor(totalReferrals / 3) * 100;
    }
    const totalClaimed = (claimsRes.rows?.[0]?.total || 0);
    const claimableRewards = Math.max(0, earnedFromMilestones - totalClaimed) / 100;
    return {
      totalReferrals,
      totalEarned,
      claimableRewards,
      referralLink: `https://nexura.com/ref/${userId}`,
    };
  }

  async isQuestCompleted(userId: string, questId: string): Promise<boolean> {
    try {
      const r = await this.query(
        `SELECT id FROM user_quest_completions WHERE user_id = $1 AND quest_id = $2 LIMIT 1`,
        [userId, questId]
      );
      return r.rows && r.rows.length > 0;
    } catch (e) {
      console.warn('isQuestCompleted error:', e);
      return false;
    }
  }

  async recordQuestCompletion(userId: string, questId: string, xpAwarded: number): Promise<void> {
    try {
      await this.query(
        `INSERT INTO user_quest_completions (user_id, quest_id, xp_awarded) VALUES ($1, $2, $3)
         ON CONFLICT (user_id, quest_id) DO NOTHING`,
        [userId, questId, xpAwarded]
      );
    } catch (e) {
      console.warn('recordQuestCompletion error:', e);
      throw e;
    }
  }

  async getUserCompletedQuests(userId: string): Promise<string[]> {
    try {
      const r = await this.query(
        `SELECT quest_id FROM user_quest_completions WHERE user_id = $1 ORDER BY completed_at DESC`,
        [userId]
      );
      return r.rows ? r.rows.map((row: any) => row.quest_id) : [];
    } catch (e) {
      console.warn('getUserCompletedQuests error:', e);
      return [];
    }
  }

  async getUserProfile(userId: string) {
    const r = await this.query(`select * from user_profiles where user_id = $1 limit 1`, [userId]);
    return r?.rows?.[0] || undefined;
  }

  async updateUserProfile(userId: string, updates: { displayName?: string; avatar?: string; socialProfiles?: any }): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      // Ensure user_profiles row exists
      await client.query(
        `INSERT INTO user_profiles (user_id, display_name, avatar, social_profiles)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id) DO NOTHING`,
        [userId, null, null, '{}']
      );
      
      // Update user_profiles table with all fields
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;
      
      if (updates.displayName !== undefined) {
        updateFields.push(`display_name = $${paramIndex++}`);
        values.push(updates.displayName);
      }
      if (updates.avatar !== undefined) {
        updateFields.push(`avatar = $${paramIndex++}`);
        values.push(updates.avatar);
      }
      if (updates.socialProfiles !== undefined) {
        updateFields.push(`social_profiles = $${paramIndex++}`);
        values.push(JSON.stringify(updates.socialProfiles));
      }
      
      if (updateFields.length > 0) {
        updateFields.push(`updated_at = now()`);
        values.push(userId);
        await client.query(
          `UPDATE user_profiles SET ${updateFields.join(', ')} WHERE user_id = $${paramIndex}`,
          values
        );
      }
      
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }
  }

  async addXpToUser(
    userId: string,
    xpAmount: number,
    options?: { questsCompletedInc?: number; tasksCompletedInc?: number }
  ) {
    // Use a simple transaction: get current, then update/insert
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const cur = await client.query(`select xp, level, quests_completed, tasks_completed from user_profiles where user_id = $1 for update`, [userId]);
      let prevLevel = 0;
      let newXp = xpAmount;
      let newLevel = 0;
      let questsCompleted = options?.questsCompletedInc || 0;
      let tasksCompleted = options?.tasksCompletedInc || 0;
      if (cur.rows.length) {
        const row = cur.rows[0];
        prevLevel = row.level || 0;
        newXp = (row.xp || 0) + xpAmount;
        const XP_PER_LEVEL = 100;
        newLevel = Math.floor(newXp / XP_PER_LEVEL);
        questsCompleted = (row.quests_completed || 0) + (options?.questsCompletedInc || 0);
        tasksCompleted = (row.tasks_completed || 0) + (options?.tasksCompletedInc || 0);
        await client.query(
          `update user_profiles set xp = $1, level = $2, quests_completed = $3, tasks_completed = $4, updated_at = now() where user_id = $5`,
          [newXp, newLevel, questsCompleted, tasksCompleted, userId]
        );
      } else {
        const XP_PER_LEVEL = 100;
        newLevel = Math.floor(newXp / XP_PER_LEVEL);
        questsCompleted = options?.questsCompletedInc || 0;
        tasksCompleted = options?.tasksCompletedInc || 0;
        await client.query(
          `insert into user_profiles (user_id, xp, level, quests_completed, tasks_completed, created_at, updated_at) values ($1,$2,$3,$4,$5,now(),now())`,
          [userId, newXp, newLevel, questsCompleted, tasksCompleted]
        );
      }
      try {
        console.log(`[NeonStorage] addXpToUser userId=${userId} xpAmount=${xpAmount} newXp=${newXp} prevLevel=${prevLevel} newLevel=${newLevel}`);
      } catch (e) {
        /* ignore logging failures */
      }
      await client.query("COMMIT");
      return { previousLevel: prevLevel, newLevel, xp: newXp, questsCompleted, tasksCompleted };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  async getLevelNftRecord(userId: string, level: number) {
    const r = await this.query(`select * from user_level_nfts where user_id = $1 and level = $2 limit 1`, [userId, level]);
    return r?.rows?.[0] || undefined;
  }

  async createOrGetLevelNftRecord(record: { userId: string; level: number; metadataCid?: string; status?: string; jobId?: string; txHash?: string; tokenId?: string; metadataUri?: string }) {
    const existing = await this.getLevelNftRecord(record.userId, record.level);
    if (existing) return existing;
    const r = await this.query(`insert into user_level_nfts (user_id, level, token_id, tx_hash, metadata_uri, metadata_cid, status, job_id, created_at) values ($1,$2,$3,$4,$5,$6,$7,$8,now()) returning *`, [record.userId, record.level, record.tokenId || null, record.txHash || null, record.metadataUri || null, record.metadataCid || null, record.status || 'queued', record.jobId || null]);
    return r.rows[0];
  }

  async upsertUserOAuth(userId: string, provider: string, data: any): Promise<void> {
    // simple upsert into user_oauth_tokens table
    try {
      const existing = await this.query(`select id from user_oauth_tokens where user_id = $1 and provider = $2 limit 1`, [userId, provider]);
      if (existing && existing.rows && existing.rows.length) {
        await this.query(`update user_oauth_tokens set access_token = $1, refresh_token = $2, scope = $3, expires_at = $4, updated_at = now() where user_id = $5 and provider = $6`, [data.access_token || data.oauth_token || null, data.refresh_token || null, data.scope || null, data.expires_at ? new Date(data.expires_at) : null, userId, provider]);
      } else {
        await this.query(`insert into user_oauth_tokens (user_id, provider, access_token, refresh_token, scope, expires_at, created_at, updated_at) values ($1,$2,$3,$4,$5,$6,now(),now())`, [userId, provider, data.access_token || data.oauth_token || null, data.refresh_token || null, data.scope || null, data.expires_at ? new Date(data.expires_at) : null]);
      }
    } catch (e) {
      console.warn('neon upsertUserOAuth failed', e);
    }
  }

  async getOAuthToken(userId: string, provider: string) {
    try {
      const r = await this.query(`select * from user_oauth_tokens where user_id = $1 and provider = $2 limit 1`, [userId, provider]);
      return r?.rows?.[0] || undefined;
    } catch (e) {
      console.warn('neon getOAuthToken failed', e);
      return undefined;
    }
  }

  async getAllCampaigns(): Promise<any[]> {
    try {
      const r = await this.query(`
        SELECT 
          c.*,
          p.name as project_name,
          p.image_url as project_image
        FROM campaigns c
        LEFT JOIN project_accounts p ON c.project_id = p.id
        ORDER BY c.created_at DESC
      `, []);
      return r?.rows || [];
    } catch (e) {
      console.warn('[NeonStorage] getAllCampaigns error', e);
      return [];
    }
  }

  async getCampaignById(id: string): Promise<any | undefined> {
    try {
      const r = await this.query(`
        SELECT 
          c.*,
          p.name as project_name,
          p.image_url as project_image
        FROM campaigns c
        LEFT JOIN project_accounts p ON c.project_id = p.id
        WHERE c.id = $1
        LIMIT 1
      `, [id]);
      return r?.rows?.[0] || undefined;
    } catch (e) {
      console.warn('[NeonStorage] getCampaignById error', e);
      return undefined;
    }
  }

  // Campaign task methods
  async createCampaignTask(task: any): Promise<any> {
    const id = task.id || randomUUID();
    const sql = `
      INSERT INTO campaign_tasks 
      (id, campaign_id, project_id, title, description, task_category, task_subtype, xp_reward, verification_config, is_active, order_index, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())
      RETURNING *
    `;
    const values = [
      id,
      task.campaignId,
      task.projectId,
      task.title,
      task.description,
      task.taskCategory,
      task.taskSubtype,
      task.xpReward || 0,
      typeof task.verificationConfig === 'string' ? task.verificationConfig : JSON.stringify(task.verificationConfig || {}),
      task.isActive !== undefined ? (task.isActive ? 1 : 0) : 1,
      task.orderIndex || 0,
    ];
    const r = await this.query(sql, values);
    return r.rows[0];
  }

  async getCampaignTask(taskId: string): Promise<any | undefined> {
    const r = await this.query(`SELECT * FROM campaign_tasks WHERE id = $1 LIMIT 1`, [taskId]);
    return r?.rows?.[0] || undefined;
  }

  async getCampaignTasks(campaignId: string): Promise<any[]> {
    const r = await this.query(
      `SELECT * FROM campaign_tasks WHERE campaign_id = $1 AND is_active = 1 ORDER BY order_index ASC, created_at ASC`,
      [campaignId]
    );
    return r?.rows || [];
  }

  async updateCampaignTask(taskId: string, updates: any): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updates.title !== undefined) {
      fields.push(`title = $${paramIndex++}`);
      values.push(updates.title);
    }
    if (updates.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updates.description);
    }
    if (updates.xpReward !== undefined) {
      fields.push(`xp_reward = $${paramIndex++}`);
      values.push(updates.xpReward);
    }
    if (updates.verificationConfig !== undefined) {
      fields.push(`verification_config = $${paramIndex++}`);
      values.push(typeof updates.verificationConfig === 'string' ? updates.verificationConfig : JSON.stringify(updates.verificationConfig));
    }
    if (updates.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(updates.isActive ? 1 : 0);
    }
    if (updates.orderIndex !== undefined) {
      fields.push(`order_index = $${paramIndex++}`);
      values.push(updates.orderIndex);
    }

    if (fields.length === 0) return;

    fields.push(`updated_at = NOW()`);
    values.push(taskId);

    const sql = `UPDATE campaign_tasks SET ${fields.join(', ')} WHERE id = $${paramIndex}`;
    await this.query(sql, values);
  }

  async deleteCampaignTask(taskId: string): Promise<void> {
    await this.query(`UPDATE campaign_tasks SET is_active = 0 WHERE id = $1`, [taskId]);
  }

  async isCampaignTaskCompleted(userId: string, taskId: string): Promise<boolean> {
    const r = await this.query(
      `SELECT 1 FROM campaign_task_completions WHERE user_id = $1 AND task_id = $2 LIMIT 1`,
      [userId, taskId]
    );
    return (r?.rows?.length || 0) > 0;
  }

  async recordCampaignTaskCompletion(userId: string, taskId: string, campaignId: string, xpAwarded: number, verificationData?: any): Promise<void> {
    const id = randomUUID();
    const sql = `
      INSERT INTO campaign_task_completions 
      (id, user_id, task_id, campaign_id, xp_awarded, verification_data, completed_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `;
    const values = [
      id,
      userId,
      taskId,
      campaignId,
      xpAwarded,
      typeof verificationData === 'string' ? verificationData : JSON.stringify(verificationData || {}),
    ];
    try {
      await this.query(sql, values);
    } catch (e: any) {
      if (e?.code === '23505' || e?.message?.includes('unique')) {
        const err = new Error('Task already completed');
        (err as any).code = 'DUPLICATE_CAMPAIGN_TASK_COMPLETION';
        throw err;
      }
      throw e;
    }
  }

  async getUserCampaignTaskCompletions(userId: string, campaignId?: string): Promise<string[]> {
    const sql = campaignId
      ? `SELECT task_id FROM campaign_task_completions WHERE user_id = $1 AND campaign_id = $2`
      : `SELECT task_id FROM campaign_task_completions WHERE user_id = $1`;
    const values = campaignId ? [userId, campaignId] : [userId];
    const r = await this.query(sql, values);
    return (r?.rows || []).map((row: any) => row.task_id);
  }
}

// Export storage: prefer NeonStorage when DATABASE_URL and pool exist, otherwise MemStorage
let storageInstance: IStorage;
if (NeonPool) {
  try {
    storageInstance = new NeonStorage(NeonPool);
    console.log("Using Neon/Postgres storage (DATABASE_URL detected)");
  } catch (e) {
    console.warn("Failed to initialize Neon storage, falling back to MemStorage", e);
    storageInstance = new MemStorage();
  }
} else {
  storageInstance = new MemStorage();
}

export const storage = storageInstance;
