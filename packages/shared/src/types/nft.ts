// ============================================================================
// NFT Metadata Types (Solana)
// ============================================================================

export interface NeptuSoulAttribute {
  trait_type: string;
  value: string | number;
  display_type?: "number" | "date";
}

export interface NeptuSoulMetadata {
  name: string;
  symbol: string;
  description: string;
  image: string;
  external_url: string;
  attributes: NeptuSoulAttribute[];
}
