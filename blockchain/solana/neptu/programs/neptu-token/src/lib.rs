use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    metadata::{
        create_metadata_accounts_v3, mpl_token_metadata::types::DataV2, CreateMetadataAccountsV3,
        Metadata,
    },
    token::{mint_to, Mint, MintTo, Token, TokenAccount},
};

declare_id!("7JDw4pncZg6g7ezhQSNxKhj3ptT62okgttDjLL4TwqHW");

/// NEPTU Token Constants
pub const TOKEN_NAME: &str = "Neptu";
pub const TOKEN_SYMBOL: &str = "NEPTU";
pub const TOKEN_URI: &str = "https://neptu.io/token-metadata.json";
pub const TOKEN_DECIMALS: u8 = 6;
pub const TOTAL_SUPPLY: u64 = 1_000_000_000_000_000; // 1B with 6 decimals

/// Allocation percentages (basis points, 10000 = 100%)
pub const ECOSYSTEM_BPS: u64 = 5500; // 55%
pub const TREASURY_BPS: u64 = 2500; // 25%
pub const TEAM_BPS: u64 = 1500; // 15%
pub const RESERVE_BPS: u64 = 500; // 5%

#[program]
pub mod neptu_token {
    use super::*;

    /// Initialize the NEPTU token mint with metadata
    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Initializing NEPTU Token");

        let seeds = &[b"mint".as_ref(), &[ctx.bumps.mint]];
        let signer_seeds = &[&seeds[..]];

        create_metadata_accounts_v3(
            CpiContext::new_with_signer(
                ctx.accounts.token_metadata_program.to_account_info(),
                CreateMetadataAccountsV3 {
                    metadata: ctx.accounts.metadata.to_account_info(),
                    mint: ctx.accounts.mint.to_account_info(),
                    mint_authority: ctx.accounts.mint.to_account_info(),
                    payer: ctx.accounts.payer.to_account_info(),
                    update_authority: ctx.accounts.mint.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                    rent: ctx.accounts.rent.to_account_info(),
                },
                signer_seeds,
            ),
            DataV2 {
                name: TOKEN_NAME.to_string(),
                symbol: TOKEN_SYMBOL.to_string(),
                uri: TOKEN_URI.to_string(),
                seller_fee_basis_points: 0,
                creators: None,
                collection: None,
                uses: None,
            },
            true,
            true,
            None,
        )?;

        msg!("NEPTU Token initialized successfully");
        Ok(())
    }

    /// Mint initial token allocation to distribution accounts
    pub fn mint_initial_supply(ctx: Context<MintInitialSupply>) -> Result<()> {
        msg!("Minting initial NEPTU supply");

        let seeds = &[b"mint".as_ref(), &[ctx.bumps.mint]];
        let signer_seeds = &[&seeds[..]];

        // Calculate allocations
        let ecosystem_amount = (TOTAL_SUPPLY * ECOSYSTEM_BPS) / 10000;
        let treasury_amount = (TOTAL_SUPPLY * TREASURY_BPS) / 10000;
        let team_amount = (TOTAL_SUPPLY * TEAM_BPS) / 10000;
        let reserve_amount = (TOTAL_SUPPLY * RESERVE_BPS) / 10000;

        // Mint to ecosystem pool (55%)
        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.ecosystem_pool.to_account_info(),
                    authority: ctx.accounts.mint.to_account_info(),
                },
                signer_seeds,
            ),
            ecosystem_amount,
        )?;
        msg!("Minted {} to ecosystem pool", ecosystem_amount);

        // Mint to treasury (25%)
        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                    authority: ctx.accounts.mint.to_account_info(),
                },
                signer_seeds,
            ),
            treasury_amount,
        )?;
        msg!("Minted {} to treasury", treasury_amount);

        // Mint to team (15%)
        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.team.to_account_info(),
                    authority: ctx.accounts.mint.to_account_info(),
                },
                signer_seeds,
            ),
            team_amount,
        )?;
        msg!("Minted {} to team", team_amount);

        // Mint to reserve (5%)
        mint_to(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                MintTo {
                    mint: ctx.accounts.mint.to_account_info(),
                    to: ctx.accounts.reserve.to_account_info(),
                    authority: ctx.accounts.mint.to_account_info(),
                },
                signer_seeds,
            ),
            reserve_amount,
        )?;
        msg!("Minted {} to reserve", reserve_amount);

        msg!("Initial supply minted successfully");
        Ok(())
    }

    /// Transfer mint authority to the economy program PDA
    pub fn transfer_mint_authority(ctx: Context<TransferMintAuthority>) -> Result<()> {
        msg!("Transferring mint authority to economy program");

        let seeds = &[b"mint".as_ref(), &[ctx.bumps.mint]];
        let signer_seeds = &[&seeds[..]];

        anchor_spl::token::set_authority(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                anchor_spl::token::SetAuthority {
                    current_authority: ctx.accounts.mint.to_account_info(),
                    account_or_mint: ctx.accounts.mint.to_account_info(),
                },
                signer_seeds,
            ),
            anchor_spl::token::spl_token::instruction::AuthorityType::MintTokens,
            Some(ctx.accounts.new_authority.key()),
        )?;

        msg!(
            "Mint authority transferred to {}",
            ctx.accounts.new_authority.key()
        );
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        init,
        seeds = [b"mint"],
        bump,
        payer = payer,
        mint::decimals = TOKEN_DECIMALS,
        mint::authority = mint,
        mint::freeze_authority = mint,
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: Metadata account created via CPI
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub token_metadata_program: Program<'info, Metadata>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct MintInitialSupply<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"mint"],
        bump,
    )]
    pub mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = ecosystem_authority,
    )]
    pub ecosystem_pool: Account<'info, TokenAccount>,

    /// CHECK: Ecosystem pool authority (PDA or wallet)
    pub ecosystem_authority: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = treasury_authority,
    )]
    pub treasury: Account<'info, TokenAccount>,

    /// CHECK: Treasury authority
    pub treasury_authority: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = team_authority,
    )]
    pub team: Account<'info, TokenAccount>,

    /// CHECK: Team authority
    pub team_authority: UncheckedAccount<'info>,

    #[account(
        init_if_needed,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = reserve_authority,
    )]
    pub reserve: Account<'info, TokenAccount>,

    /// CHECK: Reserve authority
    pub reserve_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct TransferMintAuthority<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    #[account(
        mut,
        seeds = [b"mint"],
        bump,
    )]
    pub mint: Account<'info, Mint>,

    /// CHECK: New authority (economy program PDA)
    pub new_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
}
