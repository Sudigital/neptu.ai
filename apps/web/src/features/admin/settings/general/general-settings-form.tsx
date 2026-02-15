import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { showSubmittedData } from "@/lib/show-submitted-data";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

const generalSettingsSchema = z.object({
  environment: z.enum(["production", "staging", "development"], {
    required_error: "Please select an environment.",
  }),
  maintenanceMode: z.boolean().default(false),
  oracleAi: z.boolean().default(true),
  registrationOpen: z.boolean().default(true),
  debugMode: z.boolean().default(false),
});

type GeneralSettingsValues = z.infer<typeof generalSettingsSchema>;

const defaultValues: Partial<GeneralSettingsValues> = {
  environment: "production",
  maintenanceMode: false,
  oracleAi: true,
  registrationOpen: true,
  debugMode: false,
};

export function GeneralSettingsForm() {
  const form = useForm<GeneralSettingsValues>({
    resolver: zodResolver(generalSettingsSchema),
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
          name="environment"
          render={({ field }) => (
            <FormItem className="relative space-y-3">
              <FormLabel>Environment</FormLabel>
              <FormControl>
                <RadioGroup
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  className="flex flex-col gap-2"
                >
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <RadioGroupItem value="production" />
                    </FormControl>
                    <FormLabel className="font-normal">Production</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <RadioGroupItem value="staging" />
                    </FormControl>
                    <FormLabel className="font-normal">Staging</FormLabel>
                  </FormItem>
                  <FormItem className="flex items-center gap-2">
                    <FormControl>
                      <RadioGroupItem value="development" />
                    </FormControl>
                    <FormLabel className="font-normal">Development</FormLabel>
                  </FormItem>
                </RadioGroup>
              </FormControl>
            </FormItem>
          )}
        />
        <div className="relative">
          <h3 className="mb-4 text-lg font-medium">System Toggles</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="maintenanceMode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Maintenance Mode
                    </FormLabel>
                    <FormDescription>
                      Enable maintenance mode to temporarily disable public
                      access.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="oracleAi"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Oracle AI</FormLabel>
                    <FormDescription>
                      Enable or disable the Oracle AI reading engine.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="registrationOpen"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Open Registration
                    </FormLabel>
                    <FormDescription>
                      Allow new users to register on the platform.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="debugMode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Debug Mode</FormLabel>
                    <FormDescription>
                      Enable verbose logging and debug information.
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>
        <Button type="submit">Save settings</Button>
      </form>
    </Form>
  );
}
