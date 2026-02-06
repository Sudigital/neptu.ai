import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, Flame, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRICING, type ReadingType, type PaymentType } from "@neptu/shared";

interface PaymentToggleProps {
  readingType: ReadingType;
  onPaymentSelect: (type: PaymentType, amount: number) => void;
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PaymentToggle({
  readingType,
  onPaymentSelect,
  isLoading = false,
  disabled = false,
  className,
}: PaymentToggleProps) {
  const [selected, setSelected] = useState<PaymentType>("sol");

  const pricing = PRICING[readingType];

  const handleSelect = (type: PaymentType) => {
    setSelected(type);
  };

  const handlePay = () => {
    const amount = selected === "sol" ? pricing.SOL : pricing.NEPTU;
    onPaymentSelect(selected, amount);
  };

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {/* Payment method toggle */}
      <div className="flex gap-2">
        <Button
          variant={selected === "sol" ? "default" : "outline"}
          onClick={() => handleSelect("sol")}
          disabled={disabled || isLoading}
          className="flex-1 gap-2"
        >
          <Coins className="h-4 w-4" />
          <span>Pay with SOL</span>
          <Badge variant="secondary" className="ml-auto">
            {pricing.SOL} SOL
          </Badge>
        </Button>
        <Button
          variant={selected === "neptu" ? "default" : "outline"}
          onClick={() => handleSelect("neptu")}
          disabled={disabled || isLoading}
          className="flex-1 gap-2"
        >
          <Flame className="h-4 w-4 text-orange-500" />
          <span>Pay with NEPTU</span>
          <Badge variant="secondary" className="ml-auto">
            {pricing.NEPTU} NEPTU
          </Badge>
        </Button>
      </div>

      {/* Reward/burn info */}
      <div className="text-sm text-muted-foreground">
        {selected === "sol" ? (
          <p className="flex items-center gap-1">
            <span className="text-green-500">
              +{pricing.NEPTU_REWARD} NEPTU
            </span>{" "}
            reward on successful payment
          </p>
        ) : (
          <p className="flex items-center gap-1">
            <span className="text-orange-500">{pricing.NEPTU * 0.5} NEPTU</span>{" "}
            will be burned (deflationary)
          </p>
        )}
      </div>

      {/* Pay button */}
      <Button
        onClick={handlePay}
        disabled={disabled || isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Pay{" "}
            {selected === "sol"
              ? `${pricing.SOL} SOL`
              : `${pricing.NEPTU} NEPTU`}
          </>
        )}
      </Button>
    </div>
  );
}
