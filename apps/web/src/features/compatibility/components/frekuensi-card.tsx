import { Card, CardContent, CardDescription } from "@/components/ui/card";

export function FrekuensiCard({
  label,
  name,
  purpose,
  t,
}: {
  label: string;
  name: string;
  purpose: string;
  t: (key: string, fallback?: string) => string;
}) {
  return (
    <Card>
      <CardContent className="pt-4 text-center">
        <CardDescription className="text-xs">{label}</CardDescription>
        <p className="mt-1 text-lg font-bold sm:text-xl">
          {t(`wariga.lahirUntuk.${name}`, name)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {t(`wariga.lahirUntukDesc.${purpose}`, purpose)}
        </p>
      </CardContent>
    </Card>
  );
}
