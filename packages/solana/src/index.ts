export {
  createSolanaClient,
  getBalance,
  getLatestBlockhash,
  confirmTransaction,
  type SolanaClient,
  type SolanaRpc,
  type SolanaRpcSubscriptions,
} from "./client";

export {
  LAMPORTS_PER_SOL,
  TOKEN_DECIMALS_MULTIPLIER,
  DEVNET_ADDRESSES,
  MAINNET_ADDRESSES,
  getAddresses,
  getRpcUrl,
  solToLamports,
  lamportsToSol,
  neptuToRaw,
  rawToNeptu,
  type NeptuAddresses,
} from "./constants";

export {
  getTokenBalance,
  getAssociatedTokenAddress,
  calculateSolPaymentReward,
  calculateNeptuPaymentBurn,
  getReadingPrice,
  type TokenAccount,
  type TokenBalance,
  type RewardCalculation,
  type BurnCalculation,
} from "./token";

export {
  verifyTransaction,
  waitForConfirmation,
  type TransactionVerification,
} from "./verification";

// NEPTU Program SDK (pure @solana/kit)
export {
  // Program IDs & well-known addresses
  PROGRAM_IDS,
  SYSTEM_PROGRAM,
  TOKEN_PROGRAM,
  ASSOCIATED_TOKEN_PROGRAM,
  TOKEN_METADATA_PROGRAM,
  RENT_SYSVAR,
  // Program context
  createNeptuPrograms,
  // PDA helpers
  deriveAssociatedTokenAddress,
  deriveClaimRecordPda,
  // Instruction builders
  buildPayWithSolInstruction,
  buildPayWithNeptuInstruction,
  buildClaimRewardsInstruction,
  // Account fetching
  getPricingConfig,
  getEconomyState,
  // Types
  type NeptuPrograms,
  type PricingConfig,
  type EconomyState,
} from "./programs";

// Re-export useful @solana/kit types
export { type Address, type Instruction, address } from "@solana/kit";

// Re-export ReadingType from shared (single source of truth)
export type { ReadingType } from "@neptu/shared";
