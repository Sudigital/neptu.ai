export const PERSON_CATEGORIES = [
  "world_leader",
  "influencer",
  "entrepreneur",
  "central_banker",
  "investor",
  "billionaire",
] as const;

export type PersonCategory = (typeof PERSON_CATEGORIES)[number];

export const PERSON_CATEGORY_LABELS: Record<PersonCategory, string> = {
  world_leader: "World Leader",
  influencer: "Influencer",
  entrepreneur: "Entrepreneur",
  central_banker: "Central Banker",
  investor: "Investor",
  billionaire: "Billionaire",
} as const;

export const PERSON_TAGS = [
  "tech",
  "ai",
  "crypto",
  "blockchain",
  "defi",
  "energy",
  "oil_gas",
  "ev",
  "renewable",
  "finance",
  "banking",
  "asset_management",
  "hedge_fund",
  "venture_capital",
  "private_equity",
  "ecommerce",
  "cloud",
  "social_media",
  "luxury",
  "semiconductor",
  "telecom",
  "healthcare",
  "manufacturing",
  "real_estate",
  "media",
  "space",
  "defense",
  "politics",
  "monetary_policy",
  "fiscal_policy",
] as const;

export type PersonTag = (typeof PERSON_TAGS)[number];

export const PERSON_TAG_LABELS: Record<PersonTag, string> = {
  tech: "Tech",
  ai: "AI",
  crypto: "Crypto",
  blockchain: "Blockchain",
  defi: "DeFi",
  energy: "Energy",
  oil_gas: "Oil & Gas",
  ev: "EV",
  renewable: "Renewable",
  finance: "Finance",
  banking: "Banking",
  asset_management: "Asset Mgmt",
  hedge_fund: "Hedge Fund",
  venture_capital: "VC",
  private_equity: "PE",
  ecommerce: "E-Commerce",
  cloud: "Cloud",
  social_media: "Social Media",
  luxury: "Luxury",
  semiconductor: "Semiconductor",
  telecom: "Telecom",
  healthcare: "Healthcare",
  manufacturing: "Manufacturing",
  real_estate: "Real Estate",
  media: "Media",
  space: "Space",
  defense: "Defense",
  politics: "Politics",
  monetary_policy: "Monetary Policy",
  fiscal_policy: "Fiscal Policy",
} as const;

export const PERSON_SOURCES = [
  "wikidata",
  "famous_birthdays",
  "forbes",
  "wikipedia",
  "manual",
] as const;

export type PersonSource = (typeof PERSON_SOURCES)[number];

export const PERSON_STATUS = ["active", "inactive", "pending_review"] as const;

export type PersonStatus = (typeof PERSON_STATUS)[number];

export const PERSON_GENDERS = ["M", "F", "O"] as const;

export type PersonGender = (typeof PERSON_GENDERS)[number];

export const PERSON_GENDER_LABELS: Record<PersonGender, string> = {
  M: "Male",
  F: "Female",
  O: "Other",
} as const;

export const PERSON_LIMITS = {
  MAX_NAME_LENGTH: 200,
  MAX_LAST_NAME_LENGTH: 100,
  MAX_SLUG_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_NATIONALITY_LENGTH: 100,
  MAX_TITLE_LENGTH: 300,
  MAX_CITY_LENGTH: 100,
  MAX_STATE_LENGTH: 100,
  MAX_BIOS: 10,
  MAX_BIO_LENGTH: 1000,
  MAX_ABOUTS: 10,
  MAX_ABOUT_LENGTH: 500,
  MAX_INDUSTRIES: 5,
  MAX_INDUSTRY_LENGTH: 100,
  MAX_CATEGORIES_PER_PERSON: 5,
  MAX_TAGS_PER_PERSON: 10,
  MAX_POPULARITY: 1000,
  CRAWLER_BATCH_SIZE: 50,
  CRAWLER_DELAY_MS: 2000,
} as const;

export const WIKIDATA_CATEGORY_QUERIES: Record<PersonCategory, string[]> = {
  world_leader: [
    "Q11696", // president
    "Q4164871", // prime minister
    "Q166382", // head of state
    "Q2285706", // head of government
  ],
  influencer: [
    "Q28389950", // social media influencer (Wikidata class)
    "Q947873", // internet celebrity
  ],
  entrepreneur: [
    "Q131524", // entrepreneur
    "Q43845", // businessperson
    "Q484876", // chief executive officer
  ],
  central_banker: [
    "Q125054", // central bank governor
    "Q3368517", // finance minister
  ],
  investor: [
    "Q688666", // hedge fund manager
    "Q484876", // CEO (filtered by investor keywords)
    "Q43845", // businessperson (filtered by investor keywords)
  ],
  billionaire: [
    "Q43845", // businessperson
    "Q131524", // entrepreneur
    "Q484876", // chief executive officer
    "Q806798", // chairperson
  ],
} as const;
