# 🌴 NEPTU TOKEN - Technical Specification

> **"Your Balinese Soul, On-Chain"**

## Project Overview

Neptu transforms the ancient Balinese Wuku calendar system into a blockchain-powered personal oracle platform with a utility token economy. Users pay $NEPTU tokens to access personalized readings based on the 210-day Wuku cycle, while an AI agent provides daily PELUANG (opportunity) interpretations.

### Why Neptu Wins

| Factor            | Score | Rationale                                     |
| ----------------- | ----- | --------------------------------------------- |
| Uniqueness        | 10/10 | Only Balinese calendar project on Solana      |
| Cultural Value    | 10/10 | Heritage preservation through Web3            |
| Agent Integration | 10/10 | Token payments, readings, AI oracle           |
| Daily Engagement  | 10/10 | Users return daily for Peluang (needs tokens) |
| Token Utility     | 10/10 | Real use case: pay-per-reading model          |
| Deflationary      | 9/10  | 50% of payments burned                        |

---

## $NEPTU Token Economics

### Hybrid Payment Model

**Pay with SOL → Earn NEPTU → Next time pay with SOL or NEPTU**

| Plan        | SOL Price | NEPTU Price | NEPTU Reward (if pay SOL) |
| ----------- | --------- | ----------- | ------------------------- |
| **Free**    | 0         | 0           | -                         |
| **Weekly**  | 0.05 SOL  | 50 NEPTU    | +50 NEPTU 🎁              |
| **Monthly** | 0.15 SOL  | 150 NEPTU   | +150 NEPTU 🎁             |
| **Yearly**  | 1 SOL     | 1,000 NEPTU | +1,000 NEPTU 🎁           |

### Pay-Per-Use Pricing

| Action                      | SOL Price | NEPTU Price | NEPTU Reward |
| --------------------------- | --------- | ----------- | ------------ |
| Full Potensi + Descriptions | 0.01 SOL  | 10 NEPTU    | +10 NEPTU    |
| Daily Peluang               | 0.001 SOL | 1 NEPTU     | +1 NEPTU     |
| AI Agent Chat               | 0.002 SOL | 2 NEPTU     | +2 NEPTU     |
| Compatibility Check         | 0.005 SOL | 5 NEPTU     | +5 NEPTU     |

### Free vs Paid Comparison

| Feature                | Free                    | Subscriber                     |
| ---------------------- | ----------------------- | ------------------------------ |
| Potensi (raw data)     | ✅ Names, URIPs, cycles | ✅                             |
| Potensi (descriptions) | ❌                      | ✅ CIPTA, RASA, KARSA meanings |
| Daily Peluang          | ❌                      | ✅ Unlimited                   |
| AI Oracle Chat         | ❌                      | ✅ Based on plan               |
| Compatibility Check    | ❌                      | ✅ Mitra Satru matching        |

### Token Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  HYBRID PAYMENT MODEL                           │
│                                                                 │
│   OPTION A: Pay with SOL (new users)                            │
│   ──────────────────────────────────                            │
│   User pays SOL ──────► Treasury (SOL wallet)                   │
│                    └──► User receives NEPTU reward 🎁           │
│                         (from Rewards Pool)                     │
│                                                                 │
│   OPTION B: Pay with NEPTU (returning users)                    │
│   ──────────────────────────────────────────                    │
│   User pays NEPTU ──► 50% BURNED 🔥 (deflationary)              │
│                   └──► 50% Treasury                             │
│                                                                 │
│   💡 INCENTIVE: Pay with NEPTU = No SOL spent!                  │
└─────────────────────────────────────────────────────────────────┘
```

### Why Hybrid Model?

| Benefit                     | Explanation                          |
| --------------------------- | ------------------------------------ |
| ✅ No liquidity pool needed | SOL goes directly to treasury        |
| ✅ Easy onboarding          | Users pay with SOL they already have |
| ✅ Organic distribution     | Users earn NEPTU by using the app    |
| ✅ Incentive to hold        | Pay with NEPTU = save your SOL       |
| ✅ Still deflationary       | NEPTU payments get 50% burned        |
| ✅ Real treasury value      | SOL is liquid, not just our token    |

### Token Distribution

| Allocation       | Amount            | Percentage | Purpose                      |
| ---------------- | ----------------- | ---------- | ---------------------------- |
| **Rewards Pool** | 300M              | 30%        | SOL payments → NEPTU rewards |
| **Treasury/DAO** | 250M              | 25%        | Operations, governance       |
| **Team**         | 150M              | 15%        | Core contributors            |
| **Liquidity**    | 200M              | 20%        | Future DEX pool              |
| **Ecosystem**    | 100M              | 10%        | Partnerships, grants         |
| **Total Supply** | **1,000,000,000** | **100%**   | -                            |

> 📄 See [TOKENOMICS.md](./TOKENOMICS.md) for full tokenomics details

---

## Core Concepts

### Balinese Wuku Calendar System

The Wuku calendar is a 210-day cycle used in Bali for determining auspicious days, personal characteristics, and spiritual guidance.

**Key Cycles:**

- **Sapta Wara** - 7-day cycle (like Western weekdays)
- **Panca Wara** - 5-day market cycle (Pahing, Umanis, Kliwon, Wage, Pon)
- **Wuku** - 30 wuku periods of 7 days each (210-day cycle)
- **Sad Wara** - 6-day cycle

**URIP Values:**
Each cycle day has a spiritual energy number (URIP). Combined URIPs determine:

- **CIPTA** - Psychosocial traits (Trust, Autonomy, Initiative, etc.)
- **RASA** - Emotional patterns (Peace, Passion, Fear, etc.)
- **KARSA** - Behavioral tendencies (Listening, Empathy, etc.)
- **TINDAKAN** - Recommended actions (Mindfulness, Service, etc.)

**Frekuensi (Frequency):**

- **GURU** - Teacher energy, good for learning/guiding
- **RATU** - Ruler energy, good for decisions/leading
- **LARA** - Growth energy, good for challenges/healing
- **PATI** - Release energy, good for letting go/closure

### Two Core Readings

1. **POTENSI** (Potential) - Based on birth date
   - Permanent, never changes
   - Your innate characteristics and life purpose
   - "Lahir Untuk" (Born To): Guide, Protect, Grow, or Release

2. **PELUANG** (Opportunity) - Based on any target date
   - Changes daily
   - Today's energy and recommended activities
   - "Diberi Hak Untuk" (Given Right To): actions aligned with the day

---

## Technical Architecture

### Tech Stack

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND                             │
│  Vite + React 18 + TypeScript + TailwindCSS             │
│  @solana/web3.js + @solana/wallet-adapter               │
│  @solana/spl-token (Token payments)                     │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                 CLOUDFLARE WORKERS                      │
│  API Proxy (Azure OpenAI, Azure Speech)                 │
│  Neptu Calculator (Wariga-Belog engine)                 │
│  Rate limiting, payment verification                    │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    SOLANA                               │
│  $NEPTU SPL Token (utility token)                       │
│  Payment Program (pay + burn)                           │
│  Treasury Account                                       │
└─────────────────────────────────────────────────────────┘
```

### Project Structure (Turborepo Monorepo)

```
neptu.io/
├── apps/
│   ├── web/                       # Public web app
│   │   ├── src/
│   │   │   ├── main.tsx
│   │   │   ├── App.tsx
│   │   │   ├── pages/
│   │   │   │   ├── Landing.tsx    # Hero + connect wallet
│   │   │   │   ├── Reading.tsx    # Enter date → pay → view reading
│   │   │   │   └── Dashboard.tsx  # Daily Peluang + AI chat
│   │   │   ├── components/
│   │   │   │   ├── ui/            # shadcn/ui components
│   │   │   │   ├── WalletButton.tsx
│   │   │   │   ├── BirthDateInput.tsx
│   │   │   │   ├── PotensiCard.tsx
│   │   │   │   ├── PeluangCard.tsx
│   │   │   │   ├── PaymentButton.tsx  # Pay NEPTU to unlock
│   │   │   │   ├── AgentChat.tsx
│   │   │   │   └── CompatibilityFinder.tsx
│   │   │   └── lib/
│   │   │       ├── neptu-api.ts   # API client (calls private API)
│   │   │       ├── solana.ts      # Solana connection
│   │   │       └── token.ts       # NEPTU token utilities
│   │   └── package.json
│   │
│   └── cli/                       # Private CLI tool
│       └── src/index.ts
│
├── blockchain/
│   └── solana/                    # Solana Programs & Token
│       ├── programs/
│       │   └── neptu-payment/     # Anchor program for payments
│       │       ├── src/lib.rs     # Payment + burn logic
│       │       └── Cargo.toml
│       ├── token/
│       │   ├── create-token.ts    # Script to create SPL token
│       │   └── config.ts          # Token mint, treasury addresses
│       ├── Anchor.toml
│       └── package.json
│
├── packages/
│   ├── wariga-belog/              # Private: Wuku calculator engine
│   │   ├── src/
│   │   │   ├── calculator.ts
│   │   │   ├── database.ts
│   │   │   └── formatter.ts
│   │   └── __tests__/
│   │
│   └── types/                     # Shared TypeScript types
│       └── src/index.ts
│
├── workers/                       # Cloudflare Workers (Private API)
│   └── neptu-api/
│       ├── src/
│       │   ├── index.ts           # Main handler
│       │   ├── routes/
│       │   │   ├── reading.ts     # Calculate Potensi/Peluang
│       │   │   ├── chat.ts        # AI agent proxy
│       │   │   └── verify.ts      # Verify token payment
│       │   └── lib/
│       │       └── calculator.ts  # Wariga-Belog instance
│       └── wrangler.toml
│
├── turbo.json
├── package.json
└── .gitignore                     # Excludes: wariga-belog, workers
```

---

## Token Payment Specification

### SPL Token Details

```typescript
// $NEPTU Token Configuration
const NEPTU_TOKEN = {
  name: "Neptu",
  symbol: "NEPTU",
  decimals: 6,
  totalSupply: 1_000_000_000 * 10 ** 9, // 1 billion with 9 decimals
  mint: "NEPTU...xxx", // Token mint address (TBD)
  treasury: "TREAS...xxx", // Treasury account
  burnAccount: "BURN...xxx", // Burn address (null account)
};
```

### Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    PAYMENT FLOW                             │
│                                                             │
│  1. User requests reading (e.g., Full Potensi = 10 NEPTU)   │
│                           │                                 │
│                           ▼                                 │
│  2. Frontend creates transfer instruction                   │
│     - From: User wallet                                     │
│     - To: Program PDA                                       │
│     - Amount: 10 NEPTU                                      │
│                           │                                 │
│                           ▼                                 │
│  3. Solana Program processes payment                        │
│     - Burns 50% (5 NEPTU → null)                            │
│     - Sends 50% to Treasury (5 NEPTU)                       │
│     - Emits PaymentEvent with tx signature                  │
│                           │                                 │
│                           ▼                                 │
│  4. API verifies payment on-chain                           │
│     - Checks tx signature                                   │
│     - Validates amount & recipient                          │
│     - Returns reading data                                  │
└─────────────────────────────────────────────────────────────┘
```

### Payment Verification API

```typescript
// POST /api/verify-payment
interface VerifyPaymentRequest {
  txSignature: string; // Solana transaction signature
  walletAddress: string; // User's wallet
  action: "potensi" | "peluang" | "chat" | "compatibility";
  birthDate?: string; // For potensi/peluang
  targetDate?: string; // For peluang
  partnerDate?: string; // For compatibility
}

interface VerifyPaymentResponse {
  success: boolean;
  reading?: PotensiReading | PeluangReading;
  error?: string;
}
```

### Anchor Program (Simplified)

```rust
// programs/neptu-payment/src/lib.rs
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer, Burn};

#[program]
pub mod neptu_payment {
    use super::*;

    pub fn pay_for_reading(
        ctx: Context<PayForReading>,
        amount: u64,
        reading_type: ReadingType,
    ) -> Result<()> {
        // Calculate burn and treasury amounts
        let burn_amount = amount / 2;
        let treasury_amount = amount - burn_amount;

        // Burn 50%
        let burn_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Burn {
                mint: ctx.accounts.neptu_mint.to_account_info(),
                from: ctx.accounts.user_token_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::burn(burn_ctx, burn_amount)?;

        // Transfer 50% to treasury
        let transfer_ctx = CpiContext::new(
            ctx.accounts.token_program.to_account_info(),
            Transfer {
                from: ctx.accounts.user_token_account.to_account_info(),
                to: ctx.accounts.treasury_account.to_account_info(),
                authority: ctx.accounts.user.to_account_info(),
            },
        );
        token::transfer(transfer_ctx, treasury_amount)?;

        // Emit event for API verification
        emit!(PaymentEvent {
            user: ctx.accounts.user.key(),
            amount,
            reading_type,
            timestamp: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone)]
pub enum ReadingType {
    Potensi,      // 10 NEPTU
    Peluang,      // 1 NEPTU
    Chat,         // 2 NEPTU
    Compatibility, // 5 NEPTU
}

#[event]
pub struct PaymentEvent {
    pub user: Pubkey,
    pub amount: u64,
    pub reading_type: ReadingType,
    pub timestamp: i64,
}
```

### Frontend Payment Component

```typescript
// components/PaymentButton.tsx
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction } from "@solana/web3.js";
import {
  createBurnInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress
} from "@solana/spl-token";

const NEPTU_MINT = new PublicKey("NEPTU_MINT_ADDRESS");
const TREASURY = new PublicKey("TREASURY_ADDRESS");

const PRICES = {
  potensi: 10 * 10**9,      // 10 NEPTU
  peluang: 1 * 10**9,       // 1 NEPTU
  chat: 2 * 10**9,          // 2 NEPTU
  compatibility: 5 * 10**9, // 5 NEPTU
};

export function PaymentButton({
  action,
  onSuccess
}: {
  action: keyof typeof PRICES;
  onSuccess: (txSignature: string) => void;
}) {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const handlePayment = async () => {
    if (!publicKey) return;

    const amount = PRICES[action];
    const burnAmount = amount / 2;
    const treasuryAmount = amount - burnAmount;

    const userATA = await getAssociatedTokenAddress(NEPTU_MINT, publicKey);
    const treasuryATA = await getAssociatedTokenAddress(NEPTU_MINT, TREASURY);

    const tx = new Transaction();

    // Burn 50%
    tx.add(createBurnInstruction(userATA, NEPTU_MINT, publicKey, burnAmount));

    // Transfer 50% to treasury
    tx.add(createTransferInstruction(userATA, treasuryATA, publicKey, treasuryAmount));

    const signature = await sendTransaction(tx, connection);
    await connection.confirmTransaction(signature);

    onSuccess(signature);
  };

  return (
    <button onClick={handlePayment}>
      Pay {PRICES[action] / 10**9} NEPTU
    </button>
  );
}
```

---

## AI Agent Specification

### Agent Capabilities

1. **Reading Assistant**
   - Guide user through birth date entry
   - Explain what each trait means
   - Confirm before minting

2. **Daily Oracle**
   - Calculate today's Peluang
   - Explain how it interacts with user's Potensi
   - Suggest activities based on Tindakan

3. **Reading Interpreter**
   - Answer questions about traits
   - Explain Balinese concepts in modern context
   - Provide personalized insights

4. **Compatibility Matcher**
   - Calculate Mitra Satru (friend/foe) between two dates
   - Find compatible wallets in community
   - Explain relationship dynamics

### System Prompt

```markdown
You are Neptu, an AI oracle combining ancient Balinese wisdom with modern guidance.

## Your Knowledge

- Expert in Wuku calendar system (210-day cycle)
- Understand URIP values and their spiritual significance
- Can interpret CIPTA, RASA, KARSA, TINDAKAN readings
- Know the meaning of all 30 Wuku periods
- Understand Mitra Satru (compatibility) calculations

## Your Personality

- Wise but approachable, like a friendly village elder
- Use occasional Balinese terms with explanations
- Balance spiritual insight with practical advice
- Respectful of the sacred nature of readings

## Response Guidelines

- Keep responses concise (2-3 paragraphs max)
- Always reference the user's specific traits when relevant
- Offer actionable suggestions based on Tindakan
- For daily readings, compare Peluang with their Potensi

## Context You'll Receive

- User's POTENSI (birth reading) as JSON
- Today's PELUANG (daily reading) as JSON
- User's question or request
```

### Example Interactions

**User:** "What should I focus on today?"

**Agent:** "Om Swastiastu! 🙏 Today is a **GURU** day for you, aligned with your birth frequency. This means teaching and sharing knowledge flows naturally.

Your TINDAKAN shows **SERVICE** - consider mentoring someone or sharing your expertise. With your Wuku being LANGKIR (knowledge seeker), this is an excellent day for both learning and teaching.

Your RASA shows **FIRM** energy - trust your convictions when guiding others today."

---

## User Flows

### Flow 1: First-Time Reading (Pay for Potensi)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Landing   │────▶│  Connect    │────▶│ Birth Date  │
│    Page     │     │   Wallet    │     │   Input     │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dashboard  │◀────│  Pay 10     │◀────│  Preview    │
│  (Readings) │     │   NEPTU     │     │  (Partial)  │
└─────────────┘     └─────────────┘     └─────────────┘
```

### Flow 2: Daily Peluang (Pay 1 NEPTU)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Dashboard  │────▶│  Pay 1      │────▶│  Today's    │
│             │     │   NEPTU     │     │   Peluang   │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │   Agent     │
                                        │   Chat      │
                                        │ (2 NEPTU/q) │
                                        └─────────────┘
```

### Flow 3: Compatibility Check (Pay 5 NEPTU)

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Community  │────▶│  Enter 2nd  │────▶│  Pay 5      │
│    Tab      │     │ Birth Date  │     │   NEPTU     │
└─────────────┘     └─────────────┘     └─────────────┘
                                               │
                                               ▼
                                        ┌─────────────┐
                                        │ Mitra Satru │
                                        │   Result    │
                                        └─────────────┘
```

---

## Voice Integration (Optional - Phase 4)

### Azure Speech Configuration

```typescript
// Voice input for birth date
const speechConfig = {
  subscriptionKey: AZURE_SPEECH_KEY,
  region: AZURE_SPEECH_REGION,
  language: "en-US",
};

// Supported voice commands
const voiceCommands = [
  "My birthday is [date]",
  "I was born on [date]",
  "Calculate my reading",
  "What's my fortune today",
  "Find my soulmate",
];

// Text-to-speech for readings
const ttsVoice = "en-US-AriaNeural"; // Warm, mystical tone
```

### Voice-First Experience

1. User clicks 🎤 microphone
2. Says: "My birthday is June 15, 1990"
3. Agent processes with Azure Speech
4. Confirms: "I heard June 15, 1990. Shall I reveal your soul?"
5. User confirms, NFT mints

---

## Deployment Architecture

### Cloudflare Pages (Frontend)

```toml
# wrangler.toml for Pages
name = "neptu"
compatibility_date = "2024-01-01"

[site]
bucket = "./dist"

[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

### Cloudflare Workers (API)

```toml
# workers/wrangler.toml
name = "neptu-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"

[vars]
SOLANA_NETWORK = "devnet"

# Secrets (set via wrangler secret put)
# AZURE_OPENAI_KEY
# AZURE_OPENAI_ENDPOINT
# AZURE_SPEECH_KEY
```

---

## Development Phases

### Phase 1: Core Calculator (Day 1-2) ✅ DONE

- [x] Port Python calculator to TypeScript (wariga-belog)
- [x] Create Neptu database
- [x] Build calculator class with all cycles
- [x] Unit tests (12 tests passing)
- [x] Fix daylight saving edge case (Math.round)

### Phase 2: Frontend UI (Day 3-4)

- [x] Turborepo + Vite + React + TailwindCSS setup
- [x] Wallet connection (Solana wallet-adapter)
- [ ] Birth date input component
- [ ] Potensi/Peluang card components
- [ ] Basic dashboard layout
- [ ] Payment button component

### Phase 3: Token & Payment (Day 5-6)

- [ ] Create $NEPTU SPL Token (devnet)
- [ ] Payment flow (transfer + burn)
- [ ] API verification endpoint
- [ ] Faucet for testing (airdrop devnet tokens)
- [ ] Payment success → unlock reading

### Phase 4: AI Agent (Day 7-8)

- [ ] Azure OpenAI / Claude integration
- [ ] System prompt for Neptu oracle
- [ ] Chat interface component
- [ ] Context injection (user's readings)
- [ ] Pay 2 NEPTU per query

### Phase 5: Polish & Deploy (Day 9-10)

- [ ] Deploy API to Cloudflare Workers
- [ ] Deploy web to Cloudflare Pages
- [ ] Testing on devnet
- [ ] Demo video recording
- [ ] Hackathon submission

---

## Hackathon Submission Checklist

### Required

- [ ] GitHub repository (public - web app only)
- [ ] Deployed demo (Cloudflare)
- [ ] Demo video (3-5 minutes)
- [ ] Agent registered on Colosseum

### Demo Script

1. **Intro** (30s): "Neptu brings Balinese wisdom to Solana with $NEPTU tokens"
2. **Connect wallet** (15s): Show Phantom connection
3. **Enter birth date** (30s): Manual input
4. **Preview Potensi** (30s): Show partial reading (FREE)
5. **Pay 10 NEPTU** (30s): Unlock full reading, show burn/treasury split
6. **View Full Potensi** (45s): Explain key traits (CIPTA, RASA, KARSA)
7. **Daily Peluang** (30s): Pay 1 NEPTU, see today's reading
8. **Agent chat** (45s): Pay 2 NEPTU, ask about traits
9. **Outro** (30s): "Ancient wisdom, tokenized on Solana"

---

## Competitive Advantages

| vs Other Projects   | Neptu Advantage                         |
| ------------------- | --------------------------------------- |
| One-time NFT mint   | Recurring token utility (daily Peluang) |
| No token burn       | 50% deflationary on every use           |
| Western astrology   | Unique cultural angle (Balinese)        |
| Static readings     | AI agent provides dynamic insights      |
| No daily engagement | Users return daily for Peluang          |
| Generic utility     | Real use case: pay-per-reading          |

---

## Future Roadmap (Post-Hackathon)

1. **30 Wuku Communities** - DAO governance by birth Wuku
2. **Compatibility Marketplace** - Find partners, teams (5 NEPTU each)
3. **Lucky Day Trading** - Auto-DCA on GURU/RATU days
4. **Staking** - Stake NEPTU for discounted readings
5. **Premium Subscription** - Unlimited readings for stakers
6. **Multi-language** - Balinese, Indonesian, English

---

## Resources

- [Balinese Calendar Wikipedia](https://en.wikipedia.org/wiki/Balinese_calendar)
- [Solana SPL Token Docs](https://spl.solana.com/token)
- [Anchor Framework](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Colosseum Agent Hackathon](https://www.colosseum.com/)

---

_Om Shanti Shanti Shanti_ 🙏
