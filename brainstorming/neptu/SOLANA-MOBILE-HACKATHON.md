# Neptu Voice Oracle — Solana Mobile Hackathon (MONOLITH)

> **"Talk to the Cosmos. It Talks Back."**

## Hackathon Info

| Field              | Details                                         |
| ------------------ | ----------------------------------------------- |
| **Hackathon**      | MONOLITH — Solana Mobile Hackathon              |
| **Organizers**     | Solana Mobile & RadiantsDAO                     |
| **Duration**       | Feb 2 – Mar 9, 2026 (5 weeks)                   |
| **Days Remaining** | ~18 days (from Feb 19)                          |
| **Prizes**         | $125K+ ($10K × 10 winners + $5K × 5 honorable)  |
| **Bonus Prize**    | $10K in SKR for best SKR integration            |
| **Register**       | https://align.nexus                             |
| **Rules**          | https://solanamobile.radiant.nexus/?panel=rules |

### Submission Requirements

- [x] Functional Android APK
- [x] GitHub repository with source code
- [ ] Demo video showcasing functionality
- [ ] Pitch deck or brief presentation
- [x] Must integrate Solana Mobile Stack + Mobile Wallet Adapter
- [x] Mobile-first design (no PWA wrappers or direct ports)
- [x] Meaningful Solana network interaction

### Evaluation Criteria (25% each)

| Criteria             | What Judges Look For                               |
| -------------------- | -------------------------------------------------- |
| **Stickiness & PMF** | Habits, daily engagement, Seeker community fit     |
| **User Experience**  | Intuitive, polished, enjoyable                     |
| **Innovation**       | Novel, creative, stands out from existing products |
| **Presentation**     | Clear communication, effective demo                |

---

## Product Concept

### One-Liner

**Neptu is a voice-first AI oracle that speaks ancient Balinese wisdom — you talk, it listens, it responds with audio, all powered by Solana.**

### Elevator Pitch

Neptu transforms the 1000-year-old Balinese Wuku calendar into a voice-first mobile oracle on Solana. No typing, no dashboards — just tap the living, breathing Neptu orb and speak. Ask about your birth potential, today's cosmic energy, or life guidance. Neptu listens, calculates your readings using the sacred 210-day cycle, and responds with a mystical voice. Pay with SOL or $NEPTU tokens. Every interaction is a conversation with the cosmos.

### Why Voice-First Wins This Hackathon

| Criteria         | How Neptu Scores                                                            |
| ---------------- | --------------------------------------------------------------------------- |
| **Stickiness**   | Daily voice ritual — "Hey Neptu, what's my energy today?" becomes a habit   |
| **UX**           | Zero-UI — just a breathing orb + your voice. Most natural mobile experience |
| **Innovation**   | Only voice AI oracle on Solana. Balinese culture × voice × blockchain       |
| **Presentation** | Demo is stunning — animated orb responding to voice in real-time            |

---

## App Flow

### Screen 1: Wallet Connect

```
┌──────────────────────────────┐
│                              │
│         ◉ NEPTU LOGO         │
│     (subtle ambient pulse)   │
│                              │
│   "Connect your wallet to    │
│    awaken the oracle"        │
│                              │
│   ┌──────────────────────┐   │
│   │  Connect with Wallet │   │  ← Mobile Wallet Adapter (Seeker)
│   └──────────────────────┘   │
│                              │
└──────────────────────────────┘
```

- Uses **Solana Mobile Wallet Adapter** (not Privy)
- One-tap connect via Seeker's built-in wallet
- After connect → check if user has profile → if not, go to onboarding

### Screen 2: Onboarding (One-Time)

```
┌──────────────────────────────┐
│                              │
│         ◉ NEPTU LOGO         │
│      (gentle pulse)          │
│                              │
│   "When were you born?"      │
│                              │
│   ┌──────────────────────┐   │
│   │   📅 June 15, 1990   │   │  ← Date picker (native Android)
│   └──────────────────────┘   │
│                              │
│   "Choose your language"     │
│                              │
│   ┌──────────────────────┐   │
│   │  🇺🇸 🇮🇩 🇫🇷 🇩🇪 🇪🇸       │   │  ← Language grid
│   │  🇧🇷 🇷🇺 🇯🇵 🇰🇷 🇨🇳       │   │     (10 languages)
│   └──────────────────────┘   │
│                              │
│   ┌──────────────────────┐   │
│   │      Awaken Neptu    │   │
│   └──────────────────────┘   │
│                              │
└──────────────────────────────┘
```

- Birthday is required (used for Potensi calculation — never changes)
- Language selection determines Neptu's voice + text language
- Stored in user profile on-device + API
- One-time only — then straight to the oracle

### Screen 3: Voice Oracle (Main Experience)

```
┌──────────────────────────────┐
│  ☰                    ⚙️ 💰  │  ← Menu, Settings, Wallet
│                              │
│                              │
│                              │
│        ╭──────────╮          │
│       ╱            ╲         │
│      │   ◉ NEPTU    │        │  ← Audio visualizer orb
│      │    LOGO      │        │     reacts to voice amplitude
│       ╲            ╱         │
│        ╰──────────╯          │
│     ~~~~ waves ~~~~          │  ← Waveform / frequency bars
│                              │
│                              │
│   "Tap to speak with Neptu"  │
│                              │
│        ┌────────┐            │
│        │  🎤    │            │  ← Hold to talk / tap to toggle
│        └────────┘            │
│                              │
└──────────────────────────────┘
```

#### Orb States

| State         | Visual                                       | Audio             |
| ------------- | -------------------------------------------- | ----------------- |
| **Idle**      | Slow ambient pulse, soft glow                | Silent            |
| **Listening** | Orb expands/contracts with mic amplitude     | Mic active        |
| **Thinking**  | Orb ripples, rotates slowly, particles orbit | Brief chime/tone  |
| **Speaking**  | Orb pulses with Neptu's voice waveform       | TTS audio playing |
| **Error**     | Orb flashes red briefly                      | Error tone        |

#### Interaction Flow

```
User taps 🎤
  → Orb enters LISTENING state (reacts to mic input)
  → User speaks: "What's my energy today?"
  → User releases / silence detected
  → Orb enters THINKING state (processing)
    → Speech-to-Text (Azure Speech Services STT)
    → Wariga engine calculates Potensi + Peluang
    → AI generates response (Azure OpenAI — gpt-4o-mini)
    → Text-to-Speech (Azure Speech Services Neural TTS)
  → Orb enters SPEAKING state (reacts to TTS amplitude)
  → Neptu speaks: "The stars align, seeker. Today is a GURU day..."
  → Audio finishes → Orb returns to IDLE
```

### Side Panel: Wallet

```
┌──────────────────────────────┐
│  ← Back          Wallet      │
│                              │
│   SOL Balance: 2.45 SOL      │
│   NEPTU Balance: 150 NEPTU   │
│                              │
│   ─────────────────────────  │
│   Today's Conversations: 3   │
│   Free Remaining: 2          │
│                              │
│   ─────────────────────────  │
│   Subscription: Explorer     │
│   ┌──────────────────────┐   │
│   │ Upgrade to Seeker (0.005 SOL) │   │
│   └──────────────────────┘   │
│                              │
└──────────────────────────────┘
```

### Side Panel: Settings

```
┌──────────────────────────────┐
│  ← Back         Settings     │
│                              │
│   Birthday: June 15, 1990    │
│   Language: English 🇺🇸       │
│   Voice: Aria (Warm)         │
│                              │
│   ─────────────────────────  │
│   Wallet: 4kH7...x9Qf       │
│   Network: Devnet            │
│                              │
│   ─────────────────────────  │
│   ┌──────────────────────┐   │
│   │     Disconnect       │   │
│   └──────────────────────┘   │
│                              │
└──────────────────────────────┘
```

---

## Voice & Audio Architecture

### Azure Resources Required

All AI/audio services run through Azure. Here's what to provision:

| #   | Azure Resource            | Service            | Model / SKU                     | Purpose                                                                        |
| --- | ------------------------- | ------------------ | ------------------------------- | ------------------------------------------------------------------------------ |
| 1   | **Azure OpenAI**          | OpenAI Service     | `gpt-4o-mini` deployment        | AI oracle responses (already deployed: `super-su.cognitiveservices.azure.com`) |
| 2   | **Azure Speech Services** | Cognitive Services | **Speech-to-Text** (STT)        | Transcribe user's voice to text                                                |
| 3   | **Azure Speech Services** | Cognitive Services | **Text-to-Speech** (TTS Neural) | Neptu's voice audio output                                                     |

> Resources #2 and #3 use the **same** Azure Speech Services resource (single key + region). Resource #1 is already deployed.

### What You Need to Prepare

**Azure Speech Services** (single resource, covers both STT and TTS):

```
Resource type:  Cognitive Services → Speech
Pricing tier:   S0 (Standard) — free tier has limits
Region:         Same as your OpenAI resource (e.g., East US)
```

After creating, you'll get:

```
AZURE_SPEECH_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
AZURE_SPEECH_REGION=eastus
```

**Models used (no extra deployment needed — built into Speech Services):**

| Feature            | Model                                       | Notes                                        |
| ------------------ | ------------------------------------------- | -------------------------------------------- |
| **Speech-to-Text** | `whisper` (Azure hosted) or real-time STT   | Auto-detects language; supports all 10 langs |
| **Text-to-Speech** | Neural TTS voices (per-language, see below) | SSML control for pacing/emphasis             |

**No additional AI model deployments needed** — Azure Speech Services includes STT and Neural TTS out of the box with the S0 tier.

#### Azure TTS Voice Selection (10 Languages — Same as Web)

| Language   | Code | Voice                   | Style         |
| ---------- | ---- | ----------------------- | ------------- |
| English    | `en` | `en-US-AriaNeural`      | Warm, gentle  |
| Indonesian | `id` | `id-ID-GadisNeural`     | Natural, calm |
| French     | `fr` | `fr-FR-DeniseNeural`    | Elegant, soft |
| German     | `de` | `de-DE-KatjaNeural`     | Clear, warm   |
| Spanish    | `es` | `es-ES-ElviraNeural`    | Warm, melodic |
| Portuguese | `pt` | `pt-BR-FranciscaNeural` | Gentle, warm  |
| Russian    | `ru` | `ru-RU-SvetlanaNeural`  | Calm, rich    |
| Japanese   | `ja` | `ja-JP-NanamiNeural`    | Soft, wise    |
| Korean     | `ko` | `ko-KR-SunHiNeural`     | Gentle, clear |
| Chinese    | `zh` | `zh-CN-XiaoxiaoNeural`  | Warm, natural |

#### SSML Example (Neptu's Speaking Style)

```xml
<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
  <voice name="en-US-AriaNeural">
    <prosody rate="0.9" pitch="-2st">
      The stars align, seeker.
    </prosody>
    <break time="500ms"/>
    <prosody rate="1.0">
      Today is a <emphasis level="moderate">GURU</emphasis> day for you.
      <break time="300ms"/>
      This means teaching and sharing knowledge flows naturally.
    </prosody>
    <break time="400ms"/>
    <prosody rate="0.95" pitch="-1st">
      Your energy aligns with service today.
      Trust your wisdom.
    </prosody>
  </voice>
</speak>
```

### Audio Visualizer

The orb visualizer renders audio waveform data around/behind the Neptu logo.

**Implementation approach:**

- Use `expo-av` for audio recording (mic input) and playback (TTS output)
- Extract audio amplitude/frequency data using `AnalyserNode` or amplitude callbacks
- Render animated circles/waves around the logo using `react-native-reanimated` + `react-native-skia`
- Amplitude → orb scale, glow intensity, wave height
- Frequency → color shifts, particle speed

**Visual reference:**

- Siri's orb — smooth, organic pulsing
- Spotify's behind-lyrics visualizer — subtle bar animation
- A cosmic, mystical version — soft glows, slow particles, sacred geometry hints

```
IDLE:             LISTENING:          SPEAKING:
  ╭──╮              ╭────╮            ╭──────╮
 │ ◉  │           ╱│  ◉   │╲        ╱ │  ◉    │ ╲
  ╰──╯             ╰────╯           ╰──────╯
 (calm)          (expanding)      (pulsing with voice)
```

---

## Technical Architecture

### Mobile Stack

```
┌─────────────────────────────────────────────────────────┐
│                    ANDROID APP (APK)                     │
│  Expo + React Native + TypeScript                       │
│  @solana-mobile/mobile-wallet-adapter                   │
│  react-native-reanimated + @shopify/react-native-skia   │
│  expo-av (audio recording + playback)                   │
└─────────────────────────────────────────────────────────┘
                           │
                    HTTPS + WebSocket
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                  API LAYER (Existing)                    │
│  Hono on Bun (apps/api + apps/worker)                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐              │
│  │ Wariga   │  │  Azure   │  │  Solana  │              │
│  │ Engine   │  │  OpenAI  │  │  RPC     │              │
│  └──────────┘  └──────────┘  └──────────┘              │
│  ┌──────────────────────┐  ┌──────────┐                │
│  │  Azure Speech (STT   │  │ Drizzle  │                │
│  │  + Neural TTS)       │  │  ORM/DB  │                │
│  └──────────────────────┘  └──────────┘                │
└─────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    SOLANA (Devnet)                       │
│  neptu_token:   7JDw4pncZg...4TwqHW                     │
│  neptu_economy: 6Zxc4uCXKq...PnvT                       │
│  $NEPTU SPL Token (pay-per-reading, 50% burn)           │
└─────────────────────────────────────────────────────────┘
```

### New API Endpoints (Voice-Specific)

| Method | Endpoint                    | Purpose                                  |
| ------ | --------------------------- | ---------------------------------------- |
| POST   | `/api/voice/transcribe`     | Audio blob → text (Azure Speech STT)     |
| POST   | `/api/voice/oracle`         | Text question → AI response + SSML audio |
| POST   | `/api/voice/synthesize`     | Text → TTS audio (Azure Neural TTS)      |
| GET    | `/api/voice/greeting/:lang` | Pre-generated daily greeting audio       |

#### Voice Oracle Flow (Single Endpoint)

```
POST /api/voice/oracle
Content-Type: multipart/form-data

Body:
  audio: <recorded audio blob>       (user's voice)
  walletAddress: "4kH7...x9Qf"
  language: "en-US"

Response:
{
  "transcript": "What's my energy today?",
  "response": "The stars align, seeker. Today is a GURU day...",
  "audioUrl": "https://api.neptu.ai/audio/resp_abc123.mp3",
  "reading": { ... },               // Peluang data (optional)
  "tokensCharged": 2,               // NEPTU cost (AI_CHAT_ADDON per message)
  "freeRemaining": 2                // Free uses left
}
```

### Freemium Model (Aligned with Web — `packages/shared/constants/pricing.ts`)

Subscriptions unlock calendar features + AI feedback but **NOT** unlimited voice conversations. Voice AI chat is always pay-per-use (same as web where `aiChat: false` for all plans).

| Tier        | Name     | SOL   | NEPTU | SUDIGITAL | Duration | Features                                |
| ----------- | -------- | ----- | ----- | --------- | -------- | --------------------------------------- |
| **FREE**    | Explorer | 0     | 0     | 0         | —        | Basic calendar, 5 free voice convos/day |
| **WEEKLY**  | Seeker   | 0.005 | 5     | 5         | 7 days   | AI feedback, interests, 5 free/day      |
| **MONTHLY** | Mystic   | 0.015 | 15    | 15        | 30 days  | AI feedback, interests, 5 free/day      |
| **YEARLY**  | Oracle   | 0.1   | 100   | 100       | 365 days | AI feedback, interests, 5 free/day      |

**Voice AI Conversations (beyond free daily limit):**

| Option      | SOL   | NEPTU | SUDIGITAL | Cost to Us | Margin |
| ----------- | ----- | ----- | --------- | ---------- | ------ |
| PER_MESSAGE | 0.002 | 2     | 2         | ~$0.007    | ~48x   |
| PACK_10     | 0.01  | 10    | 10        | ~$0.07     | ~24x   |

> **Cost breakdown per voice conversation**: STT ~$0.004 + OpenAI ~$0.0002 + TTS ~$0.003 = **~$0.007**
> **Revenue per paid conversation**: 0.002 SOL × ~$170 = **~$0.34** — sustainable at any scale.

> Prices match `SUBSCRIPTION_PLANS` and `AI_CHAT_ADDON` from `@neptu/shared` — single source of truth. Mobile imports the same constants.

Free tier (5 voice convos/day) is critical for hackathon judges to test without needing tokens.

---

## Dependencies (New for Mobile)

### Required Packages

```json
{
  "@solana-mobile/mobile-wallet-adapter-protocol": "^2.1.0",
  "@solana-mobile/mobile-wallet-adapter-protocol-web3js": "^2.1.0",
  "@solana/web3.js": "^1.98.0",
  "react-native-reanimated": "^3.17.0",
  "@shopify/react-native-skia": "^1.8.0",
  "expo-av": "^15.0.0",
  "expo-haptics": "^14.0.0",
  "react-native-mmkv": "^3.2.0"
}
```

### Why These Choices

| Package                   | Purpose                                         |
| ------------------------- | ----------------------------------------------- |
| `mobile-wallet-adapter`   | Hackathon requirement — Solana Mobile Stack     |
| `react-native-reanimated` | 60fps orb animations on UI thread               |
| `react-native-skia`       | GPU-accelerated audio visualizer rendering      |
| `expo-av`                 | Audio recording (mic) + playback (TTS response) |
| `expo-haptics`            | Haptic feedback on orb interactions             |
| `react-native-mmkv`       | Fast local storage for profile/cache            |

---

## File Structure (Mobile App)

```
apps/mobile/
├── App.tsx                          # Root: MWA provider + navigation
├── app.config.ts                    # Expo config (Android APK settings)
├── package.json
├── index.ts
│
├── screens/
│   ├── ConnectScreen.tsx            # Wallet connect (MWA)
│   ├── OnboardingScreen.tsx         # Birthday + language picker
│   └── OracleScreen.tsx             # Main voice oracle experience
│
├── components/
│   ├── NeptuOrb.tsx                 # Audio visualizer orb (Skia)
│   ├── OrbWaveform.tsx              # Waveform ring animation
│   ├── MicButton.tsx                # Push-to-talk / tap-to-toggle
│   ├── WalletPanel.tsx              # Side panel: balance, subscription
│   ├── SettingsPanel.tsx            # Side panel: profile, language
│   └── LanguagePicker.tsx           # Language selector
│
├── hooks/
│   ├── useAudioRecorder.ts          # Mic recording with amplitude
│   ├── useAudioPlayer.ts           # TTS playback with amplitude
│   ├── useNeptuOracle.ts           # Voice oracle API integration
│   ├── useSolanaWallet.ts          # MWA wallet connection
│   └── useVisualizerData.ts        # Transform audio → animation data
│
├── services/
│   ├── voice-api.ts                 # Voice API client (transcribe, oracle, synthesize)
│   ├── solana-mobile.ts             # MWA transaction helpers
│   └── storage.ts                   # MMKV local storage
│
├── constants/
│   └── index.ts                     # API URLs, colors, animation configs
│
├── types/
│   └── index.ts                     # Mobile-specific types
│
└── assets/
    ├── neptu-logo.png               # Neptu logo (orb center)
    ├── sounds/
    │   ├── chime.mp3                # Thinking state sound
    │   └── error.mp3               # Error state sound
    └── fonts/                       # Custom fonts (if any)
```

---

## Implementation Plan

### Week 1: Foundation (Feb 19–23) — 5 days

| Day   | Task                                              | Status  |
| ----- | ------------------------------------------------- | ------- |
| Day 1 | Swap Privy → Mobile Wallet Adapter, basic connect | ✅ Done |
| Day 1 | Strip existing mobile app to clean slate          | ✅ Done |
| Day 2 | Onboarding screen (birthday + language picker)    | ✅ Done |
| Day 2 | Local storage (MMKV) for profile persistence      | ✅ Done |
| Day 3 | Orb visualizer prototype (Skia + Reanimated)      | ✅ Done |
| Day 3 | Orb states: idle, listening, thinking, speaking   | ✅ Done |
| Day 4 | Audio recording hook (expo-av, amplitude data)    | ✅ Done |
| Day 4 | Audio playback hook (TTS, amplitude extraction)   | ✅ Done |
| Day 5 | API: `/api/voice/transcribe` (Azure Speech STT)   | ✅ Done |
| Day 5 | API: `/api/voice/synthesize` (Azure Neural TTS)   | ✅ Done |

### Week 2: Integration (Feb 24–28) — 5 days

| Day    | Task                                           | Status      |
| ------ | ---------------------------------------------- | ----------- |
| Day 6  | API: `/api/voice/oracle` (combined endpoint)   | ✅ Done     |
| Day 6  | Wire mic → API → Neptu voice response          | ✅ Done     |
| Day 7  | Context injection: Potensi + Peluang in oracle | ✅ Done     |
| Day 7  | Multi-language support (10 langs, same as web) | ✅ Done     |
| Day 8  | Wallet panel: SOL/NEPTU balance, subscription  | ✅ Done     |
| Day 8  | Payment flow: MWA transaction signing          | Not started |
| Day 9  | Free tier logic (5 conversations/day)          | Not started |
| Day 9  | Settings panel: profile, language, voice       | ✅ Done     |
| Day 10 | End-to-end testing on Android emulator         | Not started |
| Day 10 | Bug fixes & performance optimization           | Not started |

### Week 3: Polish & Submit (Mar 1–9) — 9 days

| Day    | Task                                            | Status      |
| ------ | ----------------------------------------------- | ----------- |
| Day 11 | Visual polish: orb animations, transitions      | Not started |
| Day 12 | Haptic feedback, sound effects (chime, error)   | Not started |
| Day 13 | Build APK, test on real Android device / Seeker | Not started |
| Day 14 | Demo video recording (3-5 min)                  | Not started |
| Day 15 | Pitch deck / presentation                       | Not started |
| Day 16 | Final APK build, code cleanup                   | Not started |
| Day 17 | Submit to hackathon (align.nexus)               | Not started |
| Day 18 | Publish to Solana dApp Store                    | Not started |

---

## What We Reuse (Already Built)

| Component                            | Package/App            | Status      |
| ------------------------------------ | ---------------------- | ----------- |
| Wariga Calculator (Potensi/Peluang)  | `packages/wariga`      | ✅ Done     |
| AI Oracle (Azure OpenAI gpt-4o-mini) | `apps/worker`          | ✅ Done     |
| $NEPTU Token (SPL)                   | `blockchain/solana`    | ✅ Deployed |
| Payment Programs (Anchor)            | `packages/solana`      | ✅ Done     |
| Payment APIs (build/verify)          | `apps/api`             | ✅ Done     |
| Pricing APIs                         | `apps/api`             | ✅ Done     |
| User/Auth APIs                       | `apps/api`             | ✅ Done     |
| Voice Personality Guide              | `brainstorming/`       | ✅ Written  |
| Database (22 schemas)                | `packages/drizzle-orm` | ✅ Done     |
| Shared constants/types               | `packages/shared`      | ✅ Done     |
| Voice constants (10 langs)           | `packages/shared`      | ✅ Done     |
| Azure Speech REST client             | `apps/api`             | ✅ Done     |
| Voice API routes (4 endpoints)       | `apps/api`             | ✅ Done     |
| preferredLanguage DB migration       | `packages/drizzle-orm` | ✅ Done     |
| Web language settings → DB           | `apps/web`             | ✅ Done     |

### What We Build New

| Component                   | Location      | Effort                |
| --------------------------- | ------------- | --------------------- |
| Mobile Wallet Adapter setup | `apps/mobile` | ✅ Done               |
| Onboarding screen           | `apps/mobile` | ✅ Done               |
| Orb audio visualizer (Skia) | `apps/mobile` | ✅ Done               |
| Audio recording hooks       | `apps/mobile` | ✅ Done               |
| Audio playback hooks        | `apps/mobile` | ✅ Done               |
| Voice API endpoints         | `apps/api`    | ✅ Done               |
| Azure Speech STT + TTS      | `apps/api`    | ✅ Done               |
| Wallet/Settings panels      | `apps/mobile` | ✅ Done               |
| MWA payment signing         | `apps/mobile` | 1 day                 |
| Polish, APK, demo           | `apps/mobile` | 3 days                |
| **Total new work**          |               | **~4 days remaining** |

---

## Demo Script (3-5 minutes)

```
0:00 - HOOK
  "What if you could talk to a 1000-year-old oracle... on your phone?"
  [Show phone with Neptu orb pulsing gently]

0:15 - CONNECT
  "Connect your Solana wallet with one tap."
  [Tap Connect → Seeker wallet opens → approve → connected]

0:30 - ONBOARD
  "Tell Neptu your birthday and language. That's it."
  [Select date → select English → tap Awaken]

0:50 - FIRST CONVERSATION
  "Now just talk."
  [Tap mic → orb starts reacting to voice]
  "Hey Neptu, what kind of person am I?"
  [Orb shifts to thinking state → then speaks back]
  "The cosmos reveals your path, seeker. You were born on a GURU day
   in the Sinta wuku. Your CIPTA shows deep TRUST, your RASA carries PEACE..."
  [Orb animates with Neptu's voice waveform]

1:30 - DAILY READING
  [Tap mic → orb listens]
  "What's my energy for today?"
  [Neptu responds with today's Peluang reading via audio]

2:00 - PAYMENT
  "Neptu offers 5 free conversations daily.
   For unlimited access, pay with SOL or $NEPTU tokens."
  [Show wallet panel → SOL/NEPTU balance]
  [Show subscription upgrade flow with MWA signing]

2:30 - TOKEN ECONOMICS
  "Pay with SOL → earn $NEPTU rewards.
   Pay with $NEPTU → 50% gets burned. Deflationary by design."
  [Show visual of token flow]

3:00 - TECH STACK
  "Built with Expo React Native, Solana Mobile Wallet Adapter,
   Azure OpenAI + Azure Speech Services, and a real 210-day
   Balinese calendar engine on Solana devnet."

3:20 - CLOSING
  "Neptu. Ancient wisdom. Your voice. On-chain."
  [Orb pulses one final time]
```

---

## Competitive Differentiation

| Other dApps                 | Neptu Voice Oracle                                |
| --------------------------- | ------------------------------------------------- |
| Text-based chatbots         | Voice-first — speak and listen                    |
| Generic AI assistants       | Culturally rooted in 1000-year Balinese tradition |
| Dashboard-heavy apps        | Zero-UI: just a living orb and your voice         |
| One-time use apps           | Daily ritual — cosmic energy changes every day    |
| Western astrology/horoscope | Unique Wuku 210-day calendar (no one else has it) |
| No token utility            | $NEPTU with real pay-per-use and 50% burn         |

---

## Risk & Mitigation

| Risk                        | Mitigation                                            |
| --------------------------- | ----------------------------------------------------- |
| Azure Speech latency        | Stream TTS; show thinking animation during processing |
| MWA integration complexity  | Use official Solana Mobile SDK examples               |
| Skia performance on low-end | Fallback to simpler Reanimated-only visualizer        |
| 18 days tight timeline      | Reuse 80% of backend; focus only on mobile + voice    |
| APK size too large          | Tree-shake, exclude unused Expo modules               |
| Judge needs tokens to test  | Free tier (5 convos/day) requires no tokens           |

---

## Open Questions

- [ ] SKR bonus prize: Should we integrate SKR (Seeker Rewards)? How?
- [x] Voice persona: ~~Record a custom voice model or use Azure Neural presets?~~ → Using Azure Neural presets (per-language voice mapping in `packages/shared/src/constants/voice.ts`)
- [ ] Offline mode: Cache last reading for offline access?
- [ ] Background audio: Allow Neptu to deliver morning readings via notification?
- [ ] Expo prebuild vs bare workflow: Which is better for Skia + MWA?

---

## Resources

- [Solana Mobile Docs](https://docs.solanamobile.com/)
- [Mobile Wallet Adapter SDK](https://github.com/solana-mobile/mobile-wallet-adapter)
- [Solana dApp Store Publishing](https://publish.solanamobile.com/)
- [Hackathon Toolbox](https://solanamobile.radiant.nexus/?panel=toolbox)
- [Radiants Discord](https://discord.gg/radiants)
- [Azure Speech Services](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/)
- [React Native Skia](https://shopify.github.io/react-native-skia/)
- [Expo AV](https://docs.expo.dev/versions/latest/sdk/av/)
