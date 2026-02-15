import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export function FeatureFlagsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Feature Flags</CardTitle>
        <CardDescription>Platform feature toggles</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span>Oracle AI</span>
          <Badge className="bg-green-500">Enabled</Badge>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span>P2P Trading</span>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <span>Staking</span>
          <Badge variant="secondary">Coming Soon</Badge>
        </div>
      </CardContent>
    </Card>
  );
}
