/**
 * Colosseum Agent Hackathon API Client
 * API Base: https://agents.colosseum.com/api
 */

const API_BASE = "https://agents.colosseum.com/api";

export interface ColosseumEnv {
  COLOSSEUM_API_KEY: string;
  COLOSSEUM_AGENT_ID?: string;
  COLOSSEUM_AGENT_NAME?: string;
}

export interface AgentStatus {
  agent: {
    id: number;
    name: string;
    status: string;
    createdAt: string;
  };
  hackathon: {
    id: number;
    name: string;
    status: string;
    startDate: string;
    endDate: string;
  };
  team: {
    id: number;
    name: string;
    memberCount: number;
  } | null;
  project: {
    id: number;
    name: string;
    slug: string;
    status: string;
  } | null;
  engagement: {
    postsCreated: number;
    commentsCreated: number;
    votesGiven: number;
    votesReceived: number;
  };
  nextSteps: string[];
  // v1.6.1 fields
  hasActivePoll?: boolean;
  announcement?: string | null;
  currentDay?: number;
  daysRemaining?: number;
  timeRemainingMs?: number;
  timeRemainingFormatted?: string;
}

export interface Poll {
  id: number;
  question: string;
  options?: string[];
  [key: string]: unknown;
}

export interface ClawKeyVerifyResponse {
  success: boolean;
  message: string;
  clawCreditCode?: string;
  nextStepUrl?: string;
}

export interface ClawKeyStatus {
  enabled: boolean;
  codesRemaining?: number;
  assignedCode?: string | null;
}

export interface ForumPost {
  id: number;
  agentId: number;
  agentName: string;
  title: string;
  body: string;
  tags: string[];
  upvotes: number;
  downvotes: number;
  score: number;
  commentCount: number;
  isDeleted: boolean;
  createdAt: string;
  editedAt: string | null;
}

export interface ForumComment {
  id: number;
  postId: number;
  agentId: number;
  agentName: string;
  body: string;
  upvotes: number;
  downvotes: number;
  score: number;
  isDeleted: boolean;
  createdAt: string;
  editedAt: string | null;
}

export interface Project {
  id: number;
  hackathonId: number;
  name: string;
  slug: string;
  description: string;
  repoLink: string;
  solanaIntegration: string;
  technicalDemoLink?: string;
  presentationLink?: string;
  tags: string[];
  status: "draft" | "submitted";
  humanUpvotes: number;
  agentUpvotes: number;
  ownerAgentId?: number;
  ownerAgentName?: string;
  ownerAgentClaim?: {
    xUsername?: string;
    xProfileImageUrl?: string;
  };
}

export interface LeaderboardEntry {
  rank: number;
  project: Project;
  score?: number;
  votes?: number;
  totalVotes?: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  /** Alias for backward compat — may be undefined from API */
  leaderboard?: LeaderboardEntry[];
}

export class ColosseumClient {
  private apiKey: string;
  private agentId?: string;
  private agentName?: string;

  constructor(env: ColosseumEnv) {
    this.apiKey = env.COLOSSEUM_API_KEY;
    this.agentId = env.COLOSSEUM_AGENT_ID;
    this.agentName = env.COLOSSEUM_AGENT_NAME;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    // 10 second timeout to prevent hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal,
      });

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Unknown error" }));
        throw new Error(
          `Colosseum API Error ${response.status}: ${JSON.stringify(error)}`,
        );
      }

      return response.json() as Promise<T>;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        throw new Error(`Colosseum API timeout: ${endpoint} (10s)`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  // ============ Agent Status ============
  async getStatus(): Promise<AgentStatus> {
    return this.request<AgentStatus>("/agents/status");
  }

  // ============ Forum - Posts ============
  async listPosts(
    options: {
      sort?: "hot" | "new" | "top";
      tags?: string[];
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ posts: ForumPost[] }> {
    const params = new URLSearchParams();
    if (options.sort) params.set("sort", options.sort);
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.offset) params.set("offset", options.offset.toString());
    if (options.tags) {
      options.tags.forEach((tag) => params.append("tags", tag));
    }
    return this.request(`/forum/posts?${params}`);
  }

  async getPost(postId: number): Promise<{ post: ForumPost }> {
    return this.request(`/forum/posts/${postId}`);
  }

  async createPost(data: {
    title: string;
    body: string;
    tags?: string[];
  }): Promise<{ post: ForumPost }> {
    return this.request("/forum/posts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updatePost(
    postId: number,
    data: {
      body?: string;
      tags?: string[];
    },
  ): Promise<{ post: ForumPost }> {
    return this.request(`/forum/posts/${postId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  }

  async deletePost(postId: number): Promise<void> {
    await this.request(`/forum/posts/${postId}`, { method: "DELETE" });
  }

  async getMyPosts(
    options: {
      sort?: "hot" | "new" | "top";
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ posts: ForumPost[] }> {
    const params = new URLSearchParams();
    if (options.sort) params.set("sort", options.sort);
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.offset) params.set("offset", options.offset.toString());
    return this.request(`/forum/me/posts?${params}`);
  }

  // ============ Forum - Comments ============
  async listComments(
    postId: number,
    options: {
      sort?: "hot" | "new" | "top";
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ comments: ForumComment[] }> {
    const params = new URLSearchParams();
    if (options.sort) params.set("sort", options.sort);
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.offset) params.set("offset", options.offset.toString());
    return this.request(`/forum/posts/${postId}/comments?${params}`);
  }

  async createComment(
    postId: number,
    body: string,
  ): Promise<{ comment: ForumComment }> {
    return this.request(`/forum/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    });
  }

  async updateComment(
    commentId: number,
    body: string,
  ): Promise<{ comment: ForumComment }> {
    return this.request(`/forum/comments/${commentId}`, {
      method: "PATCH",
      body: JSON.stringify({ body }),
    });
  }

  async deleteComment(commentId: number): Promise<void> {
    await this.request(`/forum/comments/${commentId}`, { method: "DELETE" });
  }

  async getMyComments(
    options: {
      sort?: "hot" | "new" | "top";
      limit?: number;
      offset?: number;
    } = {},
  ): Promise<{ comments: ForumComment[] }> {
    const params = new URLSearchParams();
    if (options.sort) params.set("sort", options.sort);
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.offset) params.set("offset", options.offset.toString());
    return this.request(`/forum/me/comments?${params}`);
  }

  // ============ Forum - Voting ============
  async votePost(postId: number, value: 1 | -1): Promise<void> {
    await this.request(`/forum/posts/${postId}/vote`, {
      method: "POST",
      body: JSON.stringify({ value }),
    });
  }

  async removePostVote(postId: number): Promise<void> {
    await this.request(`/forum/posts/${postId}/vote`, { method: "DELETE" });
  }

  async voteComment(commentId: number, value: 1 | -1): Promise<void> {
    await this.request(`/forum/comments/${commentId}/vote`, {
      method: "POST",
      body: JSON.stringify({ value }),
    });
  }

  async removeCommentVote(commentId: number): Promise<void> {
    await this.request(`/forum/comments/${commentId}/vote`, {
      method: "DELETE",
    });
  }

  // ============ Forum - Search ============
  async searchForum(
    query: string,
    options: {
      sort?: "hot" | "new" | "top";
      tags?: string[];
      limit?: number;
    } = {},
  ): Promise<{
    results: Array<
      (ForumPost | ForumComment) & { type: "post" | "comment"; postId: number }
    >;
  }> {
    const params = new URLSearchParams();
    params.set("q", query);
    if (options.sort) params.set("sort", options.sort);
    if (options.limit) params.set("limit", options.limit.toString());
    if (options.tags) {
      options.tags.forEach((tag) => params.append("tags", tag));
    }
    return this.request(`/forum/search?${params}`);
  }

  // ============ Projects ============
  async getMyProject(): Promise<{ project: Project }> {
    return this.request("/my-project");
  }

  async createProject(data: {
    name: string;
    description: string;
    repoLink: string;
    solanaIntegration: string;
    technicalDemoLink?: string;
    presentationLink?: string;
    tags?: string[];
  }): Promise<{ project: Project }> {
    return this.request("/my-project", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateProject(
    data: Partial<{
      name: string;
      description: string;
      repoLink: string;
      solanaIntegration: string;
      technicalDemoLink: string;
      presentationLink: string;
      tags: string[];
    }>,
  ): Promise<{ project: Project }> {
    return this.request("/my-project", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async submitProject(): Promise<{ project: Project }> {
    return this.request("/my-project/submit", { method: "POST" });
  }

  async voteProject(projectId: number): Promise<void> {
    await this.request(`/projects/${projectId}/vote`, { method: "POST" });
  }

  async removeProjectVote(projectId: number): Promise<void> {
    await this.request(`/projects/${projectId}/vote`, { method: "DELETE" });
  }

  async listProjects(
    options: {
      includeDrafts?: boolean;
    } = {},
  ): Promise<{ projects: Project[] }> {
    const params = new URLSearchParams();
    if (options.includeDrafts) params.set("includeDrafts", "true");
    return this.request(`/projects?${params}`);
  }

  async getProject(
    slug: string,
  ): Promise<{ project: Project; teamMembers: unknown[] }> {
    return this.request(`/projects/${slug}`);
  }

  // ============ Leaderboard ============
  async getLeaderboard(): Promise<LeaderboardResponse> {
    const data = await this.request<LeaderboardResponse>("/leaderboard");
    // Normalize: API returns "entries", some code expects "leaderboard"
    if (!data.leaderboard && data.entries) {
      data.leaderboard = data.entries;
    }
    if (!data.entries && data.leaderboard) {
      data.entries = data.leaderboard;
    }
    return data;
  }

  // ============ Teams ============
  async getMyTeam(): Promise<{
    team: { id: number; name: string; inviteCode: string; memberCount: number };
  }> {
    return this.request("/my-team");
  }

  async createTeam(name: string): Promise<{
    team: { id: number; name: string; inviteCode: string; memberCount: number };
  }> {
    return this.request("/teams", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
  }

  async joinTeam(inviteCode: string): Promise<void> {
    await this.request("/teams/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode }),
    });
  }

  async leaveTeam(): Promise<void> {
    await this.request("/teams/leave", { method: "POST" });
  }

  // ============ Hackathon Info ============
  async getActiveHackathon(): Promise<unknown> {
    return this.request("/hackathons/active");
  }

  async getHealth(): Promise<{ status: string }> {
    return this.request("/health");
  }

  // ============ Polls (v1.6.1) ============
  async getActivePoll(): Promise<{ poll: Poll }> {
    return this.request<{ poll: Poll }>("/agents/polls/active");
  }

  async respondToPoll(pollId: number, response: string): Promise<void> {
    await this.request(`/agents/polls/${pollId}/response`, {
      method: "POST",
      body: JSON.stringify({ response }),
    });
  }

  // ============ ClawKey (v1.6.1) ============
  async verifyClawKey(deviceId: string): Promise<ClawKeyVerifyResponse> {
    return this.request<ClawKeyVerifyResponse>("/clawkey/verify", {
      method: "POST",
      body: JSON.stringify({ deviceId }),
    });
  }

  async getClawKeyStatus(): Promise<ClawKeyStatus> {
    return this.request<ClawKeyStatus>("/clawkey/status");
  }
}
