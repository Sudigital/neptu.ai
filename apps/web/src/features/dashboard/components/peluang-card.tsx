import { Moon } from "lucide-react";

type PeluangReading = {
  sapta_wara?: { name?: string };
  panca_wara?: { name?: string };
  wuku?: { name?: string };
  frekuensi?: { name?: string };
  diberi_hak_untuk?: { name?: string; description?: string };
  tindakan?: { name?: string };
  total_urip?: number;
};

type PeluangCardProps = {
  reading: PeluangReading;
};

export function PeluangCard({ reading }: PeluangCardProps) {
  return (
    <div className="rounded-xl border border-sky-200/50 bg-gradient-to-br from-sky-50 to-blue-50 p-4 dark:border-sky-800/50 dark:from-sky-950/30 dark:to-blue-950/30">
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/20">
          <Moon className="h-4 w-4 text-sky-600 dark:text-sky-400" />
        </div>
        <span className="text-sm font-semibold text-sky-700 dark:text-sky-300">
          PELUANG
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
