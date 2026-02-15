import useDialogState from "@/hooks/use-dialog-state";
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import { type Plan } from "../data/schema";

type PlansDialogType = "edit" | "cancel";

type PlansContextType = {
  open: PlansDialogType | null;
  setOpen: (str: PlansDialogType | null) => void;
  currentRow: Plan | null;
  setCurrentRow: Dispatch<SetStateAction<Plan | null>>;
};

const PlansContext = createContext<PlansContextType | null>(null);

export function PlansProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useDialogState<PlansDialogType>(null);
  const [currentRow, setCurrentRow] = useState<Plan | null>(null);

  return (
    <PlansContext value={{ open, setOpen, currentRow, setCurrentRow }}>
      {children}
    </PlansContext>
  );
}

export const usePlans = () => {
  const plansContext = useContext(PlansContext);

  if (!plansContext) {
    throw new Error("usePlans has to be used within <PlansContext>");
  }

  return plansContext;
};
