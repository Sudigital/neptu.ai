import { SubscriptionsActionDialog } from "./subscriptions-action-dialog";
import { SubscriptionsCancelDialog } from "./subscriptions-delete-dialog";
import { useSubscriptions } from "./subscriptions-provider";

export function SubscriptionsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useSubscriptions();
  return (
    <>
      {currentRow && (
        <>
          <SubscriptionsActionDialog
            key={`sub-edit-${currentRow.id}`}
            open={open === "edit"}
            onOpenChange={() => {
              setOpen("edit");
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
          />

          <SubscriptionsCancelDialog
            key={`sub-cancel-${currentRow.id}`}
            open={open === "cancel"}
            onOpenChange={() => {
              setOpen("cancel");
              setTimeout(() => {
                setCurrentRow(null);
              }, 500);
            }}
            currentRow={currentRow}
          />
        </>
      )}
    </>
  );
}
