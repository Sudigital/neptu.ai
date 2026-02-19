import { ConfirmDialog } from "@/components/confirm-dialog";
import { clearAuthToken } from "@/lib/api";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";

interface SignOutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SignOutDialog({ open, onOpenChange }: SignOutDialogProps) {
  const { handleLogOut } = useDynamicContext();

  const handleSignOut = async () => {
    clearAuthToken();
    await handleLogOut();
    // Redirect is handled by the useEffect in use-auth.ts watching isDynamicLoggedIn
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
