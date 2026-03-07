import type { PersonDTO } from "@neptu/drizzle-orm";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getPersonality,
  getProsperityPeriods,
  PERSON_CATEGORY_LABELS,
  PERSON_GENDER_LABELS,
  PERSON_TAG_LABELS,
  type PersonCategory,
  type PersonGender,
  type PersonTag,
} from "@neptu/shared";
import { NeptuCalculator } from "@neptu/wariga";
import { Building2, ExternalLink, Globe, User } from "lucide-react";

import {
  NeptuTabContent,
  Section,
  StatRow,
  WealthTabContent,
} from "./world-economic-detail-tabs";
import {
  calculateAge,
  getProsperityWithFallback,
  getTotalUrip,
} from "./world-economic-parts";

/* ── Calculator singleton ────────────────────────────── */

let _calc: NeptuCalculator | null = null;
function getCalc(): NeptuCalculator {
  if (!_calc) _calc = new NeptuCalculator();
  return _calc;
}

/* ── Helpers ─────────────────────────────────────────── */

function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function getCategoryLabel(key: string): string {
  return PERSON_CATEGORY_LABELS[key as PersonCategory] ?? key;
}

function getTagLabel(key: string): string {
  return PERSON_TAG_LABELS[key as PersonTag] ?? key;
}

function getGenderLabel(g: string | null): string {
  if (!g) return "Unknown";
  return PERSON_GENDER_LABELS[g as PersonGender] ?? g;
}

/* ── Detail Sheet ────────────────────────────────────── */

interface PersonDetailSheetProps {
  person: PersonDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PersonDetailSheet({
  person,
  open,
  onOpenChange,
}: PersonDetailSheetProps) {
  if (!person) return null;

  const age = calculateAge(person.birthday);
  const totalUrip = getTotalUrip(person);
  const calc = getCalc();
  const birthDate = new Date(person.birthday);
  const today = new Date();

  /* Neptu calculations */
  let potensi = null;
  try {
    potensi = calc.calculatePotensi(birthDate);
  } catch {
    /* skip */
  }

  let peluang = null;
  try {
    peluang = calc.calculatePeluang(today, birthDate);
  } catch {
    /* skip */
  }

  let compatibility = null;
  try {
    compatibility = calc.calculateCompatibility(birthDate, today);
  } catch {
    /* skip */
  }

  const prosperity =
    totalUrip !== null && age !== null
      ? getProsperityWithFallback(totalUrip, age)
      : null;

  const personality = totalUrip !== null ? getPersonality(totalUrip) : null;

  const prosperityPeriods =
    totalUrip !== null ? getProsperityPeriods(totalUrip) : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-lg">
        <SheetHeader className="pb-0">
          {/* Person Header */}
          <div className="flex items-start gap-3">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage
                src={person.thumbnailUrl ?? person.imageUrl ?? undefined}
                alt={person.name}
              />
              <AvatarFallback className="text-sm font-bold">
                {getInitials(person.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <SheetTitle className="text-base leading-tight">
                {person.name}
              </SheetTitle>
              <SheetDescription className="mt-0.5 text-xs">
                {person.title ?? "—"}
              </SheetDescription>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {person.categories.map((c) => (
                  <Badge key={c} variant="outline" className="text-[10px]">
                    {getCategoryLabel(c)}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <Tabs defaultValue="profile" className="mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="profile" className="text-xs">
                Profile
              </TabsTrigger>
              <TabsTrigger value="neptu" className="text-xs">
                Neptu
              </TabsTrigger>
              <TabsTrigger value="prosperity" className="text-xs">
                Wealth
              </TabsTrigger>
            </TabsList>

            {/* ── Profile Tab ─────────────────────────── */}
            <TabsContent value="profile" className="mt-4 space-y-5">
              <Section title="Personal Info" icon={User}>
                <div className="space-y-0.5 rounded-md border p-3">
                  <StatRow label="Birthday" value={person.birthday} />
                  {age !== null && <StatRow label="Age" value={age} />}
                  <StatRow
                    label="Gender"
                    value={getGenderLabel(person.gender)}
                  />
                  {person.nationality && (
                    <StatRow label="Nationality" value={person.nationality} />
                  )}
                  {(person.city ?? person.state) && (
                    <StatRow
                      label="Location"
                      value={[person.city, person.state]
                        .filter(Boolean)
                        .join(", ")}
                    />
                  )}
                  <StatRow label="Source" value={person.source} />
                </div>
              </Section>

              {/* Industries */}
              {person.industries && person.industries.length > 0 && (
                <Section title="Industries" icon={Building2}>
                  <div className="flex flex-wrap gap-1">
                    {person.industries.map((ind) => (
                      <Badge
                        key={ind}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {ind}
                      </Badge>
                    ))}
                  </div>
                </Section>
              )}

              {/* Tags */}
              {person.tags.length > 0 && (
                <Section title="Tags" icon={Globe}>
                  <div className="flex flex-wrap gap-1">
                    {(person.tags as PersonTag[]).map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-[10px]"
                      >
                        {getTagLabel(tag)}
                      </Badge>
                    ))}
                  </div>
                </Section>
              )}

              {/* Bio */}
              {person.bios && person.bios.length > 0 && (
                <Section title="Biography" icon={User}>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {person.bios.map((bio, i) => (
                      <p key={i}>{bio}</p>
                    ))}
                  </div>
                </Section>
              )}

              {/* About */}
              {person.abouts && person.abouts.length > 0 && (
                <Section title="About" icon={User}>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    {person.abouts.map((about, i) => (
                      <p key={i}>{about}</p>
                    ))}
                  </div>
                </Section>
              )}

              {/* Links */}
              {(person.wikipediaUrl ?? person.sourceUrl) && (
                <Section title="Links" icon={ExternalLink}>
                  <div className="flex flex-col gap-1">
                    {person.wikipediaUrl && (
                      <a
                        href={person.wikipediaUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline-offset-4 hover:underline"
                      >
                        Wikipedia →
                      </a>
                    )}
                    {person.sourceUrl && (
                      <a
                        href={person.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-primary underline-offset-4 hover:underline"
                      >
                        Source →
                      </a>
                    )}
                  </div>
                </Section>
              )}
            </TabsContent>

            {/* ── Neptu Tab ───────────────────────────── */}
            <TabsContent value="neptu" className="mt-4">
              <NeptuTabContent
                potensi={potensi}
                peluang={peluang}
                compatibility={compatibility}
                personality={personality}
              />
            </TabsContent>

            {/* ── Wealth & Prosperity Tab ─────────────── */}
            <TabsContent value="prosperity" className="mt-4">
              <WealthTabContent
                netWorthBillions={person.netWorthBillions}
                forbesRank={person.forbesRank}
                prosperity={prosperity}
                prosperityPeriods={prosperityPeriods}
                age={age}
                potensiUrip={potensi?.total_urip ?? null}
                peluangUrip={peluang?.total_urip ?? null}
              />
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
