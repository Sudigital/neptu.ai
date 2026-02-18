import { CommandMenu } from "@/components/command-menu";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

type SearchContextType = {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
};

const SearchContext = createContext<SearchContextType | null>(null);

type SearchProviderProps = {
  children: ReactNode;
};

export function SearchProvider({ children }: SearchProviderProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <SearchContext value={{ open, setOpen }}>
      {children}
      <CommandMenu />
    </SearchContext>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useSearch = () => {
  const searchContext = useContext(SearchContext);
  const noop = useCallback<Dispatch<SetStateAction<boolean>>>(() => {}, []);

  if (!searchContext) {
    return { open: false, setOpen: noop } as SearchContextType;
  }

  return searchContext;
};
