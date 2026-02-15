import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { GAMIFICATION_REWARDS, STREAK_MILESTONES } from "@neptu/shared";
import { Flame, Loader2, Calendar, Gift, CheckCircle } from "lucide-react";

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  lastCheckIn: string | null;
  totalCheckIns: number;
}

interface StreakCounterProps {
  streak: StreakData | null;
  onCheckIn: () => void;
  isLoading?: boolean;
  isCheckingIn?: boolean;
  hasCheckedInToday?: boolean;
  className?: string;
}

const MILESTONE_VALUES: number[] = [
  STREAK_MILESTONES.WEEK,
  STREAK_MILESTONES.MONTH,
  STREAK_MILESTONES.CENTURY,
];

const MILESTONE_REWARDS: Record<number, number> = {
  [STREAK_MILESTONES.WEEK]: GAMIFICATION_REWARDS.STREAK_7_DAYS,
  [STREAK_MILESTONES.MONTH]: GAMIFICATION_REWARDS.STREAK_30_DAYS,
  [STREAK_MILESTONES.CENTURY]: GAMIFICATION_REWARDS.STREAK_100_DAYS,
};

function getNextMilestone(currentStreak: number): number | null {
  for (const milestone of MILESTONE_VALUES) {
    if (milestone > currentStreak) {
      return milestone;
    }
  }
  return null;
}

function getProgressToNextMilestone(currentStreak: number): number {
  const nextMilestone = getNextMilestone(currentStreak);
  if (!nextMilestone) return 100;

  // Find previous milestone
  const milestoneIndex = MILESTONE_VALUES.indexOf(nextMilestone);
  const prevMilestone =
    milestoneIndex > 0 ? MILESTONE_VALUES[milestoneIndex - 1] : 0;

  const progress =
    ((currentStreak - prevMilestone) / (nextMilestone - prevMilestone)) * 100;
  return Math.min(100, Math.max(0, progress));
}

export function StreakCounter({
  streak,
  onCheckIn,
  isLoading = false,
  isCheckingIn = false,
  hasCheckedInToday = false,
  className,
}: StreakCounterProps) {
  if (isLoading) {
    return (
      <Card className={cn("", className)}>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  const currentStreak = streak?.currentStreak ?? 0;
  const longestStreak = streak?.longestStreak ?? 0;
  const totalCheckIns = streak?.totalCheckIns ?? 0;
  const lastCheckIn = streak?.lastCheckIn ?? null;
  const nextMilestone = getNextMilestone(currentStreak);
  const progress = getProgressToNextMilestone(currentStreak);
  const nextReward = nextMilestone ? MILESTONE_REWARDS[nextMilestone] : null;

  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const lastCheckInFormatted = lastCheckIn
    ? new Date(lastCheckIn).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <Card className={cn("", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Daily Streak
            </CardTitle>
            <CardDescription>{todayFormatted}</CardDescription>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-orange-500">
              {currentStreak}
            </p>
            <p className="text-sm text-muted-foreground">days</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress to next milestone */}
        {nextMilestone && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Progress to {nextMilestone}-day milestone
              </span>
              <span className="font-medium">
                {currentStreak}/{nextMilestone}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
            {nextReward && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground">
                <Gift className="h-3 w-3" />
                Earn <span className="font-medium">
                  {nextReward} NEPTU
                </span> at{" "}
                {nextMilestone} days!
              </p>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">{totalCheckIns}</p>
              <p className="text-xs text-muted-foreground">Total check-ins</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-2">
            <Flame className="h-4 w-4 text-orange-500" />
            <div>
              <p className="text-sm font-medium">{longestStreak}</p>
              <p className="text-xs text-muted-foreground">Longest streak</p>
            </div>
          </div>
        </div>

        {/* Last check-in date */}
        {lastCheckInFormatted && (
          <p className="text-center text-xs text-muted-foreground">
            Last check-in: {lastCheckInFormatted}
          </p>
        )}

        {/* Daily reward info */}
        <div className="flex items-center justify-between rounded-lg border border-green-500/20 bg-green-500/10 p-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">Daily check-in reward</span>
          </div>
          <Badge
            variant="outline"
            className="border-green-500/50 text-green-600"
          >
            +{GAMIFICATION_REWARDS.DAILY_CHECK_IN} NEPTU
          </Badge>
        </div>

        {/* Check-in button */}
        <Button
          onClick={onCheckIn}
          disabled={isCheckingIn || hasCheckedInToday}
          className="w-full"
          size="lg"
        >
          {isCheckingIn ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Checking in...
            </>
          ) : hasCheckedInToday ? (
            <>
              <CheckCircle className="mr-2 h-4 w-4" />
              Already checked in today!
            </>
          ) : (
            <>
              <Flame className="mr-2 h-4 w-4" />
              Check in for +{GAMIFICATION_REWARDS.DAILY_CHECK_IN} NEPTU
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
