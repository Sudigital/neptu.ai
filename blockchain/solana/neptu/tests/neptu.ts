import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NeptuToken } from "../target/types/neptu_token";
import { NeptuEconomy } from "../target/types/neptu_economy";
import {
  Keypair,
  PublicKey,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
  getAccount,
} from "@solana/spl-token";
import { assert } from "chai";

describe("NEPTU Token & Economy", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const tokenProgram = anchor.workspace.NeptuToken as Program<NeptuToken>;
  const economyProgram = anchor.workspace.NeptuEconomy as Program<NeptuEconomy>;

  // PDAs
  let mintPda: PublicKey;
  let mintBump: number;
  let metadataPda: PublicKey;
  let economyAuthorityPda: PublicKey;
  let economyAuthorityBump: number;
  let economyStatePda: PublicKey;
  let pricingConfigPda: PublicKey;

  // Token accounts
  let ecosystemPool: PublicKey;
  let treasury: PublicKey;
  let teamPool: PublicKey;
  let reservePool: PublicKey;

  // Authorities (for testing, use provider wallet)
  const ecosystemAuthority = Keypair.generate();
  const treasuryAuthority = Keypair.generate();
  const teamAuthority = Keypair.generate();
  const reserveAuthority = Keypair.generate();

  // Test user
  const testUser = Keypair.generate();

  // Metaplex Token Metadata Program
  const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
    "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s",
  );

  before(async () => {
    // Derive PDAs
    [mintPda, mintBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("mint")],
      tokenProgram.programId,
    );

    [metadataPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("metadata"),
        TOKEN_METADATA_PROGRAM_ID.toBuffer(),
        mintPda.toBuffer(),
      ],
      TOKEN_METADATA_PROGRAM_ID,
    );

    [economyAuthorityPda, economyAuthorityBump] =
      PublicKey.findProgramAddressSync(
        [Buffer.from("economy")],
        economyProgram.programId,
      );

    [economyStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("economy_state")],
      economyProgram.programId,
    );

    [pricingConfigPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("pricing_config")],
      economyProgram.programId,
    );

    // Derive associated token accounts
    ecosystemPool = await getAssociatedTokenAddress(
      mintPda,
      ecosystemAuthority.publicKey,
    );
    treasury = await getAssociatedTokenAddress(
      mintPda,
      treasuryAuthority.publicKey,
    );
    teamPool = await getAssociatedTokenAddress(
      mintPda,
      teamAuthority.publicKey,
    );
    reservePool = await getAssociatedTokenAddress(
      mintPda,
      reserveAuthority.publicKey,
    );

    // Airdrop SOL to test accounts
    const airdropAmount = 10 * LAMPORTS_PER_SOL;

    await provider.connection.requestAirdrop(testUser.publicKey, airdropAmount);
    await provider.connection.requestAirdrop(
      ecosystemAuthority.publicKey,
      airdropAmount,
    );
    await provider.connection.requestAirdrop(
      treasuryAuthority.publicKey,
      airdropAmount,
    );

    // Wait for airdrops to confirm
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log("=== PDAs ===");
    console.log("Mint PDA:", mintPda.toBase58());
    console.log("Economy Authority PDA:", economyAuthorityPda.toBase58());
    console.log("Economy State PDA:", economyStatePda.toBase58());
    console.log("Pricing Config PDA:", pricingConfigPda.toBase58());
  });

  describe("Token Program", () => {
    it("Initialize NEPTU token mint", async () => {
      const tx = await tokenProgram.methods
        .initialize()
        .accounts({
          payer: provider.wallet.publicKey,
          mint: mintPda,
          metadata: metadataPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
        })
        .rpc();

      console.log("Initialize token tx:", tx);

      // Verify mint exists
      const mintInfo = await provider.connection.getAccountInfo(mintPda);
      assert.isNotNull(mintInfo, "Mint should exist");
    });

    it("Mint initial supply to allocation accounts", async () => {
      const tx = await tokenProgram.methods
        .mintInitialSupply()
        .accounts({
          payer: provider.wallet.publicKey,
          mint: mintPda,
          ecosystemPool,
          ecosystemAuthority: ecosystemAuthority.publicKey,
          treasury,
          treasuryAuthority: treasuryAuthority.publicKey,
          team: teamPool,
          teamAuthority: teamAuthority.publicKey,
          reserve: reservePool,
          reserveAuthority: reserveAuthority.publicKey,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Mint initial supply tx:", tx);

      // Verify balances
      const ecosystemAccount = await getAccount(
        provider.connection,
        ecosystemPool,
      );
      const treasuryAccount = await getAccount(provider.connection, treasury);
      const teamAccount = await getAccount(provider.connection, teamPool);
      const reserveAccount = await getAccount(provider.connection, reservePool);

      const TOTAL_SUPPLY = BigInt(1_000_000_000_000_000); // 1B with 6 decimals
      const expectedEcosystem = (TOTAL_SUPPLY * BigInt(5500)) / BigInt(10000); // 55%
      const expectedTreasury = (TOTAL_SUPPLY * BigInt(2500)) / BigInt(10000); // 25%
      const expectedTeam = (TOTAL_SUPPLY * BigInt(1500)) / BigInt(10000); // 15%
      const expectedReserve = (TOTAL_SUPPLY * BigInt(500)) / BigInt(10000); // 5%

      console.log("Ecosystem balance:", ecosystemAccount.amount.toString());
      console.log("Treasury balance:", treasuryAccount.amount.toString());
      console.log("Team balance:", teamAccount.amount.toString());
      console.log("Reserve balance:", reserveAccount.amount.toString());

      assert.equal(
        ecosystemAccount.amount.toString(),
        expectedEcosystem.toString(),
        "Ecosystem should have 55%",
      );
      assert.equal(
        treasuryAccount.amount.toString(),
        expectedTreasury.toString(),
        "Treasury should have 25%",
      );
      assert.equal(
        teamAccount.amount.toString(),
        expectedTeam.toString(),
        "Team should have 15%",
      );
      assert.equal(
        reserveAccount.amount.toString(),
        expectedReserve.toString(),
        "Reserve should have 5%",
      );
    });

    it("Transfer mint authority to economy program", async () => {
      const tx = await tokenProgram.methods
        .transferMintAuthority()
        .accounts({
          payer: provider.wallet.publicKey,
          mint: mintPda,
          newAuthority: economyAuthorityPda,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("Transfer mint authority tx:", tx);
    });
  });

  describe("Economy Program", () => {
    it("Initialize pricing config", async () => {
      const tx = await economyProgram.methods
        .initializePricing()
        .accounts({
          authority: provider.wallet.publicKey,
          pricingConfig: pricingConfigPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Initialize pricing tx:", tx);

      // Verify config
      const config =
        await economyProgram.account.pricingConfig.fetch(pricingConfigPda);
      assert.equal(
        config.authority.toBase58(),
        provider.wallet.publicKey.toBase58(),
      );
      assert.equal(config.potensiSolPrice.toNumber(), 10_000_000); // 0.01 SOL
      assert.equal(config.potensiNeptuPrice.toNumber(), 10_000_000); // 10 NEPTU
    });

    it("Initialize economy state", async () => {
      const tx = await economyProgram.methods
        .initializeEconomy()
        .accounts({
          authority: provider.wallet.publicKey,
          economyState: economyStatePda,
          economyAuthority: economyAuthorityPda,
          neptuMint: mintPda,
          treasury: treasuryAuthority.publicKey,
          ecosystemPool,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("Initialize economy tx:", tx);

      const state =
        await economyProgram.account.economyState.fetch(economyStatePda);
      assert.equal(
        state.authority.toBase58(),
        provider.wallet.publicKey.toBase58(),
      );
      assert.equal(state.neptuMint.toBase58(), mintPda.toBase58());
    });

    it("Pay with SOL - receive NEPTU reward", async () => {
      const userNeptuAccount = await getAssociatedTokenAddress(
        mintPda,
        testUser.publicKey,
      );

      const treasurySolBefore = await provider.connection.getBalance(
        treasuryAuthority.publicKey,
      );

      const tx = await economyProgram.methods
        .payWithSol({ potensi: {} }) // ReadingType::Potensi
        .accounts({
          user: testUser.publicKey,
          pricingConfig: pricingConfigPda,
          treasury: treasuryAuthority.publicKey,
          neptuMint: mintPda,
          userNeptuAccount,
          economyAuthority: economyAuthorityPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([testUser])
        .rpc();

      console.log("Pay with SOL tx:", tx);

      // Verify SOL transferred to treasury
      const treasurySolAfter = await provider.connection.getBalance(
        treasuryAuthority.publicKey,
      );
      assert.equal(
        treasurySolAfter - treasurySolBefore,
        10_000_000, // 0.01 SOL
        "Treasury should receive 0.01 SOL",
      );

      // Verify NEPTU received
      const userAccount = await getAccount(
        provider.connection,
        userNeptuAccount,
      );
      assert.equal(
        userAccount.amount.toString(),
        "10000000", // 10 NEPTU
        "User should receive 10 NEPTU",
      );
    });

    it("Pay with NEPTU - 50% burn, 50% recycle", async () => {
      const userNeptuAccount = await getAssociatedTokenAddress(
        mintPda,
        testUser.publicKey,
      );

      const userBalanceBefore = (
        await getAccount(provider.connection, userNeptuAccount)
      ).amount;
      const ecosystemBalanceBefore = (
        await getAccount(provider.connection, ecosystemPool)
      ).amount;

      // Pay for Peluang reading (1 NEPTU)
      const tx = await economyProgram.methods
        .payWithNeptu({ peluang: {} }) // ReadingType::Peluang
        .accounts({
          user: testUser.publicKey,
          pricingConfig: pricingConfigPda,
          neptuMint: mintPda,
          userNeptuAccount,
          ecosystemPool,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([testUser])
        .rpc();

      console.log("Pay with NEPTU tx:", tx);

      const userBalanceAfter = (
        await getAccount(provider.connection, userNeptuAccount)
      ).amount;
      const ecosystemBalanceAfter = (
        await getAccount(provider.connection, ecosystemPool)
      ).amount;

      // User paid 1 NEPTU (1_000_000 raw)
      const userPaid = userBalanceBefore - userBalanceAfter;
      assert.equal(userPaid.toString(), "1000000", "User should pay 1 NEPTU");

      // Ecosystem received 50% (0.5 NEPTU = 500_000 raw)
      const ecosystemReceived = ecosystemBalanceAfter - ecosystemBalanceBefore;
      assert.equal(
        ecosystemReceived.toString(),
        "500000",
        "Ecosystem should receive 0.5 NEPTU (50% recycled)",
      );

      // 50% was burned (verified by total supply reduction - can check mint supply)
    });

    it("Update pricing (admin only)", async () => {
      // Update Potensi price to 0.015 SOL, 15 NEPTU
      const tx = await economyProgram.methods
        .updatePricing(
          new anchor.BN(15_000_000), // potensi_sol: 0.015 SOL
          null, // peluang_sol: unchanged
          null, // ai_chat_sol: unchanged
          null, // compatibility_sol: unchanged
          new anchor.BN(15_000_000), // potensi_neptu: 15 NEPTU
          null, // peluang_neptu: unchanged
          null, // ai_chat_neptu: unchanged
          null, // compatibility_neptu: unchanged
        )
        .accounts({
          authority: provider.wallet.publicKey,
          pricingConfig: pricingConfigPda,
        })
        .rpc();

      console.log("Update pricing tx:", tx);

      const config =
        await economyProgram.account.pricingConfig.fetch(pricingConfigPda);
      assert.equal(config.potensiSolPrice.toNumber(), 15_000_000);
      assert.equal(config.potensiNeptuPrice.toNumber(), 15_000_000);
      // Others unchanged
      assert.equal(config.peluangSolPrice.toNumber(), 1_000_000);
    });

    it("Claim rewards", async () => {
      const userNeptuAccount = await getAssociatedTokenAddress(
        mintPda,
        testUser.publicKey,
      );
      const [claimRecordPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("claim"), testUser.publicKey.toBuffer()],
        economyProgram.programId,
      );

      const balanceBefore = (
        await getAccount(provider.connection, userNeptuAccount)
      ).amount;

      // Claim 5 NEPTU with nonce 1
      const claimAmount = new anchor.BN(5_000_000); // 5 NEPTU
      const nonce = new anchor.BN(1);
      const signature = new Array(64).fill(0); // Dummy signature for hackathon

      const tx = await economyProgram.methods
        .claimRewards(claimAmount, nonce, signature)
        .accounts({
          user: testUser.publicKey,
          claimRecord: claimRecordPda,
          neptuMint: mintPda,
          userNeptuAccount,
          economyAuthority: economyAuthorityPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([testUser])
        .rpc();

      console.log("Claim rewards tx:", tx);

      const balanceAfter = (
        await getAccount(provider.connection, userNeptuAccount)
      ).amount;
      const claimed = balanceAfter - balanceBefore;
      assert.equal(claimed.toString(), "5000000", "Should claim 5 NEPTU");

      // Verify claim record
      const claimRecord =
        await economyProgram.account.claimRecord.fetch(claimRecordPda);
      assert.equal(claimRecord.lastNonce.toNumber(), 1);
      assert.equal(claimRecord.totalClaimed.toNumber(), 5_000_000);
    });

    it("Reject replay attack (same nonce)", async () => {
      const userNeptuAccount = await getAssociatedTokenAddress(
        mintPda,
        testUser.publicKey,
      );
      const [claimRecordPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("claim"), testUser.publicKey.toBuffer()],
        economyProgram.programId,
      );

      const claimAmount = new anchor.BN(5_000_000);
      const nonce = new anchor.BN(1); // Same nonce as before
      const signature = new Array(64).fill(0);

      try {
        await economyProgram.methods
          .claimRewards(claimAmount, nonce, signature)
          .accounts({
            user: testUser.publicKey,
            claimRecord: claimRecordPda,
            neptuMint: mintPda,
            userNeptuAccount,
            economyAuthority: economyAuthorityPda,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([testUser])
          .rpc();
        assert.fail("Should have thrown error");
      } catch (err) {
        assert.include(err.toString(), "NonceAlreadyUsed");
        console.log("✓ Replay attack correctly rejected");
      }
    });

    it("Reject unauthorized pricing update", async () => {
      try {
        await economyProgram.methods
          .updatePricing(
            new anchor.BN(1),
            null,
            null,
            null,
            null,
            null,
            null,
            null,
          )
          .accounts({
            authority: testUser.publicKey, // Not the admin
            pricingConfig: pricingConfigPda,
          })
          .signers([testUser])
          .rpc();
        assert.fail("Should have thrown error");
      } catch (err) {
        assert.include(err.toString(), "Unauthorized");
        console.log("✓ Unauthorized update correctly rejected");
      }
    });
  });
});
