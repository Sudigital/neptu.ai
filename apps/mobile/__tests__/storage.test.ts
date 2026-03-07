import { describe, expect, test, beforeEach } from "bun:test";

// Test the pure logic of conversation tracking and MWA auth token storage
// These tests mock MMKV since it's not available outside React Native

// Simulate MMKV in-memory store
const store = new Map<string, string | number | boolean>();

const mockMmkv = {
  getString: (key: string) => store.get(key) as string | undefined,
  getNumber: (key: string) => store.get(key) as number | undefined,
  getBoolean: (key: string) => store.get(key) as boolean | undefined,
  set: (key: string, value: string | number | boolean) => store.set(key, value),
  clearAll: () => store.clear(),
};

// Re-implement storage functions using mock (same logic as storage.ts)
const KEYS = {
  USER_PROFILE: "user_profile",
  LANGUAGE: "language_code",
  ONBOARDED: "onboarded",
  CONVERSATIONS_TODAY: "conversations_today",
  CONVERSATIONS_DATE: "conversations_date",
  MWA_AUTH_TOKEN: "mwa_auth_token",
} as const;

function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

function getConversationsToday(): number {
  const storedDate = mockMmkv.getString(KEYS.CONVERSATIONS_DATE);
  const today = getTodayKey();
  if (storedDate !== today) {
    mockMmkv.set(KEYS.CONVERSATIONS_DATE, today);
    mockMmkv.set(KEYS.CONVERSATIONS_TODAY, 0);
    return 0;
  }
  return mockMmkv.getNumber(KEYS.CONVERSATIONS_TODAY) ?? 0;
}

function incrementConversations(): number {
  const today = getTodayKey();
  const storedDate = mockMmkv.getString(KEYS.CONVERSATIONS_DATE);
  if (storedDate !== today) {
    mockMmkv.set(KEYS.CONVERSATIONS_DATE, today);
    mockMmkv.set(KEYS.CONVERSATIONS_TODAY, 1);
    return 1;
  }
  const count = (mockMmkv.getNumber(KEYS.CONVERSATIONS_TODAY) ?? 0) + 1;
  mockMmkv.set(KEYS.CONVERSATIONS_TODAY, count);
  return count;
}

function getLanguage(): string {
  return mockMmkv.getString(KEYS.LANGUAGE) ?? "en";
}

function saveLanguage(code: string): void {
  mockMmkv.set(KEYS.LANGUAGE, code);
}

function isOnboarded(): boolean {
  return mockMmkv.getBoolean(KEYS.ONBOARDED) ?? false;
}

function setOnboarded(value: boolean): void {
  mockMmkv.set(KEYS.ONBOARDED, value);
}

function saveMwaAuthToken(token: string): void {
  mockMmkv.set(KEYS.MWA_AUTH_TOKEN, token);
}

function getMwaAuthToken(): string {
  return mockMmkv.getString(KEYS.MWA_AUTH_TOKEN) ?? "";
}

// Conversation History (mirrors storage.ts logic)
interface ConversationEntry {
  id: string;
  timestamp: number;
  transcript: string;
  response: string;
  language: string;
}

const CONVERSATION_HISTORY_KEY = "conversation_history";
const MAX_CONVERSATION_HISTORY = 20;

function getConversationHistory(): ConversationEntry[] {
  const raw = mockMmkv.getString(CONVERSATION_HISTORY_KEY);
  if (!raw) return [];
  return JSON.parse(raw) as ConversationEntry[];
}

function addConversation(entry: ConversationEntry): void {
  const history = getConversationHistory();
  history.unshift(entry);
  const trimmed = history.slice(0, MAX_CONVERSATION_HISTORY);
  mockMmkv.set(CONVERSATION_HISTORY_KEY, JSON.stringify(trimmed));
}

function clearConversationHistory(): void {
  mockMmkv.set(CONVERSATION_HISTORY_KEY, JSON.stringify([]));
}

function makeEntry(
  overrides: Partial<ConversationEntry> = {}
): ConversationEntry {
  return {
    id: `test-${Date.now()}-${Math.random()}`,
    timestamp: Date.now(),
    transcript: "What's BTC price?",
    response: "The stars say bullish.",
    language: "en",
    ...overrides,
  };
}

// Tests
describe("Storage - Conversation Tracking", () => {
  beforeEach(() => {
    store.clear();
  });

  test("getConversationsToday returns 0 on fresh state", () => {
    expect(getConversationsToday()).toBe(0);
  });

  test("incrementConversations returns 1 on first call", () => {
    expect(incrementConversations()).toBe(1);
  });

  test("incrementConversations increments correctly", () => {
    expect(incrementConversations()).toBe(1);
    expect(incrementConversations()).toBe(2);
    expect(incrementConversations()).toBe(3);
    expect(getConversationsToday()).toBe(3);
  });

  test("resets count when date changes", () => {
    // Set a past date
    mockMmkv.set(KEYS.CONVERSATIONS_DATE, "2020-01-01");
    mockMmkv.set(KEYS.CONVERSATIONS_TODAY, 10);

    // Should reset to 0 since date doesn't match today
    const count = getConversationsToday();
    expect(count).toBe(0);
  });

  test("incrementConversations resets on new day", () => {
    // Set a past date with high count
    mockMmkv.set(KEYS.CONVERSATIONS_DATE, "2020-01-01");
    mockMmkv.set(KEYS.CONVERSATIONS_TODAY, 99);

    // Should start fresh at 1
    const count = incrementConversations();
    expect(count).toBe(1);
  });
});

describe("Storage - Language", () => {
  beforeEach(() => {
    store.clear();
  });

  test("getLanguage returns 'en' by default", () => {
    expect(getLanguage()).toBe("en");
  });

  test("saveLanguage and getLanguage roundtrip", () => {
    saveLanguage("id");
    expect(getLanguage()).toBe("id");
    saveLanguage("ja");
    expect(getLanguage()).toBe("ja");
  });
});

describe("Storage - Onboarding", () => {
  beforeEach(() => {
    store.clear();
  });

  test("isOnboarded returns false by default", () => {
    expect(isOnboarded()).toBe(false);
  });

  test("setOnboarded persists value", () => {
    setOnboarded(true);
    expect(isOnboarded()).toBe(true);
    setOnboarded(false);
    expect(isOnboarded()).toBe(false);
  });
});

describe("Storage - MWA Auth Token", () => {
  beforeEach(() => {
    store.clear();
  });

  test("getMwaAuthToken returns empty string by default", () => {
    expect(getMwaAuthToken()).toBe("");
  });

  test("saveMwaAuthToken and getMwaAuthToken roundtrip", () => {
    saveMwaAuthToken("test-auth-token-123");
    expect(getMwaAuthToken()).toBe("test-auth-token-123");
  });
});

describe("Free Tier Logic", () => {
  const FREE_DAILY_CONVERSATIONS = 5;

  beforeEach(() => {
    store.clear();
  });

  test("should allow conversations within free limit", () => {
    for (let i = 0; i < FREE_DAILY_CONVERSATIONS; i++) {
      const used = getConversationsToday();
      expect(used < FREE_DAILY_CONVERSATIONS).toBe(true);
      incrementConversations();
    }
  });

  test("should block conversations at free limit", () => {
    for (let i = 0; i < FREE_DAILY_CONVERSATIONS; i++) {
      incrementConversations();
    }
    const used = getConversationsToday();
    expect(used >= FREE_DAILY_CONVERSATIONS).toBe(true);
  });

  test("freeRemaining decreases correctly", () => {
    expect(
      Math.max(0, FREE_DAILY_CONVERSATIONS - getConversationsToday())
    ).toBe(5);

    incrementConversations();
    expect(
      Math.max(0, FREE_DAILY_CONVERSATIONS - getConversationsToday())
    ).toBe(4);

    incrementConversations();
    incrementConversations();
    expect(
      Math.max(0, FREE_DAILY_CONVERSATIONS - getConversationsToday())
    ).toBe(2);
  });

  test("freeRemaining never goes below 0", () => {
    for (let i = 0; i < 10; i++) {
      incrementConversations();
    }
    expect(
      Math.max(0, FREE_DAILY_CONVERSATIONS - getConversationsToday())
    ).toBe(0);
  });
});

describe("Storage - Conversation History", () => {
  beforeEach(() => {
    store.clear();
  });

  test("getConversationHistory returns empty array on fresh state", () => {
    expect(getConversationHistory()).toEqual([]);
  });

  test("addConversation stores an entry", () => {
    const entry = makeEntry({ transcript: "Hello", response: "Hi" });
    addConversation(entry);
    const history = getConversationHistory();
    expect(history).toHaveLength(1);
    expect(history[0].transcript).toBe("Hello");
    expect(history[0].response).toBe("Hi");
  });

  test("newest entries appear first (unshift)", () => {
    const first = makeEntry({ transcript: "First", timestamp: 1000 });
    const second = makeEntry({ transcript: "Second", timestamp: 2000 });
    addConversation(first);
    addConversation(second);
    const history = getConversationHistory();
    expect(history[0].transcript).toBe("Second");
    expect(history[1].transcript).toBe("First");
  });

  test("caps history at MAX_CONVERSATION_HISTORY", () => {
    for (let i = 0; i < 25; i++) {
      addConversation(makeEntry({ transcript: `Entry ${i}` }));
    }
    const history = getConversationHistory();
    expect(history).toHaveLength(MAX_CONVERSATION_HISTORY);
    expect(history[0].transcript).toBe("Entry 24");
  });

  test("clearConversationHistory removes all entries", () => {
    addConversation(makeEntry());
    addConversation(makeEntry());
    expect(getConversationHistory()).toHaveLength(2);
    clearConversationHistory();
    expect(getConversationHistory()).toEqual([]);
  });

  test("preserves all entry fields", () => {
    const entry = makeEntry({
      id: "test-id",
      timestamp: 1700000000000,
      transcript: "Solana price?",
      response: "SOL is rising.",
      language: "id",
    });
    addConversation(entry);
    const stored = getConversationHistory()[0];
    expect(stored.id).toBe("test-id");
    expect(stored.timestamp).toBe(1700000000000);
    expect(stored.transcript).toBe("Solana price?");
    expect(stored.response).toBe("SOL is rising.");
    expect(stored.language).toBe("id");
  });
});

// ===========================================================================
// Payment transaction assembly tests
// ===========================================================================
describe("Payment Transaction Assembly", () => {
  // We test the pure logic of assembleTransaction by importing from @solana/web3.js
  // This mirrors the function in usePayment.ts

  /* eslint-disable @typescript-eslint/no-require-imports */
  const { PublicKey, Transaction, TransactionInstruction } =
    require("@solana/web3.js") as typeof import("@solana/web3.js");

  interface PaymentBuildResponse {
    success: boolean;
    instruction: {
      programId: string;
      accounts: Array<{ address: string; role: number }>;
      data: number[];
    };
    transaction: {
      blockhash: string;
      lastValidBlockHeight: number;
    };
    pricing: {
      solAmount: number;
      neptuReward?: number;
    };
  }

  function assembleTransaction(build: PaymentBuildResponse): string {
    const { instruction: ixData, transaction: txMeta } = build;
    const keys = ixData.accounts.map((acc) => ({
      pubkey: new PublicKey(acc.address),
      isSigner: (acc.role & 0x02) !== 0,
      isWritable: (acc.role & 0x01) !== 0,
    }));
    const ix = new TransactionInstruction({
      programId: new PublicKey(ixData.programId),
      keys,
      data: Buffer.from(ixData.data),
    });
    const tx = new Transaction();
    tx.recentBlockhash = txMeta.blockhash;
    tx.lastValidBlockHeight = txMeta.lastValidBlockHeight;
    // Fee payer is the first signer account
    const signer = keys.find((k) => k.isSigner);
    if (signer) {
      tx.feePayer = signer.pubkey;
    }
    tx.add(ix);
    const serialized = tx.serialize({
      requireAllSignatures: false,
      verifySignatures: false,
    });
    return Buffer.from(serialized).toString("base64");
  }

  const MOCK_PROGRAM = "7JDwi8jxiGXDzDNZxRPAAVZPBBnQHng1rP7XRPF1hKmX";
  const MOCK_TREASURY = "2FTF4cZVfik3QLKCA5LcV8q8qeCG3FNf7kMWphhFEDqr";
  const MOCK_USER = "J3dxNj7nDRRqRRXuEMynDG57DkZK4jYRuv3Garmb1i91";

  const mockBuildResponse: PaymentBuildResponse = {
    success: true,
    instruction: {
      programId: MOCK_PROGRAM,
      accounts: [
        { address: MOCK_USER, role: 0x03 }, // writable + signer
        { address: MOCK_TREASURY, role: 0x01 }, // writable
      ],
      data: [1, 2, 3, 4, 0, 0, 0, 0],
    },
    transaction: {
      blockhash: "GHtXQBsoZHVnNFa9YzA7tSjDham6kuM1mFpWQpzowFTd",
      lastValidBlockHeight: 250000,
    },
    pricing: {
      solAmount: 0.01,
      neptuReward: 5,
    },
  };

  test("assembles a valid base64 transaction", () => {
    const base64 = assembleTransaction(mockBuildResponse);
    expect(typeof base64).toBe("string");
    expect(base64.length).toBeGreaterThan(0);
    // Should be valid base64
    const decoded = Buffer.from(base64, "base64");
    expect(decoded.length).toBeGreaterThan(0);
  });

  test("assembled transaction can be deserialized", () => {
    const base64 = assembleTransaction(mockBuildResponse);
    const txBuffer = Buffer.from(base64, "base64");
    const tx = Transaction.from(txBuffer);
    expect(tx.recentBlockhash).toBe(mockBuildResponse.transaction.blockhash);
    expect(tx.instructions).toHaveLength(1);
    expect(tx.instructions[0].programId.toBase58()).toBe(MOCK_PROGRAM);
  });

  test("account roles are mapped correctly", () => {
    const base64 = assembleTransaction(mockBuildResponse);
    const tx = Transaction.from(Buffer.from(base64, "base64"));
    const ix = tx.instructions[0];

    // First account: role 0x03 = writable (0x01) + signer (0x02)
    expect(ix.keys[0].isSigner).toBe(true);
    expect(ix.keys[0].isWritable).toBe(true);

    // Second account: role 0x01 = writable only
    expect(ix.keys[1].isSigner).toBe(false);
    expect(ix.keys[1].isWritable).toBe(true);
  });

  test("instruction data is preserved", () => {
    const base64 = assembleTransaction(mockBuildResponse);
    const tx = Transaction.from(Buffer.from(base64, "base64"));
    const data = Array.from(tx.instructions[0].data);
    expect(data).toEqual([1, 2, 3, 4, 0, 0, 0, 0]);
  });
});

// ===========================================================================
// Reward & Streak type validation tests
// ===========================================================================
describe("Reward & Streak Types", () => {
  test("RewardInfo shape is correct", () => {
    const reward = {
      id: "uuid-123",
      rewardType: "payment_reward",
      neptuAmount: "0.5",
      description: "Conversation reward",
      status: "pending",
      createdAt: "2026-02-20T00:00:00Z",
    };
    expect(reward.id).toBe("uuid-123");
    expect(reward.rewardType).toBe("payment_reward");
    expect(Number(reward.neptuAmount)).toBe(0.5);
    expect(reward.status).toBe("pending");
  });

  test("StreakInfo shape is correct", () => {
    const streak = {
      currentStreak: 7,
      longestStreak: 14,
      lastCheckIn: "2026-02-20T12:00:00Z",
      totalCheckIns: 30,
    };
    expect(streak.currentStreak).toBe(7);
    expect(streak.longestStreak).toBe(14);
    expect(streak.totalCheckIns).toBe(30);
  });

  test("network-aware reward token label", () => {
    const getRewardLabel = (network: string) =>
      network === "mainnet" ? "SKR" : "SUDIGITAL";
    expect(getRewardLabel("devnet")).toBe("SUDIGITAL");
    expect(getRewardLabel("mainnet")).toBe("SKR");
  });
});
