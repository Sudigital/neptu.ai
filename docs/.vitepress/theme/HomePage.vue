<script setup lang="ts">
const APP_URL = "https://neptu.sudigital.com";
const VOTE_URL = "https://colosseum.com/agent-hackathon/projects/neptu";

const features = [
  {
    icon: "📅",
    title: "Wuku Calendar Oracle",
    description:
      "The 1000-year-old Balinese Wuku calendar transformed into on-chain predictions.",
    link: "/guide/",
    color: "orange",
  },
  {
    icon: "🧠",
    title: "AI Trend Detection",
    description:
      "Machine learning agents that analyze market patterns with ancient wisdom overlay.",
    link: "/agent/trend-detection",
    color: "violet",
  },
  {
    icon: "📈",
    title: "Trading Signals",
    description:
      "Real-time signals combining Wuku cycles with on-chain data for Solana markets.",
    link: "/guide/",
    color: "emerald",
  },
  {
    icon: "🛡️",
    title: "On-Chain Verification",
    description:
      "All predictions and readings stored immutably on the Solana blockchain.",
    link: "/guide/",
    color: "blue",
  },
  {
    icon: "💰",
    title: "Tokenomics",
    description:
      "NEPTU token powering the ecosystem with staking, governance, and rewards.",
    link: "/tokenomics",
    color: "yellow",
  },
  {
    icon: "✨",
    title: "Wariga Engine",
    description:
      "Custom-built Balinese calendar computation engine with predictive analytics.",
    link: "/guide/",
    color: "pink",
  },
];

const quickLinks = [
  {
    icon: "🚀",
    title: "Getting Started",
    description: "Learn the basics of Neptu and start exploring.",
    link: "/guide/",
  },
  {
    icon: "📖",
    title: "Guide",
    description: "In-depth guide to the platform and features.",
    link: "/guide/",
  },
  {
    icon: "🌐",
    title: "AI Agents",
    description: "Explore how AI agents detect trends.",
    link: "/agent/trend-detection",
  },
  {
    icon: "💰",
    title: "Tokenomics",
    description: "Understand the NEPTU token economy.",
    link: "/tokenomics",
  },
];

const stats = [
  { value: "210", label: "Wuku Cycles" },
  { value: "30", label: "Wuku Weeks" },
  { value: "1000+", label: "Years of Wisdom" },
  { value: "SOL", label: "Blockchain" },
];

const techStack = [
  "Solana",
  "React 19",
  "TypeScript",
  "Bun",
  "Hono",
  "Drizzle ORM",
  "Tailwind CSS",
  "Vite",
  "Wariga Engine",
  "AI Agents",
];
</script>

<template>
  <div class="home-custom">
    <!-- Hero -->
    <section class="hero-section">
      <div class="hero-glow" />
      <div class="hero-content">
        <span class="hero-badge">⚡ Ancient Wisdom, On-Chain</span>
        <h1 class="hero-title">Neptu</h1>
        <p class="hero-tagline">
          Transform the 1000-year-old Balinese
          <strong>Wuku Calendar</strong> into your personal
          <strong>oracle</strong> on <strong>Solana</strong>
        </p>
        <p class="hero-subtitle">
          Built with AI agents, on-chain verification, and the Wariga engine —
          bridging ancient Balinese calendar systems with modern DeFi trading
          signals.
        </p>
        <div class="hero-actions">
          <a :href="APP_URL" class="btn-primary"> 📖 Launch App → </a>
          <a href="/guide/" class="btn-secondary">Read Docs →</a>
          <a :href="VOTE_URL" class="btn-secondary">Vote for Neptu 🗳️ →</a>
        </div>
      </div>
    </section>

    <!-- Stats -->
    <section class="stats-section">
      <div class="stats-grid">
        <div v-for="stat in stats" :key="stat.label" class="stat-item">
          <span class="stat-value">{{ stat.value }}</span>
          <span class="stat-label">{{ stat.label }}</span>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features-section">
      <div class="section-header">
        <h2>Platform Features</h2>
        <p>
          A unique fusion of ancient Balinese calendar wisdom with modern AI and
          blockchain technology on Solana.
        </p>
      </div>
      <div class="features-grid">
        <a
          v-for="feature in features"
          :key="feature.title"
          :href="feature.link"
          :class="['feature-card', `feature-${feature.color}`]"
        >
          <div class="feature-icon">{{ feature.icon }}</div>
          <h3>{{ feature.title }}</h3>
          <p>{{ feature.description }}</p>
          <span class="feature-link">Learn more →</span>
        </a>
      </div>
    </section>

    <!-- Quick Links -->
    <section class="quick-links-section">
      <div class="section-header">
        <h2>Explore the Docs</h2>
        <p>
          Everything you need to understand Neptu and the Wuku oracle system.
        </p>
      </div>
      <div class="quick-links-grid">
        <a
          v-for="link in quickLinks"
          :key="link.title"
          :href="link.link"
          class="quick-link-card"
        >
          <span class="quick-link-icon">{{ link.icon }}</span>
          <h3>{{ link.title }}</h3>
          <p>{{ link.description }}</p>
          <span class="quick-link-action">Explore →</span>
        </a>
      </div>
    </section>

    <!-- Tech Stack -->
    <section class="tech-section">
      <p class="tech-label">Built With</p>
      <div class="tech-pills">
        <span v-for="tech in techStack" :key="tech" class="tech-pill">
          {{ tech }}
        </span>
      </div>
    </section>

    <!-- CTA -->
    <section class="cta-section">
      <h2>Ready to explore?</h2>
      <p>
        Dive into the documentation and discover the power of ancient wisdom
        on-chain.
      </p>
      <div class="cta-actions">
        <a href="/guide/" class="btn-primary">Read the Docs →</a>
        <a href="https://github.com/Sudigital/neptu.ai" class="btn-secondary">
          View on GitHub
        </a>
      </div>
    </section>
  </div>
</template>
