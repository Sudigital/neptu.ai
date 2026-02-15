"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { adminApi } from "@/features/admin/admin-api";
import { useUser } from "@/hooks/use-user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { type Plan } from "../data/schema";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  priceUsd: z.coerce.number().min(0),
  discountPercent: z.coerce.number().min(0).max(100),
  isActive: z.boolean(),
});
type PlanEditForm = z.infer<typeof formSchema>;

type PlanActionDialogProps = {
  currentRow: Plan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PlansActionDialog({
  currentRow,
  open,
  onOpenChange,
}: PlanActionDialogProps) {
  const { walletAddress } = useUser();
  const queryClient = useQueryClient();

  const form = useForm<PlanEditForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: currentRow.name,
      priceUsd: currentRow.priceUsd,
      discountPercent: currentRow.discountPercent,
      isActive: currentRow.isActive,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: PlanEditForm) =>
      adminApi.updatePlan(walletAddress!, currentRow.id, {
        name: values.name,
        priceUsd: values.priceUsd,
        discountPercent: values.discountPercent,
        isActive: values.isActive,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "plans"] });
      toast.success("Plan updated successfully");
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update plan");
    },
  });

  const onSubmit = (values: PlanEditForm) => {
    mutation.mutate(values);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        form.reset();
        onOpenChange(state);
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-start">
          <DialogTitle>Edit Plan</DialogTitle>
          <DialogDescription>
            Update plan details. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="plan-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 px-0.5"
          >
            <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
              <FormLabel className="col-span-2 text-end">ID</FormLabel>
              <code className="col-span-4 text-sm text-muted-foreground">
                {currentRow.id}
              </code>
            </FormItem>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Plan name"
                      className="col-span-4"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="priceUsd"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">
                    Price (USD)
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      className="col-span-4"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="discountPercent"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">
                    Discount %
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="0"
                      className="col-span-4"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="submit" form="plan-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
