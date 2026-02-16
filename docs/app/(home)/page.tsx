import {
  ArrowRight,
  BookOpen,
  Brain,
  Calendar,
  Coins,
  Globe,
  Layers,
  Rocket,
  Shield,
  Sparkles,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";

const APP_URL = "https://neptu.sudigital.com";
const VOTE_URL = "https://colosseum.com/agent-hackathon/projects/neptu";

const FEATURES = [
  {
    icon: Calendar,
    title: "Wuku Calendar Oracle",
    description:
      "The 1000-year-old Balinese Wuku calendar transformed into on-chain predictions.",
    href: "/docs/guide",
    color: "from-orange-500/20 to-amber-500/20",
    iconColor: "text-orange-500",
  },
  {
    icon: Brain,
    title: "AI Trend Detection",
    description:
      "Machine learning agents that analyze market patterns with ancient wisdom overlay.",
    href: "/docs/agent/trend-detection",
    color: "from-violet-500/20 to-purple-500/20",
    iconColor: "text-violet-500",
  },
  {
    icon: TrendingUp,
    title: "Trading Signals",
    description:
      "Real-time signals combining Wuku cycles with on-chain data for Solana markets.",
    href: "/docs/guide",
    color: "from-emerald-500/20 to-green-500/20",
    iconColor: "text-emerald-500",
  },
  {
    icon: Shield,
    title: "On-Chain Verification",
    description:
      "All predictions and readings stored immutably on the Solana blockchain.",
    href: "/docs",
    color: "from-blue-500/20 to-cyan-500/20",
    iconColor: "text-blue-500",
  },
  {
    icon: Coins,
    title: "Tokenomics",
    description:
      "NEPTU token powering the ecosystem with staking, governance, and rewards.",
    href: "/docs/tokenomics",
    color: "from-yellow-500/20 to-amber-500/20",
    iconColor: "text-yellow-500",
  },
  {
    icon: Sparkles,
    title: "Wariga Engine",
    description:
      "Custom-built Balinese calendar computation engine with predictive analytics.",
    href: "/docs/guide",
    color: "from-pink-500/20 to-rose-500/20",
    iconColor: "text-pink-500",
  },
];

const QUICK_LINKS = [
  {
    icon: Rocket,
    title: "Getting Started",
    description: "Learn the basics of Neptu and start exploring.",
    href: "/docs",
  },
  {
    icon: Layers,
    title: "Guide",
    description: "In-depth guide to the platform and features.",
    href: "/docs/guide",
  },
  {
    icon: Globe,
    title: "AI Agents",
    description: "Explore how AI agents detect trends.",
    href: "/docs/agent/trend-detection",
  },
  {
    icon: Coins,
    title: "Tokenomics",
    description: "Understand the NEPTU token economy.",
    href: "/docs/tokenomics",
  },
];

const STATS = [
  { value: "210", label: "Wuku Cycles" },
  { value: "30", label: "Wuku Weeks" },
  { value: "1000+", label: "Years of Wisdom" },
  { value: "SOL", label: "Blockchain" },
];

export default function HomePage() {
  return (
    <main className="flex flex-col">
      {/* Hero Section */}
      <section className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-6 py-24">
        <div className="hero-glow" />
        <div className="hero-grid" />

        <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center text-center">
          <div className="border-fd-border bg-fd-card/80 text-fd-muted-foreground mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-medium backdrop-blur-sm">
            <Zap className="size-3.5 text-orange-500" />
            Ancient Wisdom, On-Chain
          </div>

          <h1 className="from-fd-foreground to-fd-foreground/70 mb-6 bg-gradient-to-b bg-clip-text text-5xl font-bold tracking-tight text-transparent md:text-7xl">
            Neptu
          </h1>

          <p className="text-fd-muted-foreground mb-4 max-w-2xl text-lg md:text-xl">
            Transform the 1000-year-old Balinese{" "}
            <span className="text-fd-foreground font-medium">
              Wuku Calendar
            </span>{" "}
            into your personal{" "}
            <span className="text-fd-foreground font-medium">oracle</span> on{" "}
            <span className="text-fd-foreground font-medium">Solana</span>
          </p>

          <p className="text-fd-muted-foreground/80 mb-10 max-w-xl text-sm">
            Built with AI agents, on-chain verification, and the Wariga engine —
            bridging ancient Balinese calendar systems with modern DeFi trading
            signals.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={APP_URL}
              className="bg-fd-primary text-fd-primary-foreground shadow-fd-primary/20 hover:shadow-fd-primary/30 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition-all hover:shadow-xl"
            >
              <BookOpen className="size-4" />
              Launch App
              <ArrowRight className="size-4" />
            </a>
            <Link
              href="/docs"
              className="border-fd-border bg-fd-background/80 hover:bg-fd-accent inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium backdrop-blur-sm transition-colors"
            >
              Read Docs
              <ArrowRight className="size-4" />
            </Link>
            <a
              href={VOTE_URL}
              className="border-fd-border bg-fd-background/80 hover:bg-fd-accent inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium backdrop-blur-sm transition-colors"
            >
              Vote for Neptu
              <ArrowRight className="size-4" />
            </a>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-fd-border bg-fd-card/50 border-y">
        <div className="divide-fd-border mx-auto grid max-w-5xl grid-cols-2 divide-x md:grid-cols-4">
          {STATS.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center gap-1 px-6 py-8"
            >
              <span className="text-fd-foreground text-2xl font-bold md:text-3xl">
                {stat.value}
              </span>
              <span className="text-fd-muted-foreground text-xs">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-fd-foreground mb-3 text-3xl font-bold tracking-tight">
            Platform Features
          </h2>
          <p className="text-fd-muted-foreground mx-auto max-w-2xl">
            A unique fusion of ancient Balinese calendar wisdom with modern AI
            and blockchain technology on Solana.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group border-fd-border bg-fd-card hover:border-fd-border/80 relative overflow-hidden rounded-xl border p-6 transition-all hover:shadow-lg"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 transition-opacity group-hover:opacity-100`}
              />
              <div className="relative">
                <div className="mb-4 flex items-center gap-3">
                  <div className="border-fd-border bg-fd-background rounded-lg border p-2">
                    <feature.icon className={`size-5 ${feature.iconColor}`} />
                  </div>
                </div>
                <h3 className="text-fd-foreground mb-2 font-semibold">
                  {feature.title}
                </h3>
                <p className="text-fd-muted-foreground text-sm leading-relaxed">
                  {feature.description}
                </p>
                <div className="text-fd-muted-foreground group-hover:text-fd-foreground mt-4 inline-flex items-center gap-1 text-xs font-medium transition-colors">
                  Learn more
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Quick Links */}
      <section className="border-fd-border bg-fd-card/30 border-t px-6 py-20">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <h2 className="text-fd-foreground mb-3 text-3xl font-bold tracking-tight">
              Explore the Docs
            </h2>
            <p className="text-fd-muted-foreground mx-auto max-w-2xl">
              Everything you need to understand Neptu and the Wuku oracle
              system.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                className="group border-fd-border bg-fd-background hover:border-fd-primary/50 flex flex-col rounded-xl border p-5 transition-all hover:shadow-md"
              >
                <link.icon className="text-fd-muted-foreground group-hover:text-fd-primary mb-3 size-5 transition-colors" />
                <h3 className="text-fd-foreground mb-1 text-sm font-semibold">
                  {link.title}
                </h3>
                <p className="text-fd-muted-foreground text-xs leading-relaxed">
                  {link.description}
                </p>
                <div className="text-fd-muted-foreground group-hover:text-fd-primary mt-auto flex items-center gap-1 pt-4 text-xs font-medium transition-colors">
                  Explore
                  <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="border-fd-border border-t px-6 py-16">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-fd-muted-foreground mb-6 text-xs font-medium tracking-widest uppercase">
            Built With
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {[
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
            ].map((tech) => (
              <span
                key={tech}
                className="border-fd-border bg-fd-card text-fd-muted-foreground rounded-full border px-3 py-1.5 text-xs font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="border-fd-border border-t px-6 py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center text-center">
          <h2 className="text-fd-foreground mb-3 text-2xl font-bold tracking-tight">
            Ready to explore?
          </h2>
          <p className="text-fd-muted-foreground mb-8">
            Dive into the documentation and discover the power of ancient wisdom
            on-chain.
          </p>
          <div className="flex gap-3">
            <Link
              href="/docs"
              className="bg-fd-primary text-fd-primary-foreground hover:shadow-fd-primary/20 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all hover:shadow-lg"
            >
              Read the Docs
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="https://github.com/nicholassu/neptu.ai"
              className="border-fd-border hover:bg-fd-accent inline-flex items-center gap-2 rounded-full border px-6 py-3 text-sm font-medium transition-colors"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
