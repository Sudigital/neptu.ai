import { useEffect, useState } from "react";
import { Calendar, Sparkles, Gift, Cake, Clock, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useTranslate } from "@/hooks/use-translate";
import {
  type CryptoWithMarketData,
  formatCurrency,
  formatFullDate,
  formatPercentage,
  getAge,
  getAgeInDays,
  getDaysUntilBirthday,
  isBirthdayToday,
} from "./crypto-utils";
import { SupplyDonutChart, CosmicScoreDonut } from "./donut-charts";

export function BirthdayTab({ crypto }: { crypto: CryptoWithMarketData }) {
  const t = useTranslate();
  const age = getAge(crypto.birthday);
  const ageInDays = getAgeInDays(crypto.birthday);
  const isBirthday = isBirthdayToday(crypto.birthday);
  const daysUntilBirthday = getDaysUntilBirthday(crypto.birthday);

  return (
    <>
      {/* Age & Countdown - 2 column */}
      <div
        className={`grid ${isBirthday ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2"} gap-4 items-stretch`}
      >
        {/* Age Display (Left) */}
        <Card
          className={isBirthday ? "border-primary ring-2 ring-primary/20" : ""}
        >
          <CardContent className="text-center">
            {isBirthday && (
              <div className="mb-4 text-4xl animate-bounce">🎂</div>
            )}
            <div className="flex items-center justify-center gap-2 mb-2">
              <Cake className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-lg">
                {isBirthday
                  ? t("crypto.birthday.happyBirthday")
                  : t("crypto.birthday.age")}
              </h4>
            </div>
            <p className="text-5xl font-bold text-primary mb-2">{age}</p>
            <p className="text-muted-foreground">
              {t("crypto.birthday.yearsOld")} • {ageInDays.toLocaleString()}{" "}
              {t("crypto.birthday.days")}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              <Calendar className="h-3 w-3 inline mr-1" />
              {t("crypto.birthday.born")} {formatFullDate(crypto.birthday)}
            </p>
          </CardContent>
        </Card>

        {/* Birthday Countdown (Right) */}
        {!isBirthday && (
          <BirthdayCountdownCard
            daysUntilBirthday={daysUntilBirthday}
            birthday={crypto.birthday}
          />
        )}
      </div>

      {/* Cosmic Birthday Info */}
      {crypto.cosmicAlignment && (
        <Card>
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <h4 className="font-semibold text-lg">
                {t("crypto.birthday.cosmicProfile")}
              </h4>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">
                  {t("crypto.birthday.dayName")}
                </p>
                <p className="font-semibold">
                  {crypto.cosmicAlignment.dayName}
                </p>
              </div>
              <div className="rounded-lg bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">
                  {t("crypto.birthday.wuku")}
                </p>
                <p className="font-semibold">{crypto.cosmicAlignment.wuku}</p>
              </div>
              <div className="rounded-lg bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">
                  {t("crypto.birthday.pancaWara")}
                </p>
                <p className="font-semibold">
                  {crypto.cosmicAlignment.pancaWara}
                </p>
              </div>
              <div className="rounded-lg bg-primary/5 p-3">
                <p className="text-xs text-muted-foreground">
                  {t("crypto.birthday.saptaWara")}
                </p>
                <p className="font-semibold">
                  {crypto.cosmicAlignment.saptaWara}
                </p>
              </div>
            </div>
            <div className="mt-4 p-3 rounded-lg bg-primary/5">
              <p className="text-sm italic text-muted-foreground">
                "{crypto.cosmicAlignment.cosmicMessage}"
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}

function BirthdayCountdownCard({
  daysUntilBirthday,
  birthday,
}: {
  daysUntilBirthday: number;
  birthday: string;
}) {
  const t = useTranslate();
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    function calcTimeLeft() {
      const now = new Date();
      const bDate = new Date(birthday);
      const nextBday = new Date(
        now.getFullYear(),
        bDate.getMonth(),
        bDate.getDate(),
      );
      if (nextBday <= now) nextBday.setFullYear(nextBday.getFullYear() + 1);
      const diff = nextBday.getTime() - now.getTime();
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);
      setTimeLeft({ hours, minutes, seconds });
    }
    calcTimeLeft();
    const interval = setInterval(calcTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [birthday]);

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <Card className="h-full">
      <CardContent className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Gift className="h-5 w-5 text-primary" />
          <h4 className="font-semibold text-lg">
            {t("crypto.birthday.countdown")}
          </h4>
        </div>
        <div className="flex items-center justify-center gap-1 mt-3 font-mono text-2xl font-bold text-primary/80">
          <div className="flex flex-col items-center">
            <span className="bg-primary/10 rounded px-2 py-1">
              {daysUntilBirthday}
            </span>
            <span className="text-[10px] font-normal text-muted-foreground mt-1">
              {t("crypto.birthday.days")}
            </span>
          </div>
          <span className="animate-pulse mb-5">:</span>
          <div className="flex flex-col items-center">
            <span className="bg-primary/10 rounded px-2 py-1">
              {pad(timeLeft.hours)}
            </span>
            <span className="text-[10px] font-normal text-muted-foreground mt-1">
              hrs
            </span>
          </div>
          <span className="animate-pulse mb-5">:</span>
          <div className="flex flex-col items-center">
            <span className="bg-primary/10 rounded px-2 py-1">
              {pad(timeLeft.minutes)}
            </span>
            <span className="text-[10px] font-normal text-muted-foreground mt-1">
              min
            </span>
          </div>
          <span className="animate-pulse mb-5">:</span>
          <div className="flex flex-col items-center">
            <span className="bg-primary/10 rounded px-2 py-1">
              {pad(timeLeft.seconds)}
            </span>
            <span className="text-[10px] font-normal text-muted-foreground mt-1">
              sec
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function MarketTab({ crypto }: { crypto: CryptoWithMarketData }) {
  const t = useTranslate();

  return (
    <>
      {/* Supply Info - Donut Chart */}
      <SupplyDonutChart crypto={crypto} />

      {/* Volume & Activity */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-lg">
              {t("crypto.market.activity")}
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                {t("crypto.market.24hVolume")}
              </p>
              <p className="text-lg font-bold">
                {formatCurrency(crypto.totalVolume)}
              </p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <p className="text-xs text-muted-foreground">
                {t("crypto.market.24hChange")}
              </p>
              <p
                className={`text-lg font-bold ${(crypto.priceChangePercentage24h ?? 0) >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {formatPercentage(crypto.priceChangePercentage24h)}
              </p>
            </div>
          </div>
          {crypto.lastUpdated && (
            <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t("crypto.market.lastUpdated")}:{" "}
              {new Date(crypto.lastUpdated).toLocaleString()}
            </p>
          )}
        </CardContent>
      </Card>
    </>
  );
}

export function CosmicTab({ crypto }: { crypto: CryptoWithMarketData }) {
  const t = useTranslate();

  if (!crypto.cosmicAlignment) {
    return (
      <Card>
        <CardContent className="text-center">
          <Sparkles className="h-10 w-10 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">{t("crypto.cosmic.noData")}</p>
        </CardContent>
      </Card>
    );
  }

  const { alignmentScore, cosmicMessage, dayName, pancaWara, saptaWara, wuku } =
    crypto.cosmicAlignment;

  return (
    <>
      {/* Alignment Score - Donut */}
      <Card className="border-primary/50">
        <CardContent className="text-center">
          <Sparkles className="h-8 w-8 text-primary mx-auto mb-3" />
          <h4 className="font-semibold text-lg mb-2">
            {t("crypto.cosmic.alignmentScore")}
          </h4>
          <CosmicScoreDonut alignmentScore={alignmentScore} />
          <p className="mt-3 text-sm italic text-muted-foreground">
            "{cosmicMessage}"
          </p>
        </CardContent>
      </Card>

      {/* Wuku Cycle */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-lg">
              {t("crypto.cosmic.wukuCycle")}
            </h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg bg-primary/5 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {t("crypto.cosmic.dayName")}
              </p>
              <p className="text-xl font-bold text-primary">{dayName}</p>
            </div>
            <div className="rounded-lg bg-primary/5 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {t("crypto.cosmic.wuku")}
              </p>
              <p className="text-xl font-bold text-primary">{wuku}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Panca & Sapta Wara */}
      <Card>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary" />
            <h4 className="font-semibold text-lg">
              {t("crypto.cosmic.waraSystem")}
            </h4>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-amber-500/10 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {t("crypto.cosmic.pancaWara")}
              </p>
              <p className="text-lg font-bold text-amber-600">{pancaWara}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("crypto.cosmic.fiveDayCycle")}
              </p>
            </div>
            <div className="rounded-lg bg-violet-500/10 p-4 text-center">
              <p className="text-xs text-muted-foreground mb-1">
                {t("crypto.cosmic.saptaWara")}
              </p>
              <p className="text-lg font-bold text-violet-600">{saptaWara}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {t("crypto.cosmic.sevenDayCycle")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
