# 🚀 NL-Fi - Project Specification

> **Project Name:** NL-Fi  
> **Tagline:** "Say It. Swap It." _(temporary)_  
> **Agent Name:** `nl-fi`  
> **Status:** Specification Phase

---

## 📋 Overview

### What is NL-Fi?

NL-Fi is an AI-powered agent that allows users to interact with Solana DeFi protocols using natural language. Instead of navigating complex UIs or writing code, users simply describe what they want to do.

### The Problem

- DeFi interfaces are complex and intimidating
- Users need to understand multiple protocols
- High barrier to entry for newcomers
- Easy to make costly mistakes

### The Solution

```
Traditional DeFi:
1. Go to Jupiter
2. Connect wallet
3. Select tokens
4. Enter amount
5. Check slippage
6. Approve transaction
7. Confirm in wallet

NL-Fi:
User: "Swap 100 USDC to SOL"
Agent: "Done ✅"
```

---

## 🎯 Core Features (MVP - 9 Days)

### Phase 1: Foundation (Day 1-2)

- [ ] Project setup (Vite, React, TypeScript)
- [ ] Azure OpenAI integration
- [ ] Solana wallet connection
- [ ] Basic intent parsing

### Phase 2: DeFi Integration (Day 3-5)

- [ ] Jupiter integration (swaps)
- [ ] Transaction building
- [ ] Transaction preview
- [ ] Execution via AgentWallet

### Phase 3: UX & Safety (Day 6-7)

- [ ] Confirmation dialogs
- [ ] Error handling
- [ ] Transaction history
- [ ] Balance checking

### Phase 4: Polish (Day 8-9)

- [ ] Demo video
- [ ] Documentation
- [ ] Testing
- [ ] Submission

---

## 🗣️ Supported Commands (MVP)

### Tier 1: Must Have (Swaps)

```
"Swap 100 USDC to SOL"
"Convert 50 SOL to USDC"
"Trade 10 JUP for BONK"
"Exchange all my USDC for SOL"
```

### Tier 2: Should Have (Info)

```
"What's my SOL balance?"
"Show my portfolio"
"What's the price of JUP?"
"How much USDC do I have?"
```

### Tier 3: Nice to Have (Advanced)

```
"Stake 50 SOL on Marinade"
"What's the best yield for USDC?"
"Set a limit order to buy SOL at $90"
```

### 🎤 Voice Commands (Differentiator!)

```
🎤 "Swap hundred USDC to SOL"
🎤 "What's my balance?"
🎤 "Show me Jupiter prices"
```

---

## 🎤 Voice Input Feature

### Why Voice?

- **Unique differentiator** - No other DeFi tool has voice
- **True "Natural Language"** - Speaking is more natural than typing
- **Accessibility** - Helps users who prefer voice
- **"Wow factor"** for demo - Judges will remember this!

### How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                      VOICE INPUT FLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. User clicks 🎤 button                                          │
│         │                                                           │
│         ▼                                                           │
│  2. Browser records audio (MediaRecorder API)                      │
│         │                                                           │
│         ▼                                                           │
│  3. Send audio to Cloudflare Worker                                │
│         │                                                           │
│         ▼                                                           │
│  4. Worker calls Azure Speech-to-Text                              │
│         │                                                           │
│         ▼                                                           │
│  5. Transcription: "swap hundred USDC to SOL"                      │
│         │                                                           │
│         ▼                                                           │
│  6. Send to GPT-4o for intent parsing                              │
│         │                                                           │
│         ▼                                                           │
│  7. Execute swap (same as text input)                              │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Azure Speech-to-Text Integration

```typescript
// Worker: /routes/speech.ts
const speechToText = async (audioBuffer: ArrayBuffer, env: Env) => {
  const response = await fetch(
    `${env.AZURE_SPEECH_ENDPOINT}/speech/recognition/conversation/cognitiveservices/v1?language=en-US`,
    {
      method: "POST",
      headers: {
        "Ocp-Apim-Subscription-Key": env.AZURE_SPEECH_KEY,
        "Content-Type": "audio/wav",
      },
      body: audioBuffer,
    }
  );

  const result = await response.json();
  return result.DisplayText; // "Swap hundred USDC to SOL"
};
```

### Voice Feature Scope

| Feature                         | Priority | Effort |
| ------------------------------- | -------- | ------ |
| Voice input (Speech-to-Text)    | MVP      | Medium |
| Voice response (Text-to-Speech) | Stretch  | Low    |
| Wake word ("Hey NL-Fi")         | Future   | High   |

---

## 🏗️ Technical Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         NL-Fi ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐                                                    │
│  │    User     │                                                    │
│  │   Input     │  "Swap 100 USDC to SOL"                           │
│  └──────┬──────┘                                                    │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   VITE + REACT FRONTEND                      │   │
│  │  • Chat interface                                            │   │
│  │  • Wallet connection (Solana Wallet Adapter)                 │   │
│  │  • Transaction preview modal                                 │   │
│  │  • History view                                              │   │
│  └──────┬──────────────────────────────────────────────────────┘   │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                     NL-Fi CORE ENGINE                        │   │
│  │                                                              │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │   │
│  │  │    Intent    │  │   Action     │  │ Transaction  │       │   │
│  │  │    Parser    │→ │   Router     │→ │   Builder    │       │   │
│  │  │  (Azure GPT) │  │              │  │              │       │   │
│  │  └──────────────┘  └──────────────┘  └──────────────┘       │   │
│  │                                                              │   │
│  └──────┬──────────────────────────────────────────────────────┘   │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   PROTOCOL ADAPTERS                          │   │
│  │                                                              │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐    │   │
│  │  │ Jupiter  │  │ Marinade │  │  Kamino  │  │   Pyth   │    │   │
│  │  │  (Swap)  │  │ (Stake)  │  │ (Lend)   │  │ (Prices) │    │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘    │   │
│  │                                                              │   │
│  └──────┬──────────────────────────────────────────────────────┘   │
│         │                                                           │
│         ▼                                                           │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      SOLANA NETWORK                          │   │
│  │  • Devnet (for hackathon demo)                               │   │
│  │  • @solana/kit                                               │   │
│  │  • AgentWallet for signing                                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🧠 Intent Parser (GPT Prompt Design)

### System Prompt

```
You are NL-Fi, a DeFi assistant for Solana. Parse user commands into structured actions.

Supported actions:
1. SWAP - Exchange one token for another
2. BALANCE - Check token balance
3. PRICE - Get token price
4. STAKE - Stake SOL (future)
5. INFO - General information

Output JSON format:
{
  "action": "SWAP",
  "params": {
    "fromToken": "USDC",
    "toToken": "SOL",
    "amount": 100,
    "slippage": 0.5
  },
  "confidence": 0.95,
  "clarification": null
}

If unclear, set confidence < 0.7 and provide clarification question.
```

### Example Parsing

| User Input                | Parsed Action                                                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------- |
| "Swap 100 USDC to SOL"    | `{action: "SWAP", params: {from: "USDC", to: "SOL", amount: 100}}`                                       |
| "How much SOL do I have?" | `{action: "BALANCE", params: {token: "SOL"}}`                                                            |
| "What's JUP worth?"       | `{action: "PRICE", params: {token: "JUP"}}`                                                              |
| "Send money to Alice"     | `{action: "UNKNOWN", clarification: "I can help with swaps and balances. Did you mean to swap tokens?"}` |

---

## 🔐 Security & Safety

### Transaction Safety

1. **Preview Required** - Always show transaction details before execution
2. **Confirmation** - Require explicit "Confirm" for all transactions
3. **Limits** - Warn on transactions > $1000
4. **Simulation** - Simulate transaction before sending

### What NL-Fi Will NOT Do

- ❌ Execute without confirmation
- ❌ Handle private keys directly (uses wallet adapter)
- ❌ Make financial recommendations
- ❌ Access funds without user approval

### Error Handling

```
User: "Swap 1000000 SOL to USDC"
NL-Fi: "⚠️ You only have 5.2 SOL in your wallet.
        Would you like to swap all 5.2 SOL instead?"
```

---

## 🛠️ Tech Stack

| Component       | Technology                             |
| --------------- | -------------------------------------- |
| **Frontend**    | Vite, React, TypeScript, TailwindCSS   |
| **AI (Chat)**   | Azure OpenAI (GPT-4o)                  |
| **AI (Voice)**  | Azure Speech Services (Speech-to-Text) |
| **Backend/API** | Cloudflare Workers (serverless)        |
| **Hosting**     | Cloudflare Pages                       |
| **Wallet**      | Solana Wallet Adapter                  |
| **DeFi**        | Jupiter API, Pyth (prices)             |
| **Blockchain**  | @solana/kit, Devnet                    |
| **Signing**     | AgentWallet (for hackathon)            |

### Azure Services Required

| Service          | Purpose                                 | Pricing                     |
| ---------------- | --------------------------------------- | --------------------------- |
| **Azure OpenAI** | GPT-4o for intent parsing               | Pay per token               |
| **Azure Speech** | Speech-to-Text for voice input          | Free tier: 5 hrs/month      |
| **Azure Speech** | Text-to-Speech for responses (optional) | Free tier: 0.5M chars/month |

---

## 📁 Project Structure

```
/                                # Root folder
├── src/                         # Frontend (Vite + React)
│   ├── main.tsx                 # Vite entry point
│   ├── App.tsx                  # Main app component
│   ├── vite-env.d.ts            # Vite types
│   ├── index.css                # Global styles (Tailwind)
│   ├── components/
│   │   ├── ChatInterface.tsx    # Main chat UI
│   │   ├── MessageBubble.tsx    # Chat messages
│   │   ├── TransactionPreview.tsx
│   │   ├── WalletButton.tsx
│   │   └── BalanceDisplay.tsx
│   ├── lib/
│   │   ├── ai/
│   │   │   ├── client.ts        # API client for Workers
│   │   │   └── prompts.ts       # System prompts
│   │   ├── solana/
│   │   │   ├── connection.ts    # Solana connection
│   │   │   ├── tokens.ts        # Token utilities
│   │   │   └── transaction.ts   # TX building
│   │   ├── protocols/
│   │   │   ├── jupiter.ts       # Jupiter integration
│   │   │   ├── marinade.ts      # Marinade (stretch)
│   │   │   └── pyth.ts          # Price feeds
│   │   └── types/
│   │       └── actions.ts       # Action types
│   └── hooks/
│       ├── useNLFi.ts           # Main NL-Fi hook
│       ├── useVoice.ts          # Voice recording hook
│       └── useWallet.ts         # Wallet hook
├── workers/                     # Cloudflare Workers (API)
│   ├── src/
│   │   ├── index.ts             # Worker entry point
│   │   ├── routes/
│   │   │   ├── parse.ts         # Intent parsing endpoint
│   │   │   ├── speech.ts        # Azure Speech-to-Text endpoint
│   │   │   ├── quote.ts         # Jupiter quote proxy
│   │   │   └── health.ts        # Health check
│   │   └── lib/
│   │       ├── openai.ts        # Azure OpenAI client
│   │       └── speech.ts        # Azure Speech client
│   ├── wrangler.toml            # Cloudflare Worker config
│   └── package.json
├── public/
├── index.html                   # Vite HTML entry
├── .env                         # Local dev env (gitignored)
├── .dev.vars                    # Worker secrets (gitignored)
├── package.json
├── tsconfig.json
├── vite.config.ts               # Vite configuration
├── tailwind.config.js           # Tailwind config
├── postcss.config.js            # PostCSS config
├── wrangler.toml                # Cloudflare Pages config
└── README.md
```

│ │ │ ├── marinade.ts # Marinade (stretch)
│ │ │ └── pyth.ts # Price feeds
│ │ └── types/
│ │ └── actions.ts # Action types
│ └── hooks/
│ ├── useNLFi.ts # Main NL-Fi hook
│ └── useWallet.ts # Wallet hook
├── public/
├── index.html # Vite HTML entry
├── .env # API keys (gitignored)
├── package.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts # Vite configuration
├── tailwind.config.js # Tailwind config
├── postcss.config.js # PostCSS config
└── README.md

````

---

## 🧪 Devnet vs Mainnet Strategy

### The Reality
**Jupiter does NOT support devnet.** Their API only works on mainnet. We need a strategy for testing.

### Network Modes

```typescript
// src/lib/config.ts
export const config = {
  network: import.meta.env.VITE_NETWORK || 'devnet',
  rpcUrl: import.meta.env.VITE_NETWORK === 'mainnet'
    ? 'https://api.mainnet-beta.solana.com'
    : 'https://api.devnet.solana.com',
  mockSwaps: import.meta.env.VITE_NETWORK === 'devnet', // Auto-mock on devnet
};
````

### Feature Matrix by Network

| Feature           | Devnet                     | Mainnet |
| ----------------- | -------------------------- | ------- |
| Wallet connection | ✅ Real                    | ✅ Real |
| SOL balance       | ✅ Real                    | ✅ Real |
| Token balances    | ✅ Real (devnet tokens)    | ✅ Real |
| Voice input       | ✅ Real (Azure Speech)     | ✅ Real |
| Intent parsing    | ✅ Real (GPT-4o)           | ✅ Real |
| Jupiter quote     | 🔶 Mock (realistic prices) | ✅ Real |
| Swap execution    | 🔶 Mock (simulated)        | ✅ Real |

### Mock Implementation

```typescript
// src/lib/protocols/jupiter.ts
export async function getQuote(params: QuoteParams) {
  if (config.mockSwaps) {
    // Return realistic mock quote based on current prices
    const mockPrice = await fetchPriceFromPyth(params.outputMint);
    return {
      inputMint: params.inputMint,
      outputMint: params.outputMint,
      inAmount: params.amount,
      outAmount: Math.floor((params.amount / mockPrice) * 0.995), // 0.5% slippage
      priceImpactPct: 0.12,
      routePlan: [{ label: "Jupiter (devnet simulation)" }],
    };
  }

  // Real Jupiter API call for mainnet
  return await jupiterApi.quote(params);
}

export async function executeSwap(params: SwapParams) {
  if (config.mockSwaps) {
    // Simulate swap with realistic delay
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return {
      success: true,
      txHash: `mock_${Date.now()}_${Math.random().toString(36).slice(2)}`,
      inputAmount: params.inAmount,
      outputAmount: params.expectedOutput,
      message: "✅ Swap simulated (devnet mode)",
    };
  }

  // Real swap on mainnet
  return await jupiterApi.swap(params);
}
```

### UI Indicator

```tsx
// Show network mode in UI
{
  config.network === "devnet" && (
    <div className="bg-yellow-500/10 text-yellow-500 px-2 py-1 rounded text-xs">
      🧪 Devnet Mode (swaps simulated)
    </div>
  );
}
```

### Testing Strategy

| Phase         | Network | Purpose                        |
| ------------- | ------- | ------------------------------ |
| Development   | Devnet  | Build & test UI, voice, wallet |
| Integration   | Devnet  | Test full flow with mocks      |
| Final Testing | Mainnet | Test real swaps ($1 amounts)   |
| Demo Video    | Mainnet | Record with real $1-5 swaps    |
| Submission    | Both    | Demo supports both modes       |

### Environment Variables

```env
# .env.development (devnet)
VITE_NETWORK=devnet

# .env.production (mainnet for demo)
VITE_NETWORK=mainnet
```

---

## 🎬 Demo Flow (For Video)

### Scene 1: Introduction (15s)

"Meet NL-Fi - Say It. Swap It. No complex UIs. Just tell it what you want."

### Scene 2: Voice Swap (30s) 🎤

```
User: *clicks 🎤 mic button*
User: "Swap fifty USDC to SOL"
NL-Fi: "I'll swap 50 USDC for approximately 0.48 SOL via Jupiter.
        Route: USDC → SOL
        Slippage: 0.5%

        [Confirm] [Cancel]"
User: *clicks Confirm*
NL-Fi: "✅ Swap complete! You received 0.481 SOL
        Transaction: 5xK7j..."
```

### Scene 3: Balance Check (15s)

```
User: "What's my portfolio worth?"
NL-Fi: "Your portfolio: $1,247.32
        • 12.5 SOL ($1,197.50)
        • 50 USDC ($50.00)
        • 1,000 JUP ($0.82)"
```

### Scene 4: Error Handling (15s)

```
User: "Swap 1000 SOL to USDC"
NL-Fi: "⚠️ Insufficient balance. You have 12.5 SOL.
        Would you like to swap all 12.5 SOL instead?"
```

### Scene 5: Closing (15s)

"NL-Fi - Making DeFi accessible to everyone. Built for the Colosseum Agent Hackathon."

**Total: ~90 seconds**

---

## 📊 Success Metrics

### For Hackathon Judges

- [ ] Working demo on Solana devnet
- [ ] Successful swap execution
- [ ] Clean, intuitive UI
- [ ] Proper error handling
- [ ] Clear Solana integration

### "Most Agentic" Prize Criteria

- [ ] AI makes decisions (routing, slippage)
- [ ] Autonomous execution capability
- [ ] Natural language understanding
- [ ] Minimal human intervention needed

---

## ⚠️ Risks & Mitigations

| Risk                    | Impact | Mitigation                                                |
| ----------------------- | ------ | --------------------------------------------------------- |
| GPT misparses intent    | High   | Confirmation required, low confidence → ask clarification |
| Jupiter API issues      | High   | Fallback to manual mode, good error messages              |
| Wallet connection fails | Medium | Clear instructions, multiple wallet support               |
| Demo doesn't work live  | High   | Pre-record backup video, test extensively                 |
| Scope creep             | High   | Strict MVP focus, cut features early                      |

---

## 📅 9-Day Sprint Plan

| Day | Date   | Focus                | Deliverable                        |
| --- | ------ | -------------------- | ---------------------------------- |
| 1   | Feb 3  | Setup & Registration | Project scaffold, agent registered |
| 2   | Feb 4  | AI Integration       | GPT parsing working                |
| 3   | Feb 5  | Jupiter Integration  | Quotes working                     |
| 4   | Feb 6  | Transaction Building | TX preview working                 |
| 5   | Feb 7  | Execution            | Swaps executing on devnet          |
| 6   | Feb 8  | UI Polish            | Chat interface complete            |
| 7   | Feb 9  | Balance & Info       | Portfolio view working             |
| 8   | Feb 10 | Testing              | Bug fixes, edge cases              |
| 9   | Feb 11 | Demo & Submit        | Video, documentation, submit       |
| -   | Feb 12 | **DEADLINE**         | 12:00 PM EST                       |

---

## 🔗 Resources & APIs

### Jupiter

- Docs: https://station.jup.ag/docs
- Quote API: `https://quote-api.jup.ag/v6/quote`
- Swap API: `https://quote-api.jup.ag/v6/swap`

### Pyth (Prices)

- Docs: https://docs.pyth.network/
- Solana: `@pythnetwork/pyth-solana-receiver`

### AgentWallet

- Skill: https://agentwallet.mcpay.tech/skill.md

### Solana

- Web3.js: https://solana-labs.github.io/solana-web3.js/
- Wallet Adapter: https://github.com/solana-labs/wallet-adapter

### Cloudflare

- Pages Docs: https://developers.cloudflare.com/pages/
- Workers Docs: https://developers.cloudflare.com/workers/
- Wrangler CLI: https://developers.cloudflare.com/workers/wrangler/

---

## ☁️ Cloudflare Deployment

### Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    CLOUDFLARE DEPLOYMENT                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                   CLOUDFLARE PAGES                           │   │
│  │                                                              │   │
│  │  nl-fi.pages.dev (or custom domain)                         │   │
│  │  ├── Vite build output (static)                             │   │
│  │  ├── React SPA                                              │   │
│  │  └── TailwindCSS                                            │   │
│  │                                                              │   │
│  └──────────────────────────┬──────────────────────────────────┘   │
│                             │                                       │
│                             │ API calls                             │
│                             ▼                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  CLOUDFLARE WORKERS                          │   │
│  │                                                              │   │
│  │  api.nl-fi.workers.dev                                      │   │
│  │  ├── POST /parse    → Azure OpenAI (intent parsing)         │   │
│  │  ├── GET  /quote    → Jupiter API (swap quotes)             │   │
│  │  └── GET  /health   → Health check                          │   │
│  │                                                              │   │
│  │  Secrets (via wrangler):                                    │   │
│  │  ├── AZURE_OPENAI_ENDPOINT                                  │   │
│  │  ├── AZURE_OPENAI_API_KEY                                   │   │
│  │  └── AZURE_OPENAI_DEPLOYMENT                                │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Deployment Commands

```bash
# Install Wrangler CLI
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy Workers (API)
cd workers
wrangler deploy

# Set Worker secrets
wrangler secret put AZURE_OPENAI_ENDPOINT
wrangler secret put AZURE_OPENAI_API_KEY
wrangler secret put AZURE_OPENAI_DEPLOYMENT

# Deploy Pages (Frontend)
# Option 1: Connect GitHub repo to Cloudflare Pages dashboard
# Option 2: Direct upload
npm run build
wrangler pages deploy dist
```

### Environment Variables

#### Local Development (`.dev.vars`)

```env
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com/
AZURE_OPENAI_API_KEY=your-api-key
AZURE_OPENAI_DEPLOYMENT=gpt-4
```

#### Production (Cloudflare Dashboard)

Set these as secrets in Workers settings.

### Worker Example (`workers/src/index.ts`)

```typescript
export interface Env {
  AZURE_OPENAI_ENDPOINT: string;
  AZURE_OPENAI_API_KEY: string;
  AZURE_OPENAI_DEPLOYMENT: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS headers
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Content-Type": "application/json",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers });
    }

    if (url.pathname === "/parse" && request.method === "POST") {
      // Parse intent with Azure OpenAI
      const { message } = await request.json();
      const result = await parseIntent(message, env);
      return new Response(JSON.stringify(result), { headers });
    }

    if (url.pathname === "/health") {
      return new Response(JSON.stringify({ status: "ok" }), { headers });
    }

    return new Response("Not Found", { status: 404 });
  },
};
```

### URLs After Deployment

| Service           | URL                                            |
| ----------------- | ---------------------------------------------- |
| **Frontend**      | `https://nl-fi.pages.dev`                      |
| **API**           | `https://nl-fi-api.your-subdomain.workers.dev` |
| **Custom Domain** | `https://nlfi.xyz` (optional)                  |

---

## ✅ Ready to Build Checklist

Before starting development:

- [ ] Agent name decided: `nl-fi`
- [ ] Azure OpenAI API access confirmed
- [ ] Cloudflare account ready
- [ ] GitHub repo created
- [ ] Register agent on Colosseum
- [ ] Development environment ready

---

_This specification will be updated as development progresses._
