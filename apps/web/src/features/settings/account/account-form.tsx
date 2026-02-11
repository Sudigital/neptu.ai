import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
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
import { useSettingsStore } from "@/stores/settings-store";
import { useTranslate } from "@/hooks/use-translate";
import { toast } from "sonner";

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
  const { language, setLanguage } = useSettingsStore();
  const [open, setOpen] = useState(false);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      language: language,
    },
  });

  function onSubmit(data: AccountFormValues) {
    setLanguage(data.language);
    toast.success(t("settings.account.updated", "Account settings updated"));
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
                        !field.value && "text-muted-foreground",
                      )}
                    >
                      {field.value ? (
                        <>
                          <span className="mr-2 font-medium uppercase">
                            {field.value}
                          </span>
                          {
                            languages.find(
                              (language) => language.value === field.value,
                            )?.label
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
                        "Search language...",
                      )}
                    />
                    <CommandEmpty>
                      {t("settings.account.noLanguage", "No language found.")}
                    </CommandEmpty>
                    <CommandGroup>
                      <CommandList>
                        {languages.map((language) => (
                          <CommandItem
                            value={language.label}
                            key={language.value}
                            onSelect={() => {
                              form.setValue("language", language.value);
                              setOpen(false);
                            }}
                          >
                            <CheckIcon
                              className={cn(
                                "size-4",
                                language.value === field.value
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            <span className="mr-2 font-medium uppercase">
                              {language.value}
                            </span>
                            {language.label}
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
                  "This is the language that will be used in the dashboard.",
                )}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">
          {t("settings.account.update", "Update account")}
        </Button>
      </form>
    </Form>
  );
}
