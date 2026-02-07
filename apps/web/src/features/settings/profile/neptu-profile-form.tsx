import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO, subYears } from "date-fns";
import { Loader2, Calendar, Lock, AlertCircle } from "lucide-react";
import { USER_INTERESTS, type UserInterest } from "@neptu/shared";
import { useUser } from "@/hooks/use-user";
import { useTranslate } from "@/hooks/use-translate";
import { neptuApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";

const INTEREST_EMOJIS: Record<UserInterest, string> = {
  career: "💼",
  love: "💕",
  health: "🏃",
  spirituality: "🙏",
  finance: "💰",
  family: "👨‍👩‍👧‍👦",
  travel: "✈️",
  creativity: "🎨",
  education: "📚",
  relationships: "🤝",
};

export function NeptuProfileForm() {
  const { user, walletAddress, hasWallet, isError, refetch } = useUser();
  const t = useTranslate();

  // No wallet connected
  if (!hasWallet || !walletAddress) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">
          Please connect your wallet to view profile settings.
        </p>
      </div>
    );
  }

  // Error loading user data
  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-4">
        <p className="text-muted-foreground">Failed to load profile data.</p>
        <Button variant="outline" onClick={() => refetch()}>
          Try Again
        </Button>
      </div>
    );
  }

  // Use key to reset form state when user data changes
  const formKey = `${user?.id}-${user?.displayName}-${user?.interests?.join(",")}`;

  return (
    <ProfileFormInner
      key={formKey}
      user={user}
      walletAddress={walletAddress}
      t={t}
    />
  );
}

interface ProfileFormInnerProps {
  user: ReturnType<typeof useUser>["user"];
  walletAddress: string;
  t: ReturnType<typeof useTranslate>;
}

function ProfileFormInner({ user, walletAddress, t }: ProfileFormInnerProps) {
  const queryClient = useQueryClient();

  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [interests, setInterests] = useState<string[]>(user?.interests || []);
  const [birthDate, setBirthDate] = useState<Date | undefined>(
    user?.birthDate ? parseISO(user.birthDate) : undefined,
  );

  const hasBirthDate = !!user?.birthDate;
  const maxDate = subYears(new Date(), 13);
  const minDate = subYears(new Date(), 100);

  const updateProfile = useMutation({
    mutationFn: async (data: {
      displayName?: string;
      interests?: string[];
      birthDate?: string;
    }) => {
      return neptuApi.updateProfile(walletAddress, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", walletAddress] });
      toast.success(t("toast.profileUpdated"));
    },
    onError: (
      error: Error & {
        response?: { data?: { error?: string }; status?: number };
      },
    ) => {
      const message = error.response?.data?.error || t("toast.profileError");
      toast.error(message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Require birth date if not already set
    if (!hasBirthDate && !birthDate) {
      toast.error(t("toast.birthDateRequired"));
      return;
    }

    // Build update payload - only include fields with values
    const payload: {
      displayName?: string;
      interests?: string[];
      birthDate?: string;
    } = {};

    // Only include displayName if not empty
    if (displayName && displayName.trim()) {
      payload.displayName = displayName.trim();
    }

    // Only include interests if array has items
    if (interests && interests.length > 0) {
      payload.interests = interests;
    }

    // Add birthDate only if not already set
    if (!hasBirthDate && birthDate) {
      payload.birthDate = format(birthDate, "yyyy-MM-dd");
    }

    updateProfile.mutate(payload);
  };

  const toggleInterest = (interest: string) => {
    setInterests((prev) =>
      prev.includes(interest)
        ? prev.filter((i) => i !== interest)
        : [...prev, interest],
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Birth Date */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("settings.birthDate")}</Label>

        {hasBirthDate ? (
          <>
            {/* Birth date is set - show as disabled */}
            <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
              <Lock className="h-4 w-4 text-muted-foreground" />
              <span>{format(parseISO(user.birthDate!), "MMMM d, yyyy")}</span>
            </div>
            <Alert variant="default" className="mt-2">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs">
                {t("settings.birthDate.locked")}
              </AlertDescription>
            </Alert>
          </>
        ) : (
          <>
            {/* Birth date not set - show date picker */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !birthDate && "text-muted-foreground",
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {birthDate
                    ? format(birthDate, "MMMM d, yyyy")
                    : t("settings.birthDate.select")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={birthDate}
                  onSelect={setBirthDate}
                  defaultMonth={birthDate || subYears(new Date(), 25)}
                  fromDate={minDate}
                  toDate={maxDate}
                  captionLayout="dropdown"
                  fromYear={minDate.getFullYear()}
                  toYear={maxDate.getFullYear()}
                />
              </PopoverContent>
            </Popover>
            <Alert className="mt-2 border-lime-500/50 bg-lime-500/10 [&>svg]:text-lime-600 dark:[&>svg]:text-lime-400">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-xs text-lime-700 dark:text-lime-300">
                {t("settings.birthDate.warning")}
              </AlertDescription>
            </Alert>
          </>
        )}
      </div>

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName">{t("settings.displayName")}</Label>
        <Input
          id="displayName"
          placeholder={t("settings.displayName.placeholder")}
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={50}
        />
        <p className="text-xs text-muted-foreground">
          {t("settings.displayName.desc")}
        </p>
      </div>

      {/* Interests */}
      <div className="space-y-2">
        <Label>{t("settings.interests")}</Label>
        <p className="text-xs text-muted-foreground mb-4">
          {t("settings.interests.desc")}
        </p>
        <div className="grid grid-cols-2 gap-3">
          {USER_INTERESTS.map((interest) => (
            <div key={interest} className="flex items-center space-x-3">
              <Checkbox
                id={`interest-${interest}`}
                checked={interests.includes(interest)}
                onCheckedChange={() => toggleInterest(interest)}
              />
              <Label
                htmlFor={`interest-${interest}`}
                className="cursor-pointer text-sm font-normal"
              >
                {INTEREST_EMOJIS[interest]} {t(`interest.${interest}`)}
              </Label>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet Address - Read Only */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("settings.wallet")}</Label>
        <div className="rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono">
          {walletAddress ? (
            <span>
              {walletAddress.slice(0, 8)}...{walletAddress.slice(-8)}
            </span>
          ) : (
            <span className="text-muted-foreground">
              {t("settings.wallet.notConnected")}
            </span>
          )}
        </div>
      </div>

      <Button type="submit" disabled={updateProfile.isPending}>
        {updateProfile.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {t("button.save")}...
          </>
        ) : (
          t("button.updateProfile")
        )}
      </Button>
    </form>
  );
}
