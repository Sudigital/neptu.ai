import type {
  UserDTO,
  ApiSubscriptionDTO,
  ApiKeyDTO,
  ApiPricingPlanDTO,
  ApiCreditPackDTO,
} from "@neptu/drizzle-orm";

import { api } from "@/lib/api";

interface AdminStats {
  success: boolean;
  stats: {
    users: {
      total: number;
      onboarded: number;
      admins: number;
      todayNew: number;
    };
    readings: {
      total: number;
      potensi: number;
      peluang: number;
      compatibility: number;
      todayNew: number;
    };
    subscriptions: {
      total: number;
      active: number;
      cancelled: number;
      expired: number;
      totalRevenue: number;
    };
    usage: {
      totalCalls: number;
      todayCalls: number;
      totalCreditsUsed: number;
      avgResponseTime: number;
    };
  };
}

interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface UsageAnalyticsPoint {
  date: string;
  totalCalls: number;
  basicCalls: number;
  aiCalls: number;
  creditsUsed: number;
}

interface TopEndpoint {
  endpoint: string;
  method: string;
  totalCalls: number;
  avgResponseTime: number;
}

export const adminApi = {
  // Dashboard stats
  async getStats(walletAddress: string): Promise<AdminStats> {
    const { data } = await api.get<AdminStats>("/api/admin/stats", {
      headers: { "X-Wallet-Address": walletAddress },
    });
    return data;
  },

  // Users
  async listUsers(
    walletAddress: string,
    params: {
      page?: number;
      limit?: number;
      search?: string;
      sortBy?: string;
      sortOrder?: string;
    }
  ): Promise<PaginatedResponse<UserDTO>> {
    const { data } = await api.get<PaginatedResponse<UserDTO>>(
      "/api/admin/users",
      {
        headers: { "X-Wallet-Address": walletAddress },
        params,
      }
    );
    return data;
  },

  async getUser(
    walletAddress: string,
    userId: string
  ): Promise<{ success: boolean; user: UserDTO }> {
    const { data } = await api.get(`/api/admin/users/${userId}`, {
      headers: { "X-Wallet-Address": walletAddress },
    });
    return data;
  },

  async updateUser(
    walletAddress: string,
    userId: string,
    updates: { isAdmin?: boolean; displayName?: string; email?: string }
  ): Promise<{ success: boolean; user: UserDTO }> {
    const { data } = await api.put(`/api/admin/users/${userId}`, updates, {
      headers: { "X-Wallet-Address": walletAddress },
    });
    return data;
  },

  // Subscriptions
  async listSubscriptions(
    walletAddress: string,
    params: { page?: number; limit?: number; status?: string; planId?: string }
  ): Promise<PaginatedResponse<ApiSubscriptionDTO>> {
    const { data } = await api.get<PaginatedResponse<ApiSubscriptionDTO>>(
      "/api/admin/subscriptions",
      {
        headers: { "X-Wallet-Address": walletAddress },
        params,
      }
    );
    return data;
  },

  async updateSubscription(
    walletAddress: string,
    id: string,
    updates: { status?: string; creditsRemaining?: number }
  ): Promise<{ success: boolean; subscription: ApiSubscriptionDTO }> {
    const { data } = await api.put(`/api/admin/subscriptions/${id}`, updates, {
      headers: { "X-Wallet-Address": walletAddress },
    });
    return data;
  },

  // API Keys
  async listApiKeys(
    walletAddress: string,
    params: {
      page?: number;
      limit?: number;
      userId?: string;
      isActive?: boolean;
    }
  ): Promise<PaginatedResponse<ApiKeyDTO>> {
    const { data } = await api.get<PaginatedResponse<ApiKeyDTO>>(
      "/api/admin/api-keys",
      {
        headers: { "X-Wallet-Address": walletAddress },
        params,
      }
    );
    return data;
  },

  async revokeApiKey(
    walletAddress: string,
    keyId: string
  ): Promise<{ success: boolean }> {
    const { data } = await api.put(
      `/api/admin/api-keys/${keyId}/revoke`,
      {},
      { headers: { "X-Wallet-Address": walletAddress } }
    );
    return data;
  },

  // Analytics
  async getUsageAnalytics(
    walletAddress: string,
    params: { startDate: string; endDate: string; groupBy?: string }
  ): Promise<{ success: boolean; analytics: UsageAnalyticsPoint[] }> {
    const { data } = await api.get("/api/admin/analytics/usage", {
      headers: { "X-Wallet-Address": walletAddress },
      params,
    });
    return data;
  },

  async getTopEndpoints(
    walletAddress: string
  ): Promise<{ success: boolean; endpoints: TopEndpoint[] }> {
    const { data } = await api.get("/api/admin/analytics/endpoints", {
      headers: { "X-Wallet-Address": walletAddress },
    });
    return data;
  },

  // Plans
  async listPlans(
    walletAddress: string
  ): Promise<{ success: boolean; plans: ApiPricingPlanDTO[] }> {
    const { data } = await api.get("/api/admin/plans", {
      headers: { "X-Wallet-Address": walletAddress },
    });
    return data;
  },

  async createPlan(
    walletAddress: string,
    plan: Partial<ApiPricingPlanDTO>
  ): Promise<{ success: boolean; plan: ApiPricingPlanDTO }> {
    const { data } = await api.post("/api/admin/plans", plan, {
      headers: { "X-Wallet-Address": walletAddress },
    });
    return data;
  },

  async updatePlan(
    walletAddress: string,
    planId: string,
    updates: Partial<ApiPricingPlanDTO>
  ): Promise<{ success: boolean; plan: ApiPricingPlanDTO }> {
    const { data } = await api.put(`/api/admin/plans/${planId}`, updates, {
      headers: { "X-Wallet-Address": walletAddress },
    });
    return data;
  },

  async deletePlan(
    walletAddress: string,
    planId: string
  ): Promise<{ success: boolean }> {
    const { data } = await api.delete(`/api/admin/plans/${planId}`, {
      headers: { "X-Wallet-Address": walletAddress },
    });
    return data;
  },

  // Credit Packs
  async listCreditPacks(
    walletAddress: string
  ): Promise<{ success: boolean; packs: ApiCreditPackDTO[] }> {
    const { data } = await api.get("/api/admin/credit-packs", {
      headers: { "X-Wallet-Address": walletAddress },
    });
    return data;
  },

  async createCreditPack(
    walletAddress: string,
    pack: Partial<ApiCreditPackDTO>
  ): Promise<{ success: boolean; pack: ApiCreditPackDTO }> {
    const { data } = await api.post("/api/admin/credit-packs", pack, {
      headers: { "X-Wallet-Address": walletAddress },
    });
    return data;
  },

  async updateCreditPack(
    walletAddress: string,
    packId: string,
    updates: Partial<ApiCreditPackDTO>
  ): Promise<{ success: boolean; pack: ApiCreditPackDTO }> {
    const { data } = await api.put(
      `/api/admin/credit-packs/${packId}`,
      updates,
      {
        headers: { "X-Wallet-Address": walletAddress },
      }
    );
    return data;
  },

  async deleteCreditPack(
    walletAddress: string,
    packId: string
  ): Promise<{ success: boolean }> {
    const { data } = await api.delete(`/api/admin/credit-packs/${packId}`, {
      headers: { "X-Wallet-Address": walletAddress },
    });
    return data;
  },
};
