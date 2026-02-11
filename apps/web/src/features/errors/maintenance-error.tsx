import { Button } from "@/components/ui/button";
import { useTranslate } from "@/hooks/use-translate";

export function MaintenanceError() {
  const t = useTranslate();
  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] leading-tight font-bold">
          {t("error.503", "503")}
        </h1>
        <span className="font-medium">
          {t("error.503title", "Website is under maintenance!")}
        </span>
        <p className="text-muted-foreground text-center">
          {t(
            "error.503desc",
            "The site is not available at the moment. We'll be back online shortly.",
          )}
        </p>
        <div className="mt-6 flex gap-4">
          <Button variant="outline">
            {t("error.learnMore", "Learn more")}
          </Button>
        </div>
      </div>
    </div>
  );
}
