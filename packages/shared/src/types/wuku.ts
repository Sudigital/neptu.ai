// ============================================================================
// Base Types
// ============================================================================

export interface WukuItem {
  value: number;
  name: string;
  urip?: number;
  gender?: string;
}

export interface SaptaWara extends WukuItem {
  urip: number;
  gender: string;
}

export interface PancaWara extends WukuItem {
  urip: number;
  gender: string;
}

export interface SadWara extends WukuItem {
  urip: number;
  gender: string;
}

export interface Wuku extends WukuItem {
  urip: number;
}

export interface TriWara extends WukuItem {}
export interface CaturWara extends WukuItem {}
export interface Cipta extends WukuItem {}
export interface Rasa extends WukuItem {}
export interface Karsa extends WukuItem {}
export interface Tindakan extends WukuItem {}
export interface DasaAksara extends WukuItem {}
export interface Frekuensi extends WukuItem {}
export interface KandaPat extends WukuItem {}
export interface PancaBrahma extends WukuItem {}
export interface PancaTirta extends WukuItem {}
export interface Steps extends WukuItem {}

export interface LahirUntuk {
  name: string;
  description: string;
}

export interface Afirmasi {
  pattern: string;
  name: string;
}

// ============================================================================
// Database Schema
// ============================================================================

export interface NeptuDatabase {
  sapta_wara: SaptaWara[];
  panca_wara: PancaWara[];
  sad_wara: SadWara[];
  wuku: Wuku[];
  tri_wara: TriWara[];
  catur_wara: CaturWara[];
  cipta: Cipta[];
  rasa: Rasa[];
  karsa: Karsa[];
  tindakan: Tindakan[];
  mitra_satru_ning_dina: Frekuensi[];
  mitra_satru_peluang: Frekuensi[];
  kanda_pat: KandaPat[];
  steps: Steps[];
  panca_tirta: PancaTirta[];
  panca_brahma: PancaBrahma[];
  dasa_aksara: DasaAksara[];
  lahir_untuk: LahirUntuk[];
  afirmasi: {
    gender_patterns: Afirmasi[];
  };
}

// ============================================================================
// Reading Types
// ============================================================================

export interface BaseReading {
  date: string;
  sapta_wara: SaptaWara;
  panca_wara: PancaWara;
  wuku: Wuku;
  sad_wara: SadWara;
  total_urip: number;
  full_urip: number;
  c24_urip: number;
  dasa_aksara: DasaAksara;
  panca_brahma: PancaBrahma;
  panca_tirta: PancaTirta;
  frekuensi: Frekuensi;
  gender_pattern: string;
  biner: number;
  dualitas: "YIN" | "YANG";
  siklus: Steps;
  kanda_pat: KandaPat;
  cipta: Cipta;
  rasa: Rasa;
  karsa: Karsa;
  tindakan: Tindakan;
}

export interface Potensi extends BaseReading {
  afirmasi: Afirmasi;
  lahir_untuk: LahirUntuk;
}

export interface Peluang extends BaseReading {
  afirmasi: Afirmasi;
  diberi_hak_untuk: LahirUntuk;
}

export interface FullReading {
  potensi: Potensi;
  peluang: Peluang;
}
