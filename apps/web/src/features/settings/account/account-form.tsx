import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useTranslate } from "@/hooks/use-translate";
import { useUser } from "@/hooks/use-user";
import { neptuApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/stores/settings-store";
import { zodResolver } from "@hookform/resolvers/zod";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

const languages = [
  { label: "English", value: "en" },
  { label: "Chinese", value: "zh" },
  { label: "French", value: "fr" },
  { label: "German", value: "de" },
  { label: "Indonesian", value: "id" },
  { label: "Japanese", value: "ja" },
  { label: "Korean", value: "ko" },
  { label: "Portuguese", value: "pt" },
  { label: "Russian", value: "ru" },
  { label: "Spanish", value: "es" },
] as const;

const accountFormSchema = z.object({
  language: z.string().min(1, "Please select a language."),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

export function AccountForm() {
  const t = useTranslate();
  const { walletAddress, refetch } = useUser();
  const { language, setLanguage } = useSettingsStore();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      language: language,
    },
  });

  async function onSubmit(data: AccountFormValues) {
    if (!walletAddress) return;
    setIsSaving(true);
    try {
      await neptuApi.updateProfile(walletAddress, {
        preferredLanguage: data.language,
      });
      setLanguage(data.language);
      await refetch();
      toast.success(t("settings.account.updated", "Account settings updated"));
    } catch {
      toast.error(t("settings.account.error", "Failed to update settings"));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>
                {t("settings.account.language", "Language")}
              </FormLabel>
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      type="button"
                      variant="outline"
                      role="combobox"
                      className={cn(
                        "w-[200px] justify-between",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        <>
                          <span className="mr-2 font-medium uppercase">
                            {field.value}
                          </span>
                          {
                            languages.find((lang) => lang.value === field.value)
                              ?.label
                          }
                        </>
                      ) : (
                        t("settings.account.selectLanguage", "Select language")
                      )}
                      <CaretSortIcon className="ms-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[200px] p-0">
                  <Command>
                    <CommandInput
                      placeholder={t(
                        "settings.account.searchLanguage",
                        "Search language..."
                      )}
                    />
                    <CommandEmpty>
                      {t("settings.account.noLanguage", "No language found.")}
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {languages.map((lang) => (
                          <CommandItem
                            value={lang.label}
                            key={lang.value}
                            onSelect={() => {
                              form.setValue("language", lang.value);
                              setOpen(false);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "size-4",
                                lang.value === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span className="mr-2 font-medium uppercase">
                              {lang.value}
                            </span>
                            {lang.label}
                          </CommandItem>
                        ))}
                      </CommandList>
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>
                {t(
                  "settings.account.languageDesc",
                  "This is the language that will be used in the dashboard."
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isSaving}>
          {isSaving
            ? t("settings.account.saving", "Saving...")
            : t("settings.account.update", "Update account")}
        </Button>
      </form>
    </Form>
  );
}
