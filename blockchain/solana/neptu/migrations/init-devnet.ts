/**
 * NEPTU Devnet Initialization Script
 *
 * Initializes the NEPTU token and economy programs on devnet.
 * This must be run AFTER deploying the programs with `anchor deploy`.
 *
 * Sequence:
 * 1. Initialize NEPTU token mint (creates mint PDA)
 * 2. Mint initial supply to allocation accounts
 * 3. Transfer mint authority to economy program PDA
 * 4. Initialize pricing config
 * 5. Initialize economy state
 *
 * Usage:
 *   cd blockchain/solana/neptu
 *   npx ts-node migrations/init-devnet.ts
 */

import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { NeptuToken } from "../target/types/neptu_token";
import { NeptuEconomy } from "../target/types/neptu_economy";
import {
  Keypair,
  PublicKey,
  Connection,
  clusterApiUrl,
} from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import * as fs from "fs";
import * as path from "path";

// Program IDs (same across all networks)
const TOKEN_PROGRAM_ID_NEPTU = new PublicKey(
  "7JDw4pncZg6g7ezhQSNxKhj3ptT62okgttDjLL4TwqHW",
);
const ECONOMY_PROGRAM_ID = new PublicKey(
  "6Zxc4uCXKqWS6spnW7u9wA81PChgws6wbGAKJyi8PnvT",
);
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
);

// Load IDLs
const tokenIdl = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../target/idl/neptu_token.json"),
    "utf-8",
  ),
);
const economyIdl = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "../target/idl/neptu_economy.json"),
    "utf-8",
  ),
);

async function main() {
  // Load wallet from Anchor config
  const walletPath =
    process.env.ANCHOR_WALLET ||
    `${process.env.HOME}/.config/solana/sudigital-dev.json`;
  const rawKey = JSON.parse(fs.readFileSync(walletPath, "utf-8"));
  const keypair = Keypair.fromSecretKey(new Uint8Array(rawKey));

  console.log("=== NEPTU Devnet Initialization ===");
  console.log("Deployer wallet:", keypair.publicKey.toBase58());

  // Setup connection and provider
  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");
  const wallet = new Wallet(keypair);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  anchor.setProvider(provider);

  // Create program instances (Anchor 0.32 — use provider as 3rd arg)
  const tokenProgram = new Program(tokenIdl, provider) as Program<NeptuToken>;
  const economyProgram = new Program(
    economyIdl,
    provider,
  ) as Program<NeptuEconomy>;

  // Derive PDAs
  const [mintPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("mint")],
    TOKEN_PROGRAM_ID_NEPTU,
  );

  const [metadataPda] = PublicKey.findProgramAddressSync(
    [
      Buffer.from("metadata"),
      TOKEN_METADATA_PROGRAM_ID.toBuffer(),
      mintPda.toBuffer(),
    ],
    TOKEN_METADATA_PROGRAM_ID,
  );

  const [economyAuthorityPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("economy")],
    ECONOMY_PROGRAM_ID,
  );

  const [economyStatePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("economy_state")],
    ECONOMY_PROGRAM_ID,
  );

  const [pricingConfigPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("pricing_config")],
    ECONOMY_PROGRAM_ID,
  );

  console.log("\n=== PDAs ===");
  console.log("Mint PDA:", mintPda.toBase58());
  console.log("Metadata PDA:", metadataPda.toBase58());
  console.log("Economy Authority PDA:", economyAuthorityPda.toBase58());
  console.log("Economy State PDA:", economyStatePda.toBase58());
  console.log("Pricing Config PDA:", pricingConfigPda.toBase58());

  // Use the deployer wallet as authority for all allocation accounts (devnet)
  const ecosystemAuthority = keypair.publicKey;
  const treasuryAuthority = keypair.publicKey;
  const teamAuthority = keypair.publicKey;
  const reserveAuthority = keypair.publicKey;

  // Derive associated token accounts for allocations
  // Since all authorities are the same wallet on devnet, these will all be the same ATA
  const ecosystemPool = await getAssociatedTokenAddress(
    mintPda,
    ecosystemAuthority,
  );
  const treasuryPool = await getAssociatedTokenAddress(
    mintPda,
    treasuryAuthority,
  );
  const teamPool = await getAssociatedTokenAddress(mintPda, teamAuthority);
  const reservePool = await getAssociatedTokenAddress(
    mintPda,
    reserveAuthority,
  );

  console.log("\n=== Token Accounts ===");
  console.log("Ecosystem Pool:", ecosystemPool.toBase58());
  console.log("Treasury:", treasuryPool.toBase58());
  console.log("Team Pool:", teamPool.toBase58());
  console.log("Reserve Pool:", reservePool.toBase58());

  // Check deployer balance
  const balance = await connection.getBalance(keypair.publicKey);
  console.log(
    `\nDeployer SOL balance: ${(balance / 1_000_000_000).toFixed(4)} SOL`,
  );
  if (balance < 0.05 * 1_000_000_000) {
    console.error("ERROR: Insufficient SOL. Need at least 0.05 SOL.");
    console.log("Run: solana airdrop 2 --url devnet");
    process.exit(1);
  }

  // Step 1: Check if mint already exists
  const mintInfo = await connection.getAccountInfo(mintPda);
  if (mintInfo) {
    console.log("\n✓ Mint PDA already initialized, skipping Step 1");
  } else {
    console.log("\n--- Step 1: Initialize NEPTU Token Mint ---");
    try {
      // Anchor 0.32: only pass non-auto-derivable accounts
      // mint → PDA auto-derived, tokenProgram/systemProgram/rent → auto-resolved
      // metadata → UncheckedAccount, must be passed
      const tx = await tokenProgram.methods
        .initialize()
        .accountsPartial({
          payer: keypair.publicKey,
          metadata: metadataPda,
        })
        .rpc();
      console.log("✓ Token mint initialized:", tx);
    } catch (err: any) {
      console.error("✗ Failed to initialize mint:", err.message || err);
      if (err.logs) console.error("Logs:", err.logs.join("\n"));
      process.exit(1);
    }
  }

  // Step 2: Mint initial supply
  const ecosystemPoolInfo = await connection.getAccountInfo(ecosystemPool);
  if (ecosystemPoolInfo) {
    console.log("\n✓ Token accounts already exist, skipping Step 2");
  } else {
    console.log("\n--- Step 2: Mint Initial Supply ---");
    try {
      // ecosystemAuthority, treasuryAuthority, teamAuthority, reserveAuthority
      // are UncheckedAccounts that must be passed
      const tx = await tokenProgram.methods
        .mintInitialSupply()
        .accountsPartial({
          payer: keypair.publicKey,
          ecosystemAuthority,
          treasuryAuthority,
          teamAuthority,
          reserveAuthority,
        })
        .rpc();
      console.log("✓ Initial supply minted:", tx);
    } catch (err: any) {
      console.error("✗ Failed to mint initial supply:", err.message || err);
      if (err.logs) console.error("Logs:", err.logs.join("\n"));
      process.exit(1);
    }
  }

  // Step 3: Transfer mint authority to economy program PDA
  console.log("\n--- Step 3: Transfer Mint Authority to Economy PDA ---");
  try {
    // newAuthority is UncheckedAccount, must be passed
    const tx = await tokenProgram.methods
      .transferMintAuthority()
      .accountsPartial({
        payer: keypair.publicKey,
        newAuthority: economyAuthorityPda,
      })
      .rpc();
    console.log("✓ Mint authority transferred:", tx);
  } catch (err: any) {
    // This might fail if authority was already transferred
    const errStr = JSON.stringify(err.message || err) + JSON.stringify(err.logs || []);
    if (
      errStr.includes("owner does not match") ||
      errStr.includes("mint authority") ||
      errStr.includes("Error processing Instruction") ||
      errStr.includes("custom program error")
    ) {
      console.log("✓ Mint authority already transferred (or error expected), skipping");
    } else {
      console.error(
        "✗ Failed to transfer mint authority:",
        err.message || err,
      );
      if (err.logs) console.error("Logs:", err.logs.join("\n"));
      process.exit(1);
    }
  }

  // Step 4: Initialize pricing config
  const pricingInfo = await connection.getAccountInfo(pricingConfigPda);
  if (pricingInfo) {
    console.log("\n✓ Pricing config already initialized, skipping Step 4");
  } else {
    console.log("\n--- Step 4: Initialize Pricing Config ---");
    try {
      const tx = await economyProgram.methods
        .initializePricing()
        .accountsPartial({
          authority: keypair.publicKey,
        })
        .rpc();
      console.log("✓ Pricing config initialized:", tx);
    } catch (err: any) {
      console.error(
        "✗ Failed to initialize pricing:",
        err.message || err,
      );
      if (err.logs) console.error("Logs:", err.logs.join("\n"));
      process.exit(1);
    }
  }

  // Step 5: Initialize economy state
  const economyStateInfo = await connection.getAccountInfo(economyStatePda);
  if (economyStateInfo) {
    console.log("\n✓ Economy state already initialized, skipping Step 5");
  } else {
    console.log("\n--- Step 5: Initialize Economy State ---");
    try {
      // neptuMint, treasury, ecosystemPool are non-PDA accounts
      const tx = await economyProgram.methods
        .initializeEconomy()
        .accountsPartial({
          authority: keypair.publicKey,
          neptuMint: mintPda,
          treasury: treasuryAuthority,
          ecosystemPool,
        })
        .rpc();
      console.log("✓ Economy state initialized:", tx);
    } catch (err: any) {
      console.error(
        "✗ Failed to initialize economy:",
        err.message || err,
      );
      if (err.logs) console.error("Logs:", err.logs.join("\n"));
      process.exit(1);
    }
  }

  console.log("\n=== Initialization Complete! ===");
  console.log("Mint PDA:", mintPda.toBase58());
  console.log("Economy Authority PDA:", economyAuthorityPda.toBase58());
  console.log("\nClaim rewards should now work on devnet.");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
