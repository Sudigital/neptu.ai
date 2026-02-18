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
  async getStats(): Promise<AdminStats> {
    const { data } = await api.get<AdminStats>("/api/admin/stats");
    return data;
  },

  // Users
  async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<PaginatedResponse<UserDTO>> {
    const { data } = await api.get<PaginatedResponse<UserDTO>>(
      "/api/admin/users",
      { params }
    );
    return data;
  },

  async getUser(userId: string): Promise<{ success: boolean; user: UserDTO }> {
    const { data } = await api.get(`/api/admin/users/${userId}`);
    return data;
  },

  async updateUser(
    userId: string,
    updates: { role?: string; displayName?: string; email?: string }
  ): Promise<{ success: boolean; user: UserDTO }> {
    const { data } = await api.put(`/api/admin/users/${userId}`, updates);
    return data;
  },

  // Subscriptions
  async listSubscriptions(params: {
    page?: number;
    limit?: number;
    status?: string;
    planId?: string;
  }): Promise<PaginatedResponse<ApiSubscriptionDTO>> {
    const { data } = await api.get<PaginatedResponse<ApiSubscriptionDTO>>(
      "/api/admin/subscriptions",
      { params }
    );
    return data;
  },

  async updateSubscription(
    id: string,
    updates: { status?: string; creditsRemaining?: number }
  ): Promise<{ success: boolean; subscription: ApiSubscriptionDTO }> {
    const { data } = await api.put(`/api/admin/subscriptions/${id}`, updates);
    return data;
  },

  // API Keys
  async listApiKeys(params: {
    page?: number;
    limit?: number;
    userId?: string;
    isActive?: boolean;
  }): Promise<PaginatedResponse<ApiKeyDTO>> {
    const { data } = await api.get<PaginatedResponse<ApiKeyDTO>>(
      "/api/admin/api-keys",
      { params }
    );
    return data;
  },

  async revokeApiKey(keyId: string): Promise<{ success: boolean }> {
    const { data } = await api.put(`/api/admin/api-keys/${keyId}/revoke`, {});
    return data;
  },

  // Analytics
  async getUsageAnalytics(params: {
    startDate: string;
    endDate: string;
    groupBy?: string;
  }): Promise<{ success: boolean; analytics: UsageAnalyticsPoint[] }> {
    const { data } = await api.get("/api/admin/analytics/usage", { params });
    return data;
  },

  async getTopEndpoints(): Promise<{
    success: boolean;
    endpoints: TopEndpoint[];
  }> {
    const { data } = await api.get("/api/admin/analytics/endpoints");
    return data;
  },

  // Plans
  async listPlans(): Promise<{
    success: boolean;
    plans: ApiPricingPlanDTO[];
  }> {
    const { data } = await api.get("/api/admin/plans");
    return data;
  },

  async createPlan(
    plan: Partial<ApiPricingPlanDTO>
  ): Promise<{ success: boolean; plan: ApiPricingPlanDTO }> {
    const { data } = await api.post("/api/admin/plans", plan);
    return data;
  },

  async updatePlan(
    planId: string,
    updates: Partial<ApiPricingPlanDTO>
  ): Promise<{ success: boolean; plan: ApiPricingPlanDTO }> {
    const { data } = await api.put(`/api/admin/plans/${planId}`, updates);
    return data;
  },

  async deletePlan(planId: string): Promise<{ success: boolean }> {
    const { data } = await api.delete(`/api/admin/plans/${planId}`);
    return data;
  },

  // Credit Packs
  async listCreditPacks(): Promise<{
    success: boolean;
    packs: ApiCreditPackDTO[];
  }> {
    const { data } = await api.get("/api/admin/credit-packs");
    return data;
  },

  async createCreditPack(
    pack: Partial<ApiCreditPackDTO>
  ): Promise<{ success: boolean; pack: ApiCreditPackDTO }> {
    const { data } = await api.post("/api/admin/credit-packs", pack);
    return data;
  },

  async updateCreditPack(
    packId: string,
    updates: Partial<ApiCreditPackDTO>
  ): Promise<{ success: boolean; pack: ApiCreditPackDTO }> {
    const { data } = await api.put(
      `/api/admin/credit-packs/${packId}`,
      updates
    );
    return data;
  },

  async deleteCreditPack(packId: string): Promise<{ success: boolean }> {
    const { data } = await api.delete(`/api/admin/credit-packs/${packId}`);
    return data;
  },
};
