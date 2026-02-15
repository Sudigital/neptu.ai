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
import { useTranslate } from "@/hooks/use-translate";
import { showSubmittedData } from "@/lib/show-submitted-data";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const ITEM_IDS = [
  "recents",
  "home",
  "applications",
  "desktop",
  "downloads",
  "documents",
] as const;

const ITEM_LABEL_KEYS: Record<string, string> = {
  recents: "settings.display.recents",
  home: "settings.display.home",
  applications: "settings.display.applications",
  desktop: "settings.display.desktop",
  downloads: "settings.display.downloads",
  documents: "settings.display.documents",
};

const displayFormSchema = z.object({
  items: z.array(z.string()).refine((value) => value.some((item) => item), {
    message: "You have to select at least one item.",
  }),
});

type DisplayFormValues = z.infer<typeof displayFormSchema>;

// This can come from your database or API.
const defaultValues: Partial<DisplayFormValues> = {
  items: ["recents", "home"],
};

export function DisplayForm() {
  const t = useTranslate();
  const items = ITEM_IDS.map((id) => ({
    id,
    label: t(ITEM_LABEL_KEYS[id], id),
  }));

  const form = useForm<DisplayFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(displayFormSchema as any),
    defaultValues,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit((data) => showSubmittedData(data))}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="items"
          render={() => (
            <FormItem>
              <div className="mb-4">
                <FormLabel className="text-base">
                  {t("settings.display.sidebar", "Sidebar")}
                </FormLabel>
                <FormDescription>
                  {t(
                    "settings.display.sidebarDesc",
                    "Select the items you want to display in the sidebar."
                  )}
                </FormDescription>
              </div>
              {items.map((item) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name="items"
                  render={({ field }) => {
                    return (
                      <FormItem
                        key={item.id}
                        className="flex flex-row items-start gap-2"
                      >
                        <FormControl>
                          <Checkbox
                            checked={field.value?.includes(item.id)}
                            onCheckedChange={(checked) => {
                              return checked
                                ? field.onChange([...field.value, item.id])
                                : field.onChange(
                                    field.value?.filter(
                                      (value) => value !== item.id
                                    )
                                  );
                            }}
                          />
                        </FormControl>
                        <FormLabel className="font-normal">
                          {item.label}
                        </FormLabel>
                      </FormItem>
                    );
                  }}
                />
              ))}
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">
          {t("settings.display.update", "Update display")}
        </Button>
      </form>
    </Form>
  );
}
