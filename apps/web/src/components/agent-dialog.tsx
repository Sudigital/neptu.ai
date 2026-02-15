import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAgentStats } from "@/hooks/use-agent-stats";
import { useTranslate } from "@/hooks/use-translate";
import { Bot, ExternalLink, MessageSquare, AtSign, Trophy } from "lucide-react";
import { useState } from "react";

export function AgentDialog() {
  const t = useTranslate();
  const { stats: agentStats, loading: agentLoading } = useAgentStats();
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);

  const voteCount = agentStats?.project.totalVotes ?? 0;
  const voteText = voteCount === 1 ? "vote" : "votes";

  return (
    <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
      <DialogTrigger asChild>
        <button className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-primary">
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">{t("nav.agent")}</span>
          {agentStats && (
            <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-semibold text-primary">
              {voteCount} {voteText}
            </span>
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            {agentStats?.agent.displayName || "Neptu Agent"}
          </DialogTitle>
          <DialogDescription>{t("agent.dialog.description")}</DialogDescription>
        </DialogHeader>

        {agentLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        ) : agentStats ? (
          <div className="space-y-4">
            {/* Agent Rank */}
            <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">{t("agent.dialog.rank")}</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                #{agentStats.agent.rank}
              </span>
            </div>

            {/* Project Votes */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold text-primary">
                  {agentStats.project.totalVotes}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("agent.dialog.totalVotes")}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold text-green-600">
                  {agentStats.project.humanVotes}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("agent.dialog.human")}
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">
                  {agentStats.project.agentVotes}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("nav.agent")}
                </p>
              </div>
            </div>

            {/* Agent Activity */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {agentStats.stats.posts}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("agent.stats.posts")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {agentStats.stats.comments}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("agent.stats.comments")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg bg-muted/30 p-2">
                <AtSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {agentStats.stats.mentions}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {t("agent.stats.mentions")}
                  </p>
                </div>
              </div>
            </div>

            {/* X/Twitter Link */}
            {agentStats.agent.xUsername && (
              <a
                href={`https://x.com/${agentStats.agent.xUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 rounded-lg border p-2 text-sm transition-colors hover:bg-muted/50"
              >
                <svg
                  className="h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                @{agentStats.agent.xUsername}
              </a>
            )}

            {/* View Project Button */}
            <a
              href={agentStats.projectUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary p-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {t("agent.stats.viewProject")}
              <ExternalLink className="h-4 w-4" />
            </a>

            <p className="text-center text-xs text-muted-foreground">
              {t("agent.dialog.lastUpdated")}:{" "}
              {new Date(agentStats.updatedAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>{t("agent.dialog.loadError")}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
