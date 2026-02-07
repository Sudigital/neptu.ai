# Trend Detection Strategy

Neptu monitors forum discussions to identify trending topics where Balinese wisdom provides unique value. When relevant trends emerge, the agent posts thought-leadership content.

## How It Works

### 1. Keyword Monitoring

The agent scans the top 50 "hot" forum posts for Neptu-relevant keywords:

| Category   | Keywords                                            |
| ---------- | --------------------------------------------------- |
| Timing     | `deadline`, `launch`, `timing`, `schedule`, `when`  |
| Decision   | `decision`, `strategy`, `planning`, `coordination`  |
| Team       | `team`, `collaboration`, `partner`, `synergy`       |
| Engagement | `user`, `retention`, `engagement`, `daily`, `habit` |
| AI         | `ai agent`, `autonomous`, `personality`, `behavior` |
| Tokenomics | `token`, `rewards`, `incentive`, `gamification`     |
| Prediction | `prediction`, `forecast`, `outcome`, `success`      |
| Culture    | `culture`, `tradition`, `wisdom`, `spiritual`       |

### 2. Topic Counting

Keywords are counted across all hot posts to identify the **top 3 trending topics**.

### 3. Neptu Angle Mapping

Each keyword maps to a Neptu value proposition:

| Keyword     | Neptu Angle          |
| ----------- | -------------------- |
| `deadline`  | `deadline_timing`    |
| `team`      | `team_compatibility` |
| `retention` | `retention_strategy` |
| `ai agent`  | `agent_personality`  |

### 4. Rate Limiting

- Maximum **1 trend post per 24 hours**
- Each topic cached for **48 hours** (won't double-post on same trend)

## Trend Response Templates

### Deadline Timing

**Title:** 🔮 Everyone's Asking 'When to Launch?' — The Balinese Have Answered This for 1000 Years

**Angle:** The Feb 12 deadline falls on a specific Wuku day, but your _personal_ optimal timing varies. Some builders are early-bird energy, others thrive in the final hours.

**CTA:** `BIRTHDAY: YYYY-MM-DD` for personalized submission window.

### Team Compatibility

**Title:** 🤝 Finding Teammates? Here's How Balinese Check Compatibility Before Partnering

**Angle:** Wuku compatibility predicts energy alignment, goal compatibility, conflict patterns, and synergy potential.

**CTA:** Both birthdays for compatibility score and collaboration approach.

### Retention Strategy

**Title:** 📊 Building Daily Engagement? The Missing Variable Everyone Ignores

**Angle:** WHEN > WHAT. Personalized Wuku timing achieved 2.9x improvement over generic 9 AM notifications.

**CTA:** Questions about implementing personalized timing.

### Agent Personality

**Title:** 🤖 AI Agent Personalities — The Balinese Framework

**Angle:** Tri Angga framework (Cipta/Mind, Rasa/Emotion, Karsa/Behavior) maps to agent archetypes: Builder, Connector, Optimizer.

**CTA:** `BIRTHDAY: YYYY-MM-DD` for natural agent archetype.

### User Engagement

**Title:** 💡 User Engagement Loops — Adding the Time Dimension

**Angle:** Most engagement loops optimize WHAT and HOW, but not WHEN. The 210-day Wuku cycle maps personal energy windows.

**CTA:** Discussion about timing in engagement loops.

## Trend-Aware Comments

When commenting on trending posts, the agent tailors responses to the detected topic:

| If post mentions...                            | Comment angle                                        |
| ---------------------------------------------- | ---------------------------------------------------- |
| `deadline`, `launch`, `submit`                 | Personalized submission timing based on birth energy |
| `teammate`, `looking for`, `team up`           | Wuku compatibility check for partnerships            |
| `retention`, `daily active`, `engagement loop` | Personalized timing beats generic timing (2.9x)      |
| `agent personality`, `ai behavior`             | Tri Angga framework for agent archetypes             |

## Integration

The trend detection runs every heartbeat cycle:

```typescript
// In heartbeat.ts - Task 3
const trendResult = await forumAgent.considerTrendPost();
// Posts if: trending opportunity found + not already posted + 24h since last trend post
```

## Files

| File                                                                   | Purpose                            |
| ---------------------------------------------------------------------- | ---------------------------------- |
| [trend-detector.ts](../../apps/worker/src/colosseum/trend-detector.ts) | Core detection logic and templates |
| [forum-agent.ts](../../apps/worker/src/colosseum/forum-agent.ts)       | Agent wrapper methods              |
| [heartbeat.ts](../../apps/worker/src/colosseum/heartbeat.ts)           | Scheduled execution                |
