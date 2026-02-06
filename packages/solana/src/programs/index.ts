// NEPTU Program SDK using @solana/kit
// Pure @solana/kit implementation - no legacy @solana/web3.js

import {
  address,
  type Address,
  getAddressEncoder,
  getAddressDecoder,
  getProgramDerivedAddress,
  getUtf8Encoder,
  type Instruction,
  type AccountRole,
  getU64Encoder,
  getU64Decoder,
  getStructDecoder,
  type ReadonlyUint8Array,
  AccountRole as AccountRoleEnum,
} from "@solana/kit";
import type { SolanaRpc } from "../client";
import type { NetworkType, ReadingType } from "@neptu/shared";

// ============================================================================
// PROGRAM IDS (update after deploy to devnet/mainnet)
// ============================================================================

export const PROGRAM_IDS = {
  localnet: {
    token: address("7JDw4pncZg6g7ezhQSNxKhj3ptT62okgttDjLL4TwqHW"),
    economy: address("6Zxc4uCXKqWS6spnW7u9wA81PChgws6wbGAKJyi8PnvT"),
  },
  devnet: {
    token: address("7JDw4pncZg6g7ezhQSNxKhj3ptT62okgttDjLL4TwqHW"),
    economy: address("6Zxc4uCXKqWS6spnW7u9wA81PChgws6wbGAKJyi8PnvT"),
  },
  mainnet: {
    token: address("7JDw4pncZg6g7ezhQSNxKhj3ptT62okgttDjLL4TwqHW"),
    economy: address("6Zxc4uCXKqWS6spnW7u9wA81PChgws6wbGAKJyi8PnvT"),
  },
} as const;

// ============================================================================
// WELL-KNOWN PROGRAM ADDRESSES
// ============================================================================

export const SYSTEM_PROGRAM = address("11111111111111111111111111111111");
export const TOKEN_PROGRAM = address(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
);
export const ASSOCIATED_TOKEN_PROGRAM = address(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);
export const TOKEN_METADATA_PROGRAM = address(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);
export const RENT_SYSVAR = address(
  "SysvarRent111111111111111111111111111111111",
);

// ============================================================================
// READING TYPE CONVERSION (shared -> Rust enum index)
// ============================================================================

// Maps shared ReadingType (UPPERCASE) to Rust enum index
const READING_TYPE_TO_INDEX: Record<ReadingType, number> = {
  POTENSI: 0,
  PELUANG: 1,
  AI_CHAT: 2,
  COMPATIBILITY: 3,
};

function getReadingTypeIndex(readingType: ReadingType): number {
  return READING_TYPE_TO_INDEX[readingType];
}

// Anchor discriminators (first 8 bytes of sha256("global:<instruction_name>"))
const DISCRIMINATORS = {
  // neptu_economy instructions
  initializePricing: new Uint8Array([175, 175, 109, 31, 13, 152, 155, 237]),
  updatePricing: new Uint8Array([93, 119, 38, 193, 53, 92, 85, 171]),
  payWithSol: new Uint8Array([197, 17, 1, 143, 91, 139, 88, 220]),
  payWithNeptu: new Uint8Array([156, 36, 200, 161, 119, 115, 155, 242]),
  claimRewards: new Uint8Array([4, 144, 132, 71, 116, 23, 151, 80]),
  initializeEconomy: new Uint8Array([190, 133, 245, 21, 62, 129, 54, 248]),
  // neptu_token instructions
  initialize: new Uint8Array([175, 175, 109, 31, 13, 152, 155, 237]),
  mintInitialSupply: new Uint8Array([156, 88, 81, 196, 28, 73, 133, 139]),
  transferMintAuthority: new Uint8Array([147, 122, 53, 121, 77, 200, 38, 241]),
};

export interface NeptuPrograms {
  network: NetworkType;
  tokenProgramId: Address;
  economyProgramId: Address;
  mintPda: Address;
  metadataPda: Address;
  economyAuthorityPda: Address;
  economyStatePda: Address;
  pricingConfigPda: Address;
}

export interface PricingConfig {
  authority: Address;
  potensiSolPrice: bigint;
  peluangSolPrice: bigint;
  aiChatSolPrice: bigint;
  compatibilitySolPrice: bigint;
  potensiNeptuPrice: bigint;
  peluangNeptuPrice: bigint;
  aiChatNeptuPrice: bigint;
  compatibilityNeptuPrice: bigint;
}

export interface EconomyState {
  authority: Address;
  neptuMint: Address;
  treasury: Address;
  ecosystemPool: Address;
  totalSolCollected: bigint;
  totalNeptuBurned: bigint;
  totalNeptuRewarded: bigint;
}

// ============================================================================
// PDA DERIVATION HELPERS
// ============================================================================

async function derivePda(
  seeds: (string | Uint8Array)[],
  programId: Address,
): Promise<Address> {
  const encoder = getUtf8Encoder();
  const seedBuffers = seeds.map((s) =>
    typeof s === "string" ? encoder.encode(s) : s,
  );

  const [pda] = await getProgramDerivedAddress({
    programAddress: programId,
    seeds: seedBuffers as ReadonlyUint8Array[],
  });

  return pda;
}

async function deriveMetadataPda(mint: Address): Promise<Address> {
  const encoder = getUtf8Encoder();
  const addressEncoder = getAddressEncoder();

  const [pda] = await getProgramDerivedAddress({
    programAddress: TOKEN_METADATA_PROGRAM,
    seeds: [
      encoder.encode("metadata"),
      addressEncoder.encode(TOKEN_METADATA_PROGRAM),
      addressEncoder.encode(mint),
    ],
  });

  return pda;
}

export async function deriveAssociatedTokenAddress(
  owner: Address,
  mint: Address,
): Promise<Address> {
  const addressEncoder = getAddressEncoder();

  const [ata] = await getProgramDerivedAddress({
    programAddress: ASSOCIATED_TOKEN_PROGRAM,
    seeds: [
      addressEncoder.encode(owner),
      addressEncoder.encode(TOKEN_PROGRAM),
      addressEncoder.encode(mint),
    ],
  });

  return ata;
}

export async function deriveClaimRecordPda(
  user: Address,
  programId: Address,
): Promise<Address> {
  const encoder = getUtf8Encoder();
  const addressEncoder = getAddressEncoder();

  const [pda] = await getProgramDerivedAddress({
    programAddress: programId,
    seeds: [encoder.encode("claim"), addressEncoder.encode(user)],
  });

  return pda;
}

// ============================================================================
// CREATE NEPTU PROGRAMS CONTEXT
// ============================================================================

export async function createNeptuPrograms(
  network: NetworkType = "devnet",
): Promise<NeptuPrograms> {
  const programIds = PROGRAM_IDS[network];

  const mintPda = await derivePda(["mint"], programIds.token);
  const metadataPda = await deriveMetadataPda(mintPda);
  const economyAuthorityPda = await derivePda(["economy"], programIds.economy);
  const economyStatePda = await derivePda(
    ["economy_state"],
    programIds.economy,
  );
  const pricingConfigPda = await derivePda(
    ["pricing_config"],
    programIds.economy,
  );

  return {
    network,
    tokenProgramId: programIds.token,
    economyProgramId: programIds.economy,
    mintPda,
    metadataPda,
    economyAuthorityPda,
    economyStatePda,
    pricingConfigPda,
  };
}

// ============================================================================
// ACCOUNT META HELPER
// ============================================================================

interface AccountMeta {
  address: Address;
  role: AccountRole;
}

function createAccountMeta(
  pubkey: Address,
  options: { isSigner?: boolean; isWritable?: boolean } = {},
): AccountMeta {
  const { isSigner = false, isWritable = false } = options;
  // Determine role based on signer and writable flags
  let role: AccountRole;
  if (isSigner && isWritable) {
    role = AccountRoleEnum.WRITABLE_SIGNER;
  } else if (isSigner) {
    role = AccountRoleEnum.READONLY_SIGNER;
  } else if (isWritable) {
    role = AccountRoleEnum.WRITABLE;
  } else {
    role = AccountRoleEnum.READONLY;
  }
  return { address: pubkey, role };
}

// ============================================================================
// INSTRUCTION BUILDERS
// ============================================================================

export function buildPayWithSolInstruction(
  programs: NeptuPrograms,
  user: Address,
  treasury: Address,
  userNeptuAccount: Address,
  readingType: ReadingType,
): Instruction {
  const data = new Uint8Array(9);
  data.set(DISCRIMINATORS.payWithSol, 0);
  data[8] = getReadingTypeIndex(readingType);

  return {
    programAddress: programs.economyProgramId,
    accounts: [
      createAccountMeta(user, { isSigner: true, isWritable: true }),
      createAccountMeta(programs.pricingConfigPda),
      createAccountMeta(treasury, { isWritable: true }),
      createAccountMeta(programs.mintPda, { isWritable: true }),
      createAccountMeta(userNeptuAccount, { isWritable: true }),
      createAccountMeta(programs.economyAuthorityPda),
      createAccountMeta(TOKEN_PROGRAM),
      createAccountMeta(ASSOCIATED_TOKEN_PROGRAM),
      createAccountMeta(SYSTEM_PROGRAM),
    ],
    data,
  };
}

export function buildPayWithNeptuInstruction(
  programs: NeptuPrograms,
  user: Address,
  userNeptuAccount: Address,
  ecosystemPool: Address,
  readingType: ReadingType,
): Instruction {
  const data = new Uint8Array(9);
  data.set(DISCRIMINATORS.payWithNeptu, 0);
  data[8] = getReadingTypeIndex(readingType);

  return {
    programAddress: programs.economyProgramId,
    accounts: [
      createAccountMeta(user, { isSigner: true }),
      createAccountMeta(programs.pricingConfigPda),
      createAccountMeta(programs.mintPda, { isWritable: true }),
      createAccountMeta(userNeptuAccount, { isWritable: true }),
      createAccountMeta(ecosystemPool, { isWritable: true }),
      createAccountMeta(TOKEN_PROGRAM),
    ],
    data,
  };
}

export function buildClaimRewardsInstruction(
  programs: NeptuPrograms,
  user: Address,
  userNeptuAccount: Address,
  claimRecordPda: Address,
  amount: bigint,
  nonce: bigint,
  signature: Uint8Array = new Uint8Array(64),
): Instruction {
  // Build instruction data: discriminator + amount(u64) + nonce(u64) + signature(64 bytes)
  const data = new Uint8Array(8 + 8 + 8 + 64);
  data.set(DISCRIMINATORS.claimRewards, 0);

  const u64Encoder = getU64Encoder();
  data.set(u64Encoder.encode(amount), 8);
  data.set(u64Encoder.encode(nonce), 16);
  data.set(signature, 24);

  return {
    programAddress: programs.economyProgramId,
    accounts: [
      createAccountMeta(user, { isSigner: true, isWritable: true }),
      createAccountMeta(claimRecordPda, { isWritable: true }),
      createAccountMeta(programs.mintPda, { isWritable: true }),
      createAccountMeta(userNeptuAccount, { isWritable: true }),
      createAccountMeta(programs.economyAuthorityPda),
      createAccountMeta(TOKEN_PROGRAM),
      createAccountMeta(ASSOCIATED_TOKEN_PROGRAM),
      createAccountMeta(SYSTEM_PROGRAM),
    ],
    data,
  };
}

// ============================================================================
// ACCOUNT FETCHING
// ============================================================================

export async function getPricingConfig(
  rpc: SolanaRpc,
  programs: NeptuPrograms,
): Promise<PricingConfig | null> {
  try {
    const accountInfo = await rpc
      .getAccountInfo(programs.pricingConfigPda, { encoding: "base64" })
      .send();

    if (!accountInfo.value?.data) {
      return null;
    }

    const data =
      typeof accountInfo.value.data === "string"
        ? Buffer.from(accountInfo.value.data, "base64")
        : Buffer.from(
            (accountInfo.value.data as [string, string])[0],
            "base64",
          );

    // Skip 8-byte discriminator
    const decoder = getStructDecoder([
      ["authority", getAddressDecoder()],
      ["potensiSolPrice", getU64Decoder()],
      ["peluangSolPrice", getU64Decoder()],
      ["aiChatSolPrice", getU64Decoder()],
      ["compatibilitySolPrice", getU64Decoder()],
      ["potensiNeptuPrice", getU64Decoder()],
      ["peluangNeptuPrice", getU64Decoder()],
      ["aiChatNeptuPrice", getU64Decoder()],
      ["compatibilityNeptuPrice", getU64Decoder()],
    ]);

    const config = decoder.decode(data.subarray(8));
    return config as PricingConfig;
  } catch {
    return null;
  }
}

export async function getEconomyState(
  rpc: SolanaRpc,
  programs: NeptuPrograms,
): Promise<EconomyState | null> {
  try {
    const accountInfo = await rpc
      .getAccountInfo(programs.economyStatePda, { encoding: "base64" })
      .send();

    if (!accountInfo.value?.data) {
      return null;
    }

    const data =
      typeof accountInfo.value.data === "string"
        ? Buffer.from(accountInfo.value.data, "base64")
        : Buffer.from(
            (accountInfo.value.data as [string, string])[0],
            "base64",
          );

    // Skip 8-byte discriminator
    const decoder = getStructDecoder([
      ["authority", getAddressDecoder()],
      ["neptuMint", getAddressDecoder()],
      ["treasury", getAddressDecoder()],
      ["ecosystemPool", getAddressDecoder()],
      ["totalSolCollected", getU64Decoder()],
      ["totalNeptuBurned", getU64Decoder()],
      ["totalNeptuRewarded", getU64Decoder()],
    ]);

    const state = decoder.decode(data.subarray(8));
    return state as EconomyState;
  } catch {
    return null;
  }
}
