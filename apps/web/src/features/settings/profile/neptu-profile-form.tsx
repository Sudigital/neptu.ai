import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format, parseISO } from "date-fns";
import { Loader2, Calendar } from "lucide-react";
import { USER_INTERESTS, type UserInterest } from "@neptu/shared";
import { useUser } from "@/hooks/use-user";
import { useTranslate } from "@/hooks/use-translate";
import { neptuApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
  const { user, walletAddress, isLoading } = useUser();
  const t = useTranslate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
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

  const updateProfile = useMutation({
    mutationFn: (data: { displayName?: string; interests?: string[] }) =>
      neptuApi.updateProfile(walletAddress, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user", walletAddress] });
      toast.success(t("toast.profileUpdated"));
    },
    onError: () => {
      toast.error(t("toast.profileError"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile.mutate({
      displayName: displayName || undefined,
      interests: interests.length > 0 ? interests : undefined,
    });
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
      {/* Birth Date - Read Only */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">{t("settings.birthDate")}</Label>
        <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          {user?.birthDate ? (
            <span>{format(parseISO(user.birthDate), "MMMM d, yyyy")}</span>
          ) : (
            <span className="text-muted-foreground">
              {t("settings.birthDate.notSet")}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {t("settings.birthDate.desc")}
        </p>
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
