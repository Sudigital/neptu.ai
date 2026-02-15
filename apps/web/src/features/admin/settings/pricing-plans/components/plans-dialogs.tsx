import { PlansActionDialog } from "./plans-action-dialog";
import { PlansCancelDialog } from "./plans-delete-dialog";
import { usePlans } from "./plans-provider";

export function PlansDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = usePlans();
  return (
    <>
      {currentRow && (
        <>
          <PlansActionDialog
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

          <PlansCancelDialog
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
