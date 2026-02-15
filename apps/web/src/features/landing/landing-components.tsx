import { Logo } from "@/assets/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  Bot,
  FileText,
  MessageSquare,
  AtSign,
  ExternalLink,
  Trophy,
} from "lucide-react";
import React from "react";

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
      className="group relative overflow-hidden rounded-lg border bg-card p-4 transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-6 md:p-8"
    >
      <div className="mb-2.5 inline-flex rounded-md bg-muted p-2 transition-colors group-hover:bg-primary/10 sm:mb-4 sm:rounded-xl sm:p-3">
        {React.cloneElement(
          icon as React.ReactElement<{ className?: string }>,
          {
            className: "h-6 w-6 sm:h-8 sm:w-8",
          }
        )}
      </div>
      <div className="mb-1 text-[10px] font-medium tracking-wider text-muted-foreground uppercase sm:mb-2 sm:text-sm">
        {subtitle}
      </div>
      <h3 className="mb-1.5 text-base font-bold sm:mb-3 sm:text-xl md:text-2xl">
        {title}
      </h3>
      <p className="text-xs leading-relaxed text-muted-foreground sm:text-base">
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
      className="relative flex w-full flex-col overflow-hidden rounded-lg border bg-card p-3 shadow-sm transition-shadow hover:shadow-lg sm:rounded-2xl sm:p-6 lg:h-64 lg:w-64"
    >
      <div className="absolute top-2 right-2 text-2xl font-black text-muted/10 select-none sm:top-3 sm:right-3 sm:text-4xl">
        {number}
      </div>
      <div className="mb-2 inline-flex w-fit rounded-md bg-[#7C3AED]/10 p-2 text-[#7C3AED] sm:mb-4 sm:rounded-xl sm:p-3">
        {React.cloneElement(
          icon as React.ReactElement<{ className?: string }>,
          {
            className: "h-5 w-5 sm:h-6 sm:w-6",
          }
        )}
      </div>
      <h3 className="mb-1 text-sm font-bold sm:mb-2 sm:text-lg">{title}</h3>
      <p className="flex-1 text-[11px] leading-relaxed text-muted-foreground sm:text-sm">
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
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
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
                      <p>
                        👤 {agentStats.project.humanVotes}{" "}
                        {t("agent.stats.human")}
                      </p>
                      <p>
                        🤖 {agentStats.project.agentVotes}{" "}
                        {t("agent.stats.agent")}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full"
              onClick={() => window.open(agentStats.projectUrl, "_blank")}
            >
              <ExternalLink className="mr-2 h-4 w-4" />
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
      <CardContent className="flex items-center gap-3 p-3">
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
