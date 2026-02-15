import { Button } from "@/components/ui/button";
import { useTranslate } from "@/hooks/use-translate";
import { useNavigate, useRouter } from "@tanstack/react-router";

export function NotFoundError() {
  const navigate = useNavigate();
  const { history } = useRouter();
  const t = useTranslate();

  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] leading-tight font-bold">
          {t("error.404")}
        </h1>
        <span className="font-medium">{t("error.404title")}</span>
        <p className="text-center text-muted-foreground">
          {t("error.404desc")}
        </p>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={() => history.go(-1)}>
            {t("error.goBack")}
          </Button>
          <Button onClick={() => navigate({ to: "/" })}>
            {t("error.backToHome")}
          </Button>
        </div>
      </div>
    </div>
  );
}
