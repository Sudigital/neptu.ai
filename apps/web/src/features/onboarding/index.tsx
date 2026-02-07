import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format, subYears } from "date-fns";
import {
  CalendarIcon,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Check,
} from "lucide-react";
import { USER_INTERESTS, type UserInterest } from "@neptu/shared";
import { cn } from "@/lib/utils";
import { neptuApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useTranslate } from "@/hooks/use-translate";
import { useUser } from "@/hooks/use-user";
import { Logo } from "@/assets/logo";

const INTEREST_CONFIG: Record<UserInterest, { label: string; emoji: string }> =
  {
    career: { label: "Career", emoji: "💼" },
    love: { label: "Love", emoji: "💕" },
    health: { label: "Health", emoji: "🏃" },
    spirituality: { label: "Spirituality", emoji: "🙏" },
    finance: { label: "Finance", emoji: "💰" },
    family: { label: "Family", emoji: "👨‍👩‍👧‍👦" },
    travel: { label: "Travel", emoji: "✈️" },
    creativity: { label: "Creativity", emoji: "🎨" },
    education: { label: "Learning", emoji: "📚" },
    relationships: { label: "Relationships", emoji: "🤝" },
  };

const onboardingSchema = z.object({
  birthDate: z.date(),
  displayName: z.string().max(50).optional(),
  interests: z.array(z.string()).optional(),
});

type OnboardingFormValues = z.infer<typeof onboardingSchema>;

const TOTAL_STEPS = 3;

export function Onboarding() {
  const { walletAddress, hasWallet, isOnboarded, isLoading } = useUser();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const t = useTranslate();
  const [step, setStep] = useState(1);

  // If already onboarded -> redirect to dashboard
  useEffect(() => {
    if (isOnboarded) {
      navigate({ to: "/dashboard" });
    }
  }, [isOnboarded, navigate]);

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      displayName: "",
      interests: [],
    },
  });

  const onboardMutation = useMutation({
    mutationFn: (data: {
      birthDate: string;
      displayName?: string;
      interests?: string[];
    }) => neptuApi.onboardUser(walletAddress, data),
    onSuccess: async (response) => {
      // Update the cache with the new user data immediately
      queryClient.setQueryData(["user", walletAddress], response);
      // Also invalidate to ensure fresh data on next fetch
      await queryClient.invalidateQueries({
        queryKey: ["user", walletAddress],
      });
      toast.success(t("toast.onboardSuccess"));
      navigate({ to: "/dashboard" });
    },
    onError: () => {
      toast.error(t("toast.onboardError"));
    },
  });

  const handleSubmit = (data: OnboardingFormValues) => {
    onboardMutation.mutate({
      birthDate: format(data.birthDate, "yyyy-MM-dd"),
      displayName: data.displayName || undefined,
      interests: data.interests?.length ? data.interests : undefined,
    });
  };

  const goToNextStep = async () => {
    if (step === 1) {
      const isValid = await form.trigger("birthDate");
      if (isValid) setStep(2);
    } else if (step === 2) {
      setStep(3);
    } else if (step === 3) {
      form.handleSubmit(handleSubmit)();
    }
  };

  const goToPrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const maxDate = subYears(new Date(), 13);
  const minDate = subYears(new Date(), 100);
  const selectedInterests = form.watch("interests") || [];
  const progress = (step / TOTAL_STEPS) * 100;

  // No wallet - show loading
  if (!hasWallet) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <Logo className="mx-auto h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">
            {t("onboarding.connecting")}
          </p>
        </div>
      </div>
    );
  }

  // Loading user data
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Logo className="mx-auto h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  // If already onboarded, show loading while redirecting
  if (isOnboarded) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Logo className="mx-auto h-16 w-16 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Progress bar */}
      <div className="fixed left-0 right-0 top-0 z-50">
        <Progress value={progress} className="h-1 rounded-none" />
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 pt-6">
        <div className="flex items-center gap-2">
          <Logo className="h-8 w-8" />
          <span className="font-semibold">Neptu</span>
        </div>
        <Badge variant="outline" className="text-xs">
          {step} of {TOTAL_STEPS}
        </Badge>
      </header>

      {/* Main content */}
      <main className="flex flex-1 items-center justify-center px-6">
        <div className="w-full max-w-md">
          <Form {...form}>
            <form className="space-y-8">
              {/* Step 1: Birth Date */}
              {step === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t("onboarding.step1.label", "Question 1")}
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      {t("onboarding.step1.title")}
                    </h1>
                    <p className="text-muted-foreground">
                      {t("onboarding.step1.desc")}
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="birthDate"
                    render={({ field }) => (
                      <FormItem>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "h-14 w-full justify-start text-left font-normal",
                                  !field.value && "text-muted-foreground",
                                )}
                              >
                                <CalendarIcon className="mr-3 h-5 w-5" />
                                {field.value
                                  ? format(field.value, "MMMM d, yyyy")
                                  : t("onboarding.step1.placeholder")}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              captionLayout="dropdown"
                              selected={field.value}
                              onSelect={field.onChange}
                              disabled={(date) =>
                                date > maxDate || date < minDate
                              }
                              defaultMonth={
                                field.value || subYears(new Date(), 25)
                              }
                              fromYear={1924}
                              toYear={new Date().getFullYear() - 13}
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2: Interests */}
              {step === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t("onboarding.step2.label", "Question 2")}
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      {t("onboarding.step2.title")}
                    </h1>
                    <p className="text-muted-foreground">
                      {t("onboarding.step2.desc")}
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="interests"
                    render={({ field }) => (
                      <FormItem>
                        <div className="grid grid-cols-2 gap-2">
                          {USER_INTERESTS.map((interest) => {
                            const config = INTEREST_CONFIG[interest];
                            const isSelected = field.value?.includes(interest);
                            return (
                              <Button
                                key={interest}
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                className={cn(
                                  "h-auto justify-start gap-2 px-3 py-3",
                                  isSelected &&
                                    "bg-primary text-primary-foreground",
                                )}
                                onClick={() => {
                                  const current = field.value || [];
                                  if (isSelected) {
                                    field.onChange(
                                      current.filter((i) => i !== interest),
                                    );
                                  } else {
                                    field.onChange([...current, interest]);
                                  }
                                }}
                              >
                                <span>{config.emoji}</span>
                                <span className="text-sm">
                                  {t(`interest.${interest}`, config.label)}
                                </span>
                                {isSelected && (
                                  <Check className="ml-auto h-4 w-4" />
                                )}
                              </Button>
                            );
                          })}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {selectedInterests.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      {selectedInterests.length}{" "}
                      {selectedInterests.length > 1
                        ? t("onboarding.areasSelected", "areas selected")
                        : t("onboarding.areaSelected", "area selected")}
                    </p>
                  )}
                </div>
              )}

              {/* Step 3: Display Name */}
              {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {t("onboarding.step3.label", "Question 3")}
                    </p>
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      {t("onboarding.step3.title")}
                    </h1>
                    <p className="text-muted-foreground">
                      {t("onboarding.step3.desc")}
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder={t("onboarding.step3.placeholder")}
                            className="h-14 text-lg"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                        <p className="text-xs text-muted-foreground">
                          {t("onboarding.step3.optional")}
                        </p>
                      </FormItem>
                    )}
                  />
                </div>
              )}
            </form>
          </Form>
        </div>
      </main>

      {/* Footer navigation */}
      <footer className="px-6 py-6">
        <div className="mx-auto flex max-w-md items-center justify-end gap-2">
          {step > 1 && (
            <Button type="button" variant="ghost" onClick={goToPrevStep}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              {t("onboarding.back", "Back")}
            </Button>
          )}
          {step === 2 && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(3)}
              className="text-muted-foreground"
            >
              {t("onboarding.skip", "Skip")}
            </Button>
          )}
          <Button
            type="button"
            onClick={goToNextStep}
            disabled={onboardMutation.isPending}
          >
            {onboardMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("onboarding.settingUp", "Setting up...")}
              </>
            ) : step === TOTAL_STEPS ? (
              <>
                {t("onboarding.begin", "Get Started")}
                <Check className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                {t("onboarding.continue", "Continue")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </footer>
    </div>
  );
}
