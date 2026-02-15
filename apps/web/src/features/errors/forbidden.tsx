import { Button } from "@/components/ui/button";
import { useTranslate } from "@/hooks/use-translate";
import { useNavigate, useRouter } from "@tanstack/react-router";

export function ForbiddenError() {
  const navigate = useNavigate();
  const { history } = useRouter();
  const t = useTranslate();
  return (
    <div className="h-svh">
      <div className="m-auto flex h-full w-full flex-col items-center justify-center gap-2">
        <h1 className="text-[7rem] leading-tight font-bold">
          {t("error.403", "403")}
        </h1>
        <span className="font-medium">
          {t("error.403title", "Access Forbidden")}
        </span>
        <p className="text-center text-muted-foreground">
          {t(
            "error.403desc",
            "You don't have the necessary permission to view this resource."
          )}
        </p>
        <div className="mt-6 flex gap-4">
          <Button variant="outline" onClick={() => history.go(-1)}>
            {t("error.goBack", "Go Back")}
          </Button>
          <Button onClick={() => navigate({ to: "/" })}>
            {t("error.backToHome", "Back to Home")}
          </Button>
        </div>
      </div>
    </div>
  );
}
