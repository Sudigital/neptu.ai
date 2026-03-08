# Neptu - Voice-First AI Oracle on Solana

> **"Talk to the Cosmos. It Talks Back."**

Neptu transforms the 1000-year-old Balinese Wuku calendar into a **voice-first mobile oracle** on Solana. No typing, no dashboards -- just tap the living, breathing Neptu orb and speak. Ask about your birth potential, today's cosmic energy, or life guidance. Neptu listens, calculates your readings using the sacred 210-day Wuku cycle, and responds with a mystical voice. Pay with SOL or $NEPTU tokens. Every interaction is a conversation with the cosmos.

## Key Features

- **Voice Oracle** -- Tap the orb, speak naturally, get audio responses powered by Azure OpenAI + Neural TTS
- **Potensi Reading** -- Birth potential analysis revealing Mind (CIPTA), Heart (RASA), and Action (KARSA) traits
- **Daily Peluang** -- Today's energy forecast based on the 210-day Wuku cycle (changes daily)
- **Habit Tracker** -- Build daily rituals aligned with your Wuku energy, earn NEPTU token rewards
- **AR Aura Scanner** -- Camera-based aura visualization using face detection + Skia rendering
- **Compatibility Match** -- Mitra Satru matching with another person
- **$NEPTU Token** -- SPL token with hybrid payments: pay SOL (earn NEPTU) or pay NEPTU (50% burned)

## Mobile App (MONOLITH Hackathon Entry)

The primary experience is a **native Android app** built with Expo + React Native, designed for Solana Mobile's Seeker device.

### Solana Mobile Integration

- **Mobile Wallet Adapter (MWA)** for wallet connect, transaction signing, and message signing
- **$NEPTU SPL Token** on Solana devnet for pay-per-use voice conversations
- **Anchor programs** for subscription payments and token rewards
- Wallet panel showing SOL/NEPTU balances, streaks, and subscription tiers

### Voice Oracle Flow

```
User taps mic
  -> Orb enters LISTENING state (reacts to mic amplitude)
  -> User speaks: "What's my energy today?"
  -> Orb enters THINKING state
    -> Speech-to-Text (Azure Speech Services)
    -> Wariga engine calculates Potensi + Peluang
    -> AI generates response (Azure OpenAI gpt-4o-mini)
    -> Text-to-Speech (Azure Neural TTS)
  -> Orb enters SPEAKING state (pulses with voice waveform)
  -> Neptu speaks the response
  -> Orb returns to IDLE
```

### Orb Visualizer

The animated orb is rendered with `@shopify/react-native-skia` and `react-native-reanimated`:

| State     | Visual                               | Audio       |
| --------- | ------------------------------------ | ----------- |
| Idle      | Slow ambient pulse, soft glow        | Silent      |
| Listening | Expands/contracts with mic amplitude | Mic active  |
| Thinking  | Ripples, rotates, particles orbit    | Chime tone  |
| Speaking  | Pulses with Neptu's voice waveform   | TTS playing |

### Supported Languages (10)

English, Indonesian, French, German, Spanish, Portuguese, Russian, Japanese, Korean, Chinese -- each with a dedicated Azure Neural TTS voice.

## Project Structure

```
neptu.ai/
├── apps/
│   ├── mobile/           # Expo + React Native (MONOLITH entry)
│   ├── api/              # Hono API server (Bun)
│   ├── web/              # React web dashboard (Vite)
│   ├── worker/           # Background worker (Hono)
│   ├── cli/              # CLI tool
│   └── crawler/          # Data crawler
├── packages/
│   ├── shared/           # Shared types, constants, pricing
│   ├── drizzle-orm/      # Database schemas + services (22 tables)
│   ├── solana/           # Anchor client + transaction builders
│   ├── wariga/           # Wuku calendar engine (proprietary)
│   ├── logger/           # Structured logging
│   └── queues/           # Job queue abstraction
├── blockchain/
│   └── solana/neptu/     # Anchor programs (token + economy)
└── docs/                 # Documentation (VitePress)
```

## Tech Stack

| Layer          | Technology                                                     |
| -------------- | -------------------------------------------------------------- |
| **Mobile**     | Expo SDK 54, React Native 0.81, React 19, TypeScript 5.9       |
| **Wallet**     | Solana Mobile Wallet Adapter (MWA)                             |
| **Animations** | react-native-reanimated + @shopify/react-native-skia           |
| **Audio**      | expo-av (recording + playback), expo-haptics                   |
| **AR**         | react-native-vision-camera + face detection + Skia             |
| **Backend**    | Hono on Bun, Azure OpenAI (gpt-4o-mini), Azure Speech Services |
| **Database**   | PostgreSQL + Drizzle ORM (22 schemas)                          |
| **Blockchain** | Solana devnet, Anchor, $NEPTU SPL token                        |
| **Web**        | React 19 + Vite + TailwindCSS + shadcn/ui                      |
| **Build**      | Bun + Turborepo                                                |
| **CI/CD**      | GitHub Actions, Azure Container Apps, Cloudflare Pages         |

## Quick Start

### Mobile App

```bash
# Install dependencies
cd apps/mobile && npm install --legacy-peer-deps

# Start Metro bundler
npm run dev

# Run on Android (requires emulator or device + ADB)
npm run android

# Reverse ADB ports (for physical device)
adb reverse tcp:3000 tcp:3000 && adb reverse tcp:8081 tcp:8081
```

### Backend (API + Worker)

```bash
# From monorepo root
bun install

# Run API server (port 3000)
bun run api

# Run worker (port 3001)
bun run --filter=@neptu/worker dev
```

## Freemium Model

5 free voice conversations per day. No tokens needed to try.

| Tier    | Name     | SOL   | Duration | Features                                  |
| ------- | -------- | ----- | -------- | ----------------------------------------- |
| Free    | Explorer | 0     | --       | Basic calendar, 5 voice conversations/day |
| Weekly  | Seeker   | 0.005 | 7 days   | AI feedback, interests                    |
| Monthly | Mystic   | 0.015 | 30 days  | AI feedback, interests                    |
| Yearly  | Oracle   | 0.1   | 365 days | AI feedback, interests                    |

Additional voice conversations: **0.002 SOL** or **2 NEPTU** per message.

Pay with SOL -> earn NEPTU rewards. Pay with NEPTU -> 50% gets burned (deflationary).

## On-Chain Programs (Devnet)

| Program       | Address               |
| ------------- | --------------------- |
| neptu_token   | `7JDw4pncZg...4TwqHW` |
| neptu_economy | `6Zxc4uCXKq...PnvT`   |

## Competitive Differentiation

| Others                | Neptu                                             |
| --------------------- | ------------------------------------------------- |
| Text-based chatbots   | Voice-first -- speak and listen                   |
| Generic AI assistants | Rooted in 1000-year Balinese tradition            |
| Dashboard-heavy apps  | Zero-UI: living orb + your voice                  |
| One-time use          | Daily ritual -- cosmic energy changes every day   |
| Western horoscope     | Unique 210-day Wuku calendar (no one else has it) |
| No token utility      | $NEPTU with real pay-per-use and 50% burn         |

## License

Proprietary. Built by [Sudigital](https://sudigital.com).

---

_Om Swastiastu_
