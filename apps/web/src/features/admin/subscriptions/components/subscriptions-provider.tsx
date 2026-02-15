import useDialogState from "@/hooks/use-dialog-state";
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { type Subscription } from "../data/schema";

type SubscriptionsDialogType = "edit" | "cancel";

type SubscriptionsContextType = {
  open: SubscriptionsDialogType | null;
  setOpen: (str: SubscriptionsDialogType | null) => void;
  currentRow: Subscription | null;
  setCurrentRow: Dispatch<SetStateAction<Subscription | null>>;
};

const SubscriptionsContext = createContext<SubscriptionsContextType | null>(
  null
);

export function SubscriptionsProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useDialogState<SubscriptionsDialogType>(null);
  const [currentRow, setCurrentRow] = useState<Subscription | null>(null);

  return (
    <SubscriptionsContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </SubscriptionsContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSubscriptions = () => {
  const subscriptionsContext = useContext(SubscriptionsContext);

  if (!subscriptionsContext) {
    throw new Error(
      "useSubscriptions has to be used within <SubscriptionsContext>"
    );
  }

  return subscriptionsContext;
};
