import { Sun } from "lucide-react";

type PotensiReading = {
  sapta_wara?: { name?: string };
  panca_wara?: { name?: string };
  wuku?: { name?: string };
  frekuensi?: { name?: string };
  lahir_untuk?: { name?: string; description?: string };
  total_urip?: number;
};

type PotensiCardProps = {
  reading: PotensiReading;
};

export function PotensiCard({ reading }: PotensiCardProps) {
  return (
    <div className="rounded-xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50 p-4 dark:border-amber-800/50 dark:from-amber-950/30 dark:to-orange-950/30">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20">
          <Sun className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        <span className="text-sm font-semibold text-amber-700 dark:text-amber-300">
          POTENSI
        </span>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Sapta</span>
          <span className="text-xs font-medium">
            {reading.sapta_wara?.name}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Panca</span>
          <span className="text-xs font-medium">
            {reading.panca_wara?.name}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Wuku</span>
          <span className="text-xs font-medium">{reading.wuku?.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Frekuensi</span>
          <span className="text-xs font-medium">{reading.frekuensi?.name}</span>
        </div>
      </div>
    </div>
  );
}
