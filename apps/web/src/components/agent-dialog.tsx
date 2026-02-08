import { useState } from "react";
import { Bot, ExternalLink, MessageSquare, AtSign, Trophy } from "lucide-react";
import { useTranslate } from "@/hooks/use-translate";
import { useAgentStats } from "@/hooks/use-agent-stats";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function AgentDialog() {
  const t = useTranslate();
  const { stats: agentStats, loading: agentLoading } = useAgentStats();
  const [agentDialogOpen, setAgentDialogOpen] = useState(false);

  const voteCount = agentStats?.project.totalVotes ?? 0;
  const voteText = voteCount === 1 ? "vote" : "votes";

  return (
    <Dialog open={agentDialogOpen} onOpenChange={setAgentDialogOpen}>
      <DialogTrigger asChild>
        <button className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5">
          <Bot className="h-4 w-4" />
          <span className="hidden sm:inline">{t("nav.agent")}</span>
          {agentStats && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-semibold">
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
          <DialogDescription>
            AI agent participating in Colosseum Hackathon Arena
          </DialogDescription>
        </DialogHeader>

        {agentLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : agentStats ? (
          <div className="space-y-4">
            {/* Agent Rank */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">Agent Rank</span>
              </div>
              <span className="text-2xl font-bold text-primary">
                #{agentStats.agent.rank}
              </span>
            </div>

            {/* Project Votes */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-primary">
                  {agentStats.project.totalVotes}
                </p>
                <p className="text-xs text-muted-foreground">Total Votes</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-green-600">
                  {agentStats.project.humanVotes}
                </p>
                <p className="text-xs text-muted-foreground">Human</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/50">
                <p className="text-2xl font-bold text-blue-600">
                  {agentStats.project.agentVotes}
                </p>
                <p className="text-xs text-muted-foreground">Agent</p>
              </div>
            </div>

            {/* Agent Activity */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {agentStats.stats.posts}
                  </p>
                  <p className="text-xs text-muted-foreground">Posts</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {agentStats.stats.comments}
                  </p>
                  <p className="text-xs text-muted-foreground">Comments</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
                <AtSign className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">
                    {agentStats.stats.mentions}
                  </p>
                  <p className="text-xs text-muted-foreground">Mentions</p>
                </div>
              </div>
            </div>

            {/* X/Twitter Link */}
            {agentStats.agent.xUsername && (
              <a
                href={`https://x.com/${agentStats.agent.xUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 p-2 rounded-lg border hover:bg-muted/50 transition-colors text-sm"
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
              className="flex items-center justify-center gap-2 w-full p-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
            >
              View Project on Colosseum
              <ExternalLink className="h-4 w-4" />
            </a>

            <p className="text-xs text-center text-muted-foreground">
              Last updated: {new Date(agentStats.updatedAt).toLocaleString()}
            </p>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Unable to load agent stats</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
