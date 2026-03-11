# Neptu Pitch Deck — MONOLITH Solana Mobile Hackathon

> Copy each slide section into Google Slides. Use the **Title** as slide title, **Subtitle** as subtitle, and **Body** as content text/bullet points. Visual suggestions are in [brackets].

---

## SLIDE 1 — Cover

**Title:** Neptu

**Subtitle:** Talk to the Cosmos. It Talks Back.

**Body:**
A voice AI oracle on Solana, powered by the ancient Balinese Wuku calendar.

MONOLITH — Solana Mobile Hackathon 2026

[Visual: Neptu orb glowing purple/blue on dark background. neptu.day]

---

## SLIDE 2 — The Problem

**Title:** Ancient Wisdom Is Dying

**Body:**

- 4.2 million Balinese Hindus consult the Wuku calendar daily — but knowledge lives only with aging priests
- The 210-day Pawukon cycle governs ceremonies, decisions, and daily life — yet no digital tool exists
- Gen-Z in Bali are disconnecting from tradition — it's not accessible on their phones
- Western horoscope apps dominate the $2.2B astrology market — zero representation from Southeast Asian traditions

**Key stat:** 1,000+ year-old system. Zero mobile-native products.

[Visual: Split — traditional Balinese calendar manuscript vs. empty phone screen]

---

## SLIDE 3 — The Solution

**Title:** Neptu — Your Personal Cosmic Oracle

**Body:**
Neptu turns the Balinese Wuku calendar into a living, speaking AI oracle on your phone.

- **Voice-first** — Tap the orb, speak naturally, hear wisdom back in audio
- **Daily energy readings** — Your Potensi (birth potential) + Peluang (today's opportunity)
- **Habit alignment** — Track daily rituals guided by your cosmic energy
- **AR aura scanner** — See your 5-dimension energy mapped onto your body
- **On-chain payments** — SOL micropayments + $NEPTU token rewards

Not a chatbot. Not a horoscope app. A voice oracle.

[Visual: Screenshot of Neptu Orb in SPEAKING state with audio waveform]

---

## SLIDE 4 — How It Works

**Title:** Speak. Listen. Align.

**Body:**

1. **Connect wallet** — One-tap via Solana Mobile Wallet Adapter (MWA)
2. **Enter your birth date** — Neptu calculates your permanent Potensi (birth energy)
3. **Tap the Orb** — Speak any question naturally
4. **Neptu responds** — AI oracle weaves your Wuku reading into a personalized audio response
5. **Live daily** — Energy changes every day on the 210-day cycle. Come back tomorrow.

**Under the hood:**
Voice -> Azure STT -> Wuku Engine -> GPT-4o-mini -> Azure Neural TTS -> Audio response

Total latency: < 3 seconds. Cost per conversation: $0.007.

[Visual: Flow diagram showing 5 steps with icons, or screenshot walkthrough]

---

## SLIDE 5 — The Wuku Calendar Engine

**Title:** 1,000 Years of Mathematics, Now in TypeScript

**Body:**
The Pawukon calendar is a 210-day cycle with 10 concurrent week systems (1-day to 10-day weeks).

Neptu calculates:

- **5 Soul Dimensions** — Cipta (Mind), Rasa (Heart), Karsa (Will), Tindakan (Action), Frekuensi (Frequency)
- **Dualitas** — YIN / YANG energy balance
- **Total Urip** — Numerical soul energy score
- **Compatibility** — Mitra Satru matching between any two people
- **Prosperity forecast** — Sandang Pangan wealth predictions by age

Our proprietary `wariga` engine is a full TypeScript port of traditional calculation tables — the only one that exists.

[Visual: Soul Radar Chart showing 5 dimensions, or Wuku cycle diagram]

---

## SLIDE 6 — Mobile Experience

**Title:** Built for Android. Voice-First.

**Body:**

| Feature         | Description                                                               |
| --------------- | ------------------------------------------------------------------------- |
| Voice Oracle    | Animated orb with 4 states — idle, listening, thinking, speaking          |
| Home Dashboard  | Energy cards (Yesterday/Today/Tomorrow), Soul Radar Chart, habit progress |
| Habit Tracker   | 8 categories aligned with Wuku energy, streak rewards                     |
| AR Aura Scanner | Camera + face detection + Skia-rendered energy auras                      |
| Wallet Panel    | SOL / NEPTU / SUDIGITAL balances, subscription management                 |
| 10 Languages    | EN, ID, FR, DE, ES, PT, RU, JA, KO, ZH — each with native TTS voice       |

**Stack:** Expo SDK 54 + React Native 0.81 + React 19 + Skia + Reanimated

[Visual: 3-4 phone mockups showing Home, Orb, AR Aura, Wallet screens]

---

## SLIDE 7 — Token Economics

**Title:** $NEPTU — Earn by Living, Burn by Using

**Body:**
**Supply:** 1,000,000,000 (fixed, no minting)

**Distribution:**

- 55% — Ecosystem & Rewards
- 25% — Treasury / DAO
- 15% — Team (1yr cliff + 3yr vest)
- 5% — Reserve

**Hybrid Payment Model:**

- Pay with SOL -> Earn NEPTU as rewards
- Pay with NEPTU -> 50% burned, 50% to treasury

**Deflationary by design.** Every NEPTU payment removes tokens from circulation.

**No IDO. No presale.** Users earn NEPTU only through engagement: daily check-ins (0.1), streaks (1-20), habit completions (0.1), referrals (10).

**Revenue:** 0.002 SOL per voice message = ~$0.34. Cost: $0.007. **48x margin.**

[Visual: Pie chart for distribution + flow diagram showing SOL in -> NEPTU out -> burn cycle]

---

## SLIDE 8 — Solana Integration

**Title:** Meaningful On-Chain Interaction

**Body:**

- **MWA (Mobile Wallet Adapter)** — Native one-tap wallet connection, no browser pop-ups
- **SPL Token ($NEPTU)** — Deployed on devnet: `7JDw...bNMC`
- **Anchor Programs** — `neptu_token` for minting/burning, `neptu_economy` for subscriptions + payments
- **Hybrid payments** — SOL micropayments (0.002 SOL/message) + NEPTU deflationary burns
- **Subscription tiers** — Weekly (0.005 SOL), Monthly (0.015 SOL), Yearly (0.1 SOL)
- **On-chain reward claims** — Habit completions, streaks, referrals all claimable as SPL transfers

Solana is not a bolt-on. Every voice conversation, every habit completion, every subscription flows through Solana.

[Visual: Transaction flow diagram showing wallet -> smart contract -> token mint/burn]

---

## SLIDE 9 — Competitive Landscape

**Title:** No One Else Has This

**Body:**

|                  | Generic AI Apps | Western Horoscope | Neptu                               |
| ---------------- | --------------- | ----------------- | ----------------------------------- |
| Interface        | Text chat       | Text/cards        | **Voice-first**                     |
| Knowledge base   | Internet        | Western zodiac    | **1,000-year Wuku calendar**        |
| Personalization  | Generic prompts | Sun sign only     | **210-day cycle + birth chart**     |
| Daily engagement | None            | Daily horoscope   | **Energy changes daily + habits**   |
| On-chain         | None            | None              | **SOL payments + $NEPTU token**     |
| Cultural depth   | None            | Greek mythology   | **Living Balinese Hindu tradition** |

**TAM:** $2.2B global astrology + $15.7B wellness apps
**Beachhead:** 4.2M Balinese Hindus + Southeast Asian diaspora + global spiritual seekers

[Visual: Competitive matrix or positioning map]

---

## SLIDE 10 — Traction & What's Built

**Title:** Fully Functional. Fully Shipped.

**Body:**
Built in 5 weeks (Feb 2 - Mar 9, 2026):

- Working Android APK with voice oracle, AR aura, habits, wallet
- Full backend: API + Worker on Azure Container Apps
- Web app live at neptu.day (Cloudflare Pages)
- 22 database schemas, 20+ API endpoints
- Proprietary Wuku calculation engine (TypeScript)
- 2 Anchor programs deployed to devnet
- 10-language voice support with neural TTS
- End-to-end voice oracle: < 3 second response time

**All code. One developer. AI-assisted ("vibecoding").**

[Visual: Architecture diagram showing all components, or a "built" checklist with green checkmarks]

---

## SLIDE 11 — Roadmap

**Title:** What's Next

**Body:**

| Phase      | Timeline | Milestone                                                           |
| ---------- | -------- | ------------------------------------------------------------------- |
| v1.0 (Now) | Mar 2026 | Hackathon launch — Voice oracle, habits, AR aura, $NEPTU on devnet  |
| v1.5       | Q2 2026  | Mainnet launch, liquidity pool, iOS build, community beta           |
| v2.0       | Q3 2026  | 3D AR Orb (ViroReact), Wuku Mandala, Token Rain AR, SKR integration |
| v2.5       | Q4 2026  | Kanda Pat Guardian spirits, Habit Garden AR, social features        |
| v3.0       | Q1 2027  | DAO governance, marketplace for readings, multi-chain expansion     |

**Long-term vision:** Neptu becomes the Solana-native spiritual companion — the "Co-Star" of Southeast Asia, but voice-first and on-chain.

[Visual: Horizontal timeline with milestones]

---

## SLIDE 12 — Closing

**Title:** Neptu

**Subtitle:** Ancient Wisdom. Your Voice. On-Chain.

**Body:**
What if you could talk to a 1,000-year-old oracle... on your phone?

Now you can.

- neptu.day
- GitHub: [repo link]
- $NEPTU on Solana

[Visual: Full-screen Neptu orb, glowing, dark background. Clean and minimal.]

---

## SPEAKER NOTES

### Slide 1 — Cover

"Neptu is a voice-first AI oracle built on Solana. You speak to it, it speaks back — weaving 1,000 years of Balinese Wuku calendar wisdom into personalized guidance."

### Slide 2 — Problem

"The Pawukon calendar has guided Balinese life for over a millennium. But this knowledge is oral tradition — passed between priests, not apps. Meanwhile, Western horoscope apps generate $2.2 billion yearly. Southeast Asian spiritual traditions have zero representation in the mobile space."

### Slide 3 — Solution

"Neptu is not a chatbot. It's not a horoscope generator. It's a living oracle — you tap the orb, speak your question, and hear wisdom back in your language. The Wuku engine calculates your unique energy signature, and GPT-4o-mini weaves it into a meaningful response."

### Slide 4 — How It Works

"The whole experience takes under 3 seconds. Your voice goes to Azure Speech, gets transcribed, the Wuku engine calculates your Potensi and Peluang, the AI crafts a response, and neural TTS speaks it back. The orb reacts in real-time — it pulses when you speak, thinks when processing, and glows when responding."

### Slide 5 — Wuku Engine

"This is our moat. We built the only TypeScript implementation of the full Pawukon calculation system. It handles 10 concurrent week cycles, soul dimension calculations, compatibility matching, and prosperity forecasting. Nobody else has this."

### Slide 6 — Mobile

"Five tabs, zero friction. Home gives you today's energy at a glance. The center tab opens AR — scan your aura or talk to the oracle. Habits are aligned to your cosmic energy. And the wallet handles SOL and NEPTU payments natively through MWA."

### Slide 7 — Tokenomics

"NEPTU is designed to be deflationary from day one. No IDO, no presale. You earn tokens by engaging — checking in, completing habits, maintaining streaks. When you spend NEPTU, 50% is burned permanently. The more people use Neptu, the scarcer NEPTU becomes."

### Slide 8 — Solana

"Solana isn't bolted on. Every voice conversation can trigger a micropayment. Every habit completion is a potential on-chain reward claim. Subscriptions are on-chain. The token mint and burn happen through our Anchor programs. This is meaningful blockchain usage."

### Slide 9 — Competition

"There is no voice-first spiritual app on Solana. There is no Wuku calendar app. There is no on-chain astrology product with real tokenomics. We're creating a new category."

### Slide 10 — Traction

"This was built in 5 weeks by one developer using AI-assisted development. The full stack is live — from Anchor programs on devnet to neural TTS in 10 languages. The voice oracle works end-to-end on a real Android device right now."

### Slide 11 — Roadmap

"After the hackathon, we're targeting mainnet launch in Q2, followed by full 3D AR experiences. The long-term vision is Neptu as the Solana-native spiritual companion for Southeast Asia and beyond."

### Slide 12 — Closing

"Neptu. Ancient wisdom. Your voice. On-chain. Thank you."

---

## DESIGN SUGGESTIONS FOR GOOGLE SLIDES

**Theme:** Dark background (#0F172A or #1E1B4B), purple/blue accents (#7C3AED, #0EA5E9)

**Fonts:**

- Titles: Inter Bold or Space Grotesk Bold, white
- Body: Inter Regular, light gray (#94A3B8)
- Accent numbers: Large, bold, purple (#A78BFA)

**Colors:**

- Primary: #7C3AED (purple)
- Secondary: #0EA5E9 (sky blue)
- Accent: #F59E0B (amber/gold)
- Success: #22C55E (green)
- Background: #0F172A (dark navy)
- Text: #F8FAFC (near-white)

**Assets needed:**

- Neptu orb screenshots (idle, listening, thinking, speaking states)
- Home screen screenshot
- AR aura scanner screenshot
- Soul radar chart screenshot
- Architecture diagram
- Token distribution pie chart

**Slide dimensions:** 16:9 widescreen
