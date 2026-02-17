import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

import { adminApi } from "../../admin-api";

export function CreditPacksCard() {
  const { data: packs } = useQuery({
    queryKey: ["admin", "credit-packs"],
    queryFn: () => adminApi.listCreditPacks(),
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Credit Packs</CardTitle>
        <CardDescription>
          {packs?.packs.length ?? 0} packs available
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {packs?.packs.map((pack) => (
            <div
              key={pack.id}
              className="flex items-center justify-between border-b pb-4 last:border-0"
            >
              <div>
                <div className="font-medium">{pack.name}</div>
                <div className="text-sm text-muted-foreground">
                  {pack.credits.toLocaleString()} credits &bull; $
                  {pack.priceUsd}
                </div>
              </div>
              <Badge variant={pack.isActive ? "default" : "secondary"}>
                {pack.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
