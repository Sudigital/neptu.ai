import type { Potensi, Peluang, CompatibilityResult } from "@neptu/shared";
import { AzureOpenAI } from "openai";
import {
  getSystemPrompt,
  generateUserPrompt,
  generateDailyPrompt,
  generateDateInterpretationPrompt,
  generateCompatibilityPrompt,
  postProcessResponse,
} from "./prompts";

interface OracleConfig {
  apiKey: string;
  endpoint?: string;
  deployment?: string;
  apiVersion?: string;
  maxTokens?: number;
}

interface OracleResponse {
  message: string;
  cached: boolean;
  tokensUsed?: number;
}

/**
 * Neptu AI Oracle - Provides personalized reading interpretations
 * Using Azure OpenAI
 */
export class NeptuOracle {
  private client: AzureOpenAI;
  private deployment: string;
  private maxTokens: number;

  constructor(config: OracleConfig) {
    this.deployment = config.deployment || "gpt-4o-mini";
    this.maxTokens = config.maxTokens || 500;

    this.client = new AzureOpenAI({
      endpoint:
        config.endpoint || "https://super-su.cognitiveservices.azure.com/",
      apiKey: config.apiKey,
      deployment: this.deployment,
      apiVersion: config.apiVersion || "2024-04-01-preview",
    });
  }

  /**
   * Generate cache key for a question
   */
  private getCacheKey(
    potensiHash: string,
    peluangDate: string | null,
    question: string,
  ): string {
    const questionHash = this.hashString(question.toLowerCase().trim());
    return `oracle:${potensiHash}:${peluangDate || "potensi"}:${questionHash}`;
  }

  /**
   * Simple string hash
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Call Azure OpenAI API
   */
  private async callAzureOpenAI(
    systemPrompt: string,
    userPrompt: string,
  ): Promise<{ content: string; tokensUsed: number }> {
    const response = await this.client.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      max_tokens: this.maxTokens,
      temperature: 0.7,
      top_p: 1,
      model: this.deployment,
    });

    return {
      content: response.choices[0]?.message?.content || "",
      tokensUsed: response.usage?.total_tokens || 0,
    };
  }

  /**
   * Ask the oracle a question about a reading
   */
  async askQuestion(
    question: string,
    potensi: Potensi,
    peluang?: Peluang,
    cache?: KVNamespace,
    language: string = "en",
  ): Promise<OracleResponse> {
    const potensiHash = this.hashString(
      `${potensi.wuku.name}:${potensi.total_urip}`,
    );
    const peluangDate = peluang?.date || null;
    const cacheKey =
      this.getCacheKey(potensiHash, peluangDate, question) + `:${language}`;

    // Check cache
    if (cache) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return { message: postProcessResponse(cached, language), cached: true };
      }
    }

    // Generate prompt with raw data - let AI analyze naturally
    const userPrompt = generateUserPrompt(question, potensi, peluang, language);

    // Call AI
    const { content: rawContent, tokensUsed } = await this.callAzureOpenAI(
      getSystemPrompt(language),
      userPrompt,
    );
    const content = postProcessResponse(rawContent, language);

    // Cache response (24 hours)
    if (cache) {
      try {
        await cache.put(cacheKey, content, { expirationTtl: 86400 });
      } catch {
        /* KV limit */
      }
    }

    return {
      message: content,
      cached: false,
      tokensUsed,
    };
  }

  /**
   * Generate daily interpretation
   */
  async getDailyInterpretation(
    potensi: Potensi,
    peluang: Peluang,
    cache?: KVNamespace,
    language: string = "en",
  ): Promise<OracleResponse> {
    const cacheKey = `daily:${potensi.date}:${peluang.date}:${language}`;

    // Check cache
    if (cache) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return { message: postProcessResponse(cached, language), cached: true };
      }
    }

    const userPrompt = generateDailyPrompt(potensi, peluang, language);

    const { content: rawContent, tokensUsed } = await this.callAzureOpenAI(
      getSystemPrompt(language),
      userPrompt,
    );
    const content = postProcessResponse(rawContent, language);

    // Cache for 24 hours
    if (cache) {
      try {
        await cache.put(cacheKey, content, { expirationTtl: 86400 });
      } catch {
        /* KV limit */
      }
    }

    return {
      message: content,
      cached: false,
      tokensUsed,
    };
  }

  /**
   * Generate interpretation for a specific date
   */
  async getDateInterpretation(
    potensi: Potensi,
    peluang: Peluang,
    targetDate: Date,
    _cache?: KVNamespace,
    language: string = "en",
  ): Promise<string> {
    const userPrompt = generateDateInterpretationPrompt(
      potensi,
      peluang,
      targetDate,
      language,
    );

    const { content } = await this.callAzureOpenAI(
      getSystemPrompt(language),
      userPrompt,
    );

    return postProcessResponse(content, language);
  }

  /**
   * Generate AI interpretation for a compatibility / Mitra Satru reading
   */
  async getCompatibilityInterpretation(
    result: CompatibilityResult,
    cache?: KVNamespace,
    language: string = "en",
  ): Promise<OracleResponse> {
    const cacheKey = `compat:${result.person1.date}:${result.person2.date}:${language}`;

    if (cache) {
      const cached = await cache.get(cacheKey);
      if (cached) {
        return { message: postProcessResponse(cached, language), cached: true };
      }
    }

    const userPrompt = generateCompatibilityPrompt(result, language);

    const { content: rawContent, tokensUsed } = await this.callAzureOpenAI(
      getSystemPrompt(language),
      userPrompt,
    );
    const content = postProcessResponse(rawContent, language);

    if (cache) {
      try {
        await cache.put(cacheKey, content, { expirationTtl: 21600 });
      } catch {
        /* KV limit */
      }
    }

    return {
      message: content,
      cached: false,
      tokensUsed,
    };
  }
}
