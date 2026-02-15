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
import { Switch } from "@/components/ui/switch";
import { adminApi } from "@/features/admin/admin-api";
import { useUser } from "@/hooks/use-user";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { type User } from "../data/schema";

const formSchema = z.object({
  displayName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  isAdmin: z.boolean(),
});
type UserEditForm = z.infer<typeof formSchema>;

type UserActionDialogProps = {
  currentRow: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function UsersActionDialog({
  currentRow,
  open,
  onOpenChange,
}: UserActionDialogProps) {
  const { walletAddress } = useUser();
  const queryClient = useQueryClient();

  const form = useForm<UserEditForm>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      displayName: currentRow.displayName ?? "",
      email: currentRow.email ?? "",
      isAdmin: currentRow.isAdmin,
    },
  });

  const mutation = useMutation({
    mutationFn: (values: UserEditForm) =>
      adminApi.updateUser(walletAddress!, currentRow.id, {
        displayName: values.displayName || undefined,
        email: values.email || undefined,
        isAdmin: values.isAdmin,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("User updated successfully");
      form.reset();
      onOpenChange(false);
    },
    onError: () => {
      toast.error("Failed to update user");
    },
  });

  const onSubmit = (values: UserEditForm) => {
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
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update user details. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            id="user-form"
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 px-0.5"
          >
            <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
              <FormLabel className="col-span-2 text-end">Wallet</FormLabel>
              <code className="col-span-4 text-sm text-muted-foreground">
                {currentRow.walletAddress}
              </code>
            </FormItem>
            <FormField
              control={form.control}
              name="displayName"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">
                    Display Name
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Display name"
                      className="col-span-4"
                      autoComplete="off"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className="col-span-4 col-start-3" />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="user@example.com"
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
              name="isAdmin"
              render={({ field }) => (
                <FormItem className="grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1">
                  <FormLabel className="col-span-2 text-end">Admin</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </form>
        </Form>
        <DialogFooter>
          <Button type="submit" form="user-form" disabled={mutation.isPending}>
            {mutation.isPending ? "Saving..." : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
