import { ConfirmDialog } from "@/components/confirm-dialog";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const { handleLogOut } = useDynamicContext();

  const handleSignOut = () => {
    handleLogOut();
    window.location.href = "/";
  };

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Sign out"
      desc="Are you sure you want to sign out? You will need to sign in again to access your account."
      confirmText="Sign out"
      destructive
      handleConfirm={handleSignOut}
      className="sm:max-w-sm"
    />
  );
}
