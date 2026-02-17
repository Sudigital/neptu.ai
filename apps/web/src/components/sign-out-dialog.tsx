import { ConfirmDialog } from "@/components/confirm-dialog";
import { usePasetoAuthStore } from "@/stores/paseto-auth-store";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { useNavigate } from "@tanstack/react-router";

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const navigate = useNavigate();
  const { clearSession } = usePasetoAuthStore();
  const { handleLogOut } = useDynamicContext();

  const handleSignOut = async () => {
    clearSession();
    await handleLogOut();
    navigate({
      to: "/",
      replace: true,
    });
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
