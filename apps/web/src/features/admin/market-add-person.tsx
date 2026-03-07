import type { PersonDTO } from "@neptu/drizzle-orm";
import type { MarketAsset } from "@neptu/shared";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  PERSON_CATEGORIES,
  PERSON_CATEGORY_LABELS,
  PERSON_TAGS,
  PERSON_TAG_LABELS,
  type PersonCategory,
  type PersonTag,
} from "@neptu/shared";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  Check,
  Loader2,
  Plus,
  Sparkles,
  UserPlus,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { adminApi } from "./admin-api";

/* ── Constants ───────────────────────────────────────── */

const NAME_PATTERN = /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)+)\b/g;

const COMMON_NON_NAMES = new Set([
  "United States",
  "New York",
  "Wall Street",
  "White House",
  "Middle East",
  "North America",
  "South Korea",
  "Hong Kong",
  "Federal Reserve",
  "World Economic",
  "Breaking News",
  "Latest News",
  "Bitcoin Price",
  "Spot Bitcoin",
  "Bitcoin ETF",
  "This Week",
  "Here What",
  "Real Test",
  "Last Month",
  "Last Week",
  "Digital Gold",
  "Rising Tensions",
  "Market Anxiety",
  "Losing Streak",
  "Monthly Decline",
  "Definitive Stalemate",
  "Global Diplomacy",
  "Bank Secrecy",
  "Accounting Standards",
]);

const MAX_SUGGESTED_NAMES = 10;
const INITIAL_CATEGORIES: PersonCategory[] = ["influencer"];

/* ── Name Extraction ─────────────────────────────────── */

export interface ExtractedName {
  name: string;
  headline: string;
  alreadyExists: boolean;
}

export function extractPersonNames(
  topic: MarketAsset,
  existingPersons: PersonDTO[]
): ExtractedName[] {
  const existingNames = new Set(
    existingPersons.map((p) => p.name.toLowerCase())
  );

  const nameMap = new Map<string, string>();

  for (const headline of topic.recentHeadlines) {
    const matches = headline.matchAll(NAME_PATTERN);
    for (const match of matches) {
      const name = match[1].trim();
      if (COMMON_NON_NAMES.has(name)) continue;
      if (name.split(" ").length < 2) continue;
      if (!nameMap.has(name.toLowerCase())) {
        nameMap.set(name.toLowerCase(), name);
      }
    }
  }

  return Array.from(nameMap.entries())
    .slice(0, MAX_SUGGESTED_NAMES)
    .map(([key, name]) => ({
      name,
      headline: topic.recentHeadlines.find((h) => h.includes(name)) ?? "",
      alreadyExists: existingNames.has(key),
    }));
}

/* ── Add Person Form ─────────────────────────────────── */

interface AddPersonFormProps {
  suggestedName: string;
  suggestedHeadline: string;
  topicName: string;
  onSuccess: () => void;
  onCancel: () => void;
}

function AddPersonForm({
  suggestedName,
  suggestedHeadline,
  topicName,
  onSuccess,
  onCancel,
}: AddPersonFormProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(suggestedName);
  const [birthday, setBirthday] = useState("");
  const [category, setCategory] = useState<PersonCategory>(
    INITIAL_CATEGORIES[0]
  );
  const [selectedTags, setSelectedTags] = useState<PersonTag[]>(
    getInitialTags(topicName)
  );
  const [description, setDescription] = useState(
    `Mentioned in crypto news: "${suggestedHeadline.slice(0, 100)}"`
  );

  const mutation = useMutation({
    mutationFn: () =>
      adminApi.createPerson({
        name,
        birthday,
        categories: [category],
        source: "manual",
        tags: selectedTags,
        description,
        status: "active",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "persons"] });
      onSuccess();
    },
  });

  const toggleTag = useCallback((tag: PersonTag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const isValid =
    name.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(birthday);

  return (
    <div className="space-y-4 rounded-md border bg-muted/30 p-4">
      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" />
        <h4 className="text-sm font-semibold">Add New Person</h4>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="person-name" className="text-xs">
            Full Name
          </Label>
          <Input
            id="person-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Arthur Hayes"
            className="h-8 text-sm"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="person-birthday" className="text-xs">
            Birthday (YYYY-MM-DD) *
          </Label>
          <div className="relative">
            <CalendarDays className="absolute top-1.5 left-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="person-birthday"
              value={birthday}
              onChange={(e) => setBirthday(e.target.value)}
              placeholder="1986-10-18"
              className="h-8 pl-9 text-sm"
            />
          </div>
          <p className="text-[10px] text-muted-foreground">
            Required for Neptu astrology calculation
          </p>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Category</Label>
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as PersonCategory)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERSON_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {PERSON_CATEGORY_LABELS[cat]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs">Tags</Label>
          <div className="flex flex-wrap gap-1">
            {PERSON_TAGS.slice(0, 12).map((tag) => (
              <Badge
                key={tag}
                variant={selectedTags.includes(tag) ? "default" : "outline"}
                className="cursor-pointer text-[10px]"
                onClick={() => toggleTag(tag)}
              >
                {PERSON_TAG_LABELS[tag]}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="person-desc" className="text-xs">
            Description
          </Label>
          <Input
            id="person-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="h-8 text-sm"
          />
        </div>
      </div>

      {mutation.isError && (
        <p className="text-xs text-destructive">
          Failed to add person. Please check the data and try again.
        </p>
      )}

      {mutation.isSuccess && (
        <div className="flex items-center gap-2 text-xs text-green-600">
          <Check className="h-3 w-3" />
          Person added successfully! Neptu data will now be calculated.
        </div>
      )}

      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={!isValid || mutation.isPending || mutation.isSuccess}
          className="h-7 text-xs"
        >
          {mutation.isPending ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <Sparkles className="mr-1 h-3 w-3" />
          )}
          {mutation.isSuccess ? "Added" : "Add & Calculate Neptu"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={onCancel}
          className="h-7 text-xs"
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}

/* ── Suggested Persons ───────────────────────────────── */

interface SuggestedPersonsProps {
  topic: MarketAsset;
  existingPersons: PersonDTO[];
  onPersonAdded: () => void;
}

export function SuggestedPersons({
  topic,
  existingPersons,
  onPersonAdded,
}: SuggestedPersonsProps) {
  const [addingName, setAddingName] = useState<string | null>(null);
  const extracted = useMemo(
    () => extractPersonNames(topic, existingPersons),
    [topic, existingPersons]
  );

  const nonExisting = extracted.filter((e) => !e.alreadyExists);

  if (nonExisting.length === 0 && extracted.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Separator />

      <div className="flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">Persons Detected in Headlines</h3>
      </div>

      <p className="text-xs text-muted-foreground">
        These names were found in the market headlines. Add them to get real
        Neptu astrology analysis.
      </p>

      <div className="space-y-2">
        {extracted.map((item) => (
          <div
            key={item.name}
            className={cn(
              "flex items-center justify-between rounded-md border p-2.5",
              item.alreadyExists && "opacity-50"
            )}
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{item.name}</span>
                {item.alreadyExists && (
                  <Badge variant="secondary" className="text-[10px]">
                    In Database
                  </Badge>
                )}
              </div>
              <p className="truncate text-[10px] text-muted-foreground">
                {item.headline}
              </p>
            </div>

            {!item.alreadyExists && addingName !== item.name && (
              <Button
                size="sm"
                variant="outline"
                className="ml-2 h-7 text-xs"
                onClick={() => setAddingName(item.name)}
              >
                <Plus className="mr-1 h-3 w-3" />
                Add
              </Button>
            )}
          </div>
        ))}
      </div>

      {addingName && (
        <AddPersonForm
          suggestedName={addingName}
          suggestedHeadline={
            extracted.find((e) => e.name === addingName)?.headline ?? ""
          }
          topicName={topic.topic}
          onSuccess={() => {
            setAddingName(null);
            onPersonAdded();
          }}
          onCancel={() => setAddingName(null)}
        />
      )}
    </div>
  );
}

/* ── Helpers ─────────────────────────────────────────── */

function getInitialTags(topicName: string): PersonTag[] {
  const base: PersonTag[] = ["crypto"];
  const topicLower = topicName.toLowerCase();

  if (topicLower === "ai") return [...base, "ai", "tech"];
  if (topicLower === "defi" || topicLower === "ethereum") {
    return [...base, "defi", "blockchain"];
  }
  if (topicLower === "bitcoin" || topicLower === "btc") {
    return [...base, "finance"];
  }
  return base;
}
