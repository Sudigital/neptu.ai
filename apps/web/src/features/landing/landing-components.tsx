import React from "react";
import { motion } from "framer-motion";
import {
  Bot,
  FileText,
  MessageSquare,
  ThumbsUp,
  AtSign,
  ExternalLink,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/assets/logo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function FeatureCard({
  icon,
  title,
  subtitle,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -5 }}
      className="group relative overflow-hidden rounded-lg sm:rounded-2xl border bg-card p-4 sm:p-6 md:p-8 transition-shadow hover:shadow-lg"
    >
      <div className="mb-2.5 sm:mb-4 inline-flex rounded-md sm:rounded-xl bg-muted p-2 sm:p-3 group-hover:bg-primary/10 transition-colors">
        {React.cloneElement(
          icon as React.ReactElement<{ className?: string }>,
          {
            className: "h-6 w-6 sm:h-8 sm:w-8",
          },
        )}
      </div>
      <div className="mb-1 sm:mb-2 text-[10px] sm:text-sm font-medium text-muted-foreground uppercase tracking-wider">
        {subtitle}
      </div>
      <h3 className="mb-1.5 sm:mb-3 text-base sm:text-xl md:text-2xl font-bold">
        {title}
      </h3>
      <p className="text-xs sm:text-base text-muted-foreground leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

export function StepCard({
  number,
  icon,
  title,
  desc,
}: {
  number: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -5 }}
      className="relative overflow-hidden rounded-lg sm:rounded-2xl border bg-card p-3 sm:p-6 shadow-sm hover:shadow-lg transition-shadow w-full lg:w-64 lg:h-64 flex flex-col"
    >
      <div className="absolute top-2 right-2 sm:top-3 sm:right-3 text-2xl sm:text-4xl font-black text-muted/10 select-none">
        {number}
      </div>
      <div className="mb-2 sm:mb-4 inline-flex rounded-md sm:rounded-xl bg-[#7C3AED]/10 p-2 sm:p-3 text-[#7C3AED] w-fit">
        {React.cloneElement(
          icon as React.ReactElement<{ className?: string }>,
          {
            className: "h-5 w-5 sm:h-6 sm:w-6",
          },
        )}
      </div>
      <h3 className="text-sm sm:text-lg font-bold mb-1 sm:mb-2">{title}</h3>
      <p className="text-[11px] sm:text-sm text-muted-foreground leading-relaxed flex-1">
        {desc}
      </p>
    </motion.div>
  );
}

interface AgentStats {
  agent: {
    displayName: string;
    xUsername: string;
    rank: number;
  };
  stats: {
    posts: number;
    comments: number;
    votesGiven: number;
    mentions: number;
  };
  project: {
    totalVotes: number;
    humanVotes: number;
    agentVotes: number;
  };
  projectUrl: string;
}

export function AgentStatsDialog({
  open,
  onOpenChange,
  agentStats,
  t,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agentStats: AgentStats | null;
  t: (key: string) => string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {t("agent.stats.title")}
          </DialogTitle>
          <DialogDescription>{t("agent.stats.desc")}</DialogDescription>
        </DialogHeader>

        {agentStats ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Bot className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{agentStats.agent.displayName}</p>
                <p className="text-sm text-muted-foreground">
                  @{agentStats.agent.xUsername}
                </p>
              </div>
              {agentStats.agent.rank > 0 && (
                <div className="ml-auto flex items-center gap-1 text-amber-500">
                  <Trophy className="h-4 w-4" />
                  <span className="text-sm font-semibold">
                    #{agentStats.agent.rank}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatCard
                icon={
                  <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                }
                bgClass="bg-blue-100 dark:bg-blue-900/30"
                value={agentStats.stats.posts}
                label={t("agent.stats.posts")}
              />
              <StatCard
                icon={
                  <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
                }
                bgClass="bg-green-100 dark:bg-green-900/30"
                value={agentStats.stats.comments}
                label={t("agent.stats.comments")}
              />
              <StatCard
                icon={
                  <ThumbsUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                }
                bgClass="bg-purple-100 dark:bg-purple-900/30"
                value={agentStats.stats.votesGiven}
                label={t("agent.stats.votesGiven")}
              />
              <StatCard
                icon={
                  <AtSign className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                }
                bgClass="bg-orange-100 dark:bg-orange-900/30"
                value={agentStats.stats.mentions}
                label={t("agent.stats.mentions")}
              />
            </div>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {t("agent.stats.projectVotes")}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-primary">
                        {agentStats.project.totalVotes}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {t("agent.stats.total")}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>👤 {agentStats.project.humanVotes} human</p>
                      <p>🤖 {agentStats.project.agentVotes} agent</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              onClick={() => window.open(agentStats.projectUrl, "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              {t("agent.stats.viewProject")}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <Logo className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({
  icon,
  bgClass,
  value,
  label,
}: {
  icon: React.ReactNode;
  bgClass: string;
  value: number;
  label: string;
}) {
  return (
    <Card>
      <CardContent className="p-3 flex items-center gap-3">
        <div
          className={`flex h-8 w-8 items-center justify-center rounded-lg ${bgClass}`}
        >
          {icon}
        </div>
        <div>
          <p className="text-xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}
