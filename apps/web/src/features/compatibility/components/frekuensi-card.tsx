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
        <p className="text-lg sm:text-xl font-bold mt-1">
          {t(`wariga.lahirUntuk.${name}`, name)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t(`wariga.lahirUntukDesc.${purpose}`, purpose)}
        </p>
      </CardContent>
    </Card>
  );
}
