import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { CommandMenu } from "@/components/command-menu";

type SearchContextType = {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
};

const SearchContext = createContext<SearchContextType | null>(null);

type SearchProviderProps = {
  children: React.ReactNode;
};

export function SearchProvider({ children }: SearchProviderProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
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
  const noop = useCallback<
    React.Dispatch<React.SetStateAction<boolean>>
  >(() => {}, []);

  if (!searchContext) {
    return { open: false, setOpen: noop } as SearchContextType;
  }

  return searchContext;
};
