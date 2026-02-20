import type { OAuthClientDTO, OAuthConsentDTO } from "@neptu/drizzle-orm";

import { api } from "@/lib/api";

interface ConsentResponse {
  success: boolean;
  consent: OAuthConsentDTO;
}

interface AuthorizeResponse {
  success: boolean;
  redirect: string;
}

export const oauthApi = {
  async getConsentData(params: {
    client_id: string;
    redirect_uri: string;
    response_type: string;
    scope: string;
    state: string;
    code_challenge: string;
    code_challenge_method: string;
  }): Promise<ConsentResponse> {
    const { data } = await api.get<ConsentResponse>("/api/v1/oauth/authorize", {
      params,
    });
    return data;
  },

  async submitConsent(body: {
    client_id: string;
    redirect_uri: string;
    scope: string;
    state: string;
    code_challenge: string;
    code_challenge_method: string;
    approved: boolean;
  }): Promise<AuthorizeResponse> {
    const { data } = await api.post<AuthorizeResponse>(
      "/api/v1/oauth/authorize",
      body
    );
    return data;
  },
};

export const developerOAuthApi = {
  async listClients(): Promise<{
    success: boolean;
    clients: OAuthClientDTO[];
  }> {
    const { data } = await api.get("/api/v1/developer/oauth/clients");
    return data;
  },

  async createClient(input: {
    name: string;
    description?: string;
    logoUrl?: string;
    redirectUris: string[];
    scopes: string[];
    grantTypes: string[];
    isConfidential: boolean;
  }): Promise<{
    success: boolean;
    client: OAuthClientDTO & { clientSecret: string };
    warning: string;
  }> {
    const { data } = await api.post("/api/v1/developer/oauth/clients", input);
    return data;
  },

  async getClient(id: string): Promise<{
    success: boolean;
    client: OAuthClientDTO;
  }> {
    const { data } = await api.get(`/api/v1/developer/oauth/clients/${id}`);
    return data;
  },

  async updateClient(
    id: string,
    input: {
      name?: string;
      description?: string | null;
      logoUrl?: string | null;
      redirectUris?: string[];
      scopes?: string[];
      isActive?: boolean;
    }
  ): Promise<{ success: boolean; client: OAuthClientDTO }> {
    const { data } = await api.patch(
      `/api/v1/developer/oauth/clients/${id}`,
      input
    );
    return data;
  },

  async rotateSecret(id: string): Promise<{
    success: boolean;
    client: OAuthClientDTO & { clientSecret: string };
    warning: string;
  }> {
    const { data } = await api.post(
      `/api/v1/developer/oauth/clients/${id}/rotate-secret`
    );
    return data;
  },

  async deleteClient(id: string): Promise<{
    success: boolean;
    message: string;
  }> {
    const { data } = await api.delete(`/api/v1/developer/oauth/clients/${id}`);
    return data;
  },
};
