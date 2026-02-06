import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, parseISO } from "date-fns";
import { Loader2, Calendar } from "lucide-react";
import { USER_INTERESTS, type UserInterest } from "@neptu/shared";
import { useUser } from "@/hooks/use-user";
import { useTranslate } from "@/hooks/use-translate";
import { neptuApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
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

const profileFormSchema = z.object({
  displayName: z
    .string()
    .max(50, "Display name must be less than 50 characters")
    .optional(),
  interests: z.array(z.string()).optional(),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export function NeptuProfileForm() {
  const { user, walletAddress, isLoading } = useUser();
  const queryClient = useQueryClient();
  const t = useTranslate();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      displayName: user?.displayName || "",
      interests: user?.interests || [],
    },
    values: {
      displayName: user?.displayName || "",
      interests: user?.interests || [],
    },
  });

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

  const handleSubmit = (data: ProfileFormValues) => {
    updateProfile.mutate({
      displayName: data.displayName || undefined,
      interests:
        data.interests && data.interests.length > 0
          ? data.interests
          : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
        {/* Birth Date - Read Only */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">
            {t("settings.birthDate")}
          </Label>
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
        <FormField
          control={form.control}
          name="displayName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("settings.displayName")}</FormLabel>
              <FormControl>
                <Input
                  placeholder={t("settings.displayName.placeholder")}
                  {...field}
                />
              </FormControl>
              <FormDescription>
                {t("settings.displayName.desc")}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Interests */}
        <FormField
          control={form.control}
          name="interests"
          render={() => (
            <FormItem>
              <FormLabel>{t("settings.interests")}</FormLabel>
              <FormDescription>{t("settings.interests.desc")}</FormDescription>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {USER_INTERESTS.map((interest) => (
                  <FormField
                    key={interest}
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                      <FormItem
                        key={interest}
                        className="flex items-center space-x-3 space-y-0"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(interest)}
                            onCheckedChange={(checked) => {
                              const current = field.value || [];
                              if (checked) {
                                field.onChange([...current, interest]);
                              } else {
                                field.onChange(
                                  current.filter((i) => i !== interest),
                                );
                              }
                            }}
                          />
                        </FormControl>
                        <Label className="cursor-pointer text-sm font-normal">
                          {INTEREST_EMOJIS[interest]}{" "}
                          {t(`interest.${interest}`)}
                        </Label>
                      </FormItem>
                    )}
                  />
                ))}
              </div>
            </FormItem>
          )}
        />

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
    </Form>
  );
}
