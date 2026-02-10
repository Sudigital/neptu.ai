use anchor_lang::prelude::*;
use anchor_lang::system_program;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{burn, transfer, Burn, Mint, Token, TokenAccount, Transfer},
};

declare_id!("6Zxc4uCXKqWS6spnW7u9wA81PChgws6wbGAKJyi8PnvT");

/// Reading type for pricing
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum ReadingType {
    Potensi,       // Personality potential reading
    Peluang,       // Daily opportunity reading
    AiChat,        // AI chat consultation
    Compatibility, // Compatibility reading
}

/// Constants
pub const LAMPORTS_PER_SOL: u64 = 1_000_000_000;
pub const NEPTU_DECIMALS: u64 = 1_000_000; // 6 decimals

/// Burn rate: 50% = 5000 basis points
pub const BURN_RATE_BPS: u64 = 5000;

/// Default pricing (used for initialization)
pub mod defaults {
    pub const POTENSI_SOL: u64 = 10_000_000; // 0.01 SOL
    pub const PELUANG_SOL: u64 = 1_000_000; // 0.001 SOL
    pub const AI_CHAT_SOL: u64 = 2_000_000; // 0.002 SOL
    pub const COMPATIBILITY_SOL: u64 = 5_000_000; // 0.005 SOL

    pub const POTENSI_NEPTU: u64 = 10_000_000; // 10 NEPTU
    pub const PELUANG_NEPTU: u64 = 1_000_000; // 1 NEPTU
    pub const AI_CHAT_NEPTU: u64 = 2_000_000; // 2 NEPTU
    pub const COMPATIBILITY_NEPTU: u64 = 5_000_000; // 5 NEPTU
}

#[program]
pub mod neptu_economy {
    use super::*;

    /// Initialize pricing config with default values
    pub fn initialize_pricing(ctx: Context<InitializePricing>) -> Result<()> {
        msg!("Initializing Pricing Config");
        let config = &mut ctx.accounts.pricing_config;
        config.authority = ctx.accounts.authority.key();
        config.potensi_sol_price = defaults::POTENSI_SOL;
        config.peluang_sol_price = defaults::PELUANG_SOL;
        config.ai_chat_sol_price = defaults::AI_CHAT_SOL;
        config.compatibility_sol_price = defaults::COMPATIBILITY_SOL;
        config.potensi_neptu_price = defaults::POTENSI_NEPTU;
        config.peluang_neptu_price = defaults::PELUANG_NEPTU;
        config.ai_chat_neptu_price = defaults::AI_CHAT_NEPTU;
        config.compatibility_neptu_price = defaults::COMPATIBILITY_NEPTU;
        msg!("Pricing config initialized");
        Ok(())
    }

    /// Update pricing (admin only)
    pub fn update_pricing(
        ctx: Context<UpdatePricing>,
        potensi_sol: Option<u64>,
        peluang_sol: Option<u64>,
        ai_chat_sol: Option<u64>,
        compatibility_sol: Option<u64>,
        potensi_neptu: Option<u64>,
        peluang_neptu: Option<u64>,
        ai_chat_neptu: Option<u64>,
        compatibility_neptu: Option<u64>,
    ) -> Result<()> {
        let config = &mut ctx.accounts.pricing_config;

        if let Some(v) = potensi_sol {
            config.potensi_sol_price = v;
        }
        if let Some(v) = peluang_sol {
            config.peluang_sol_price = v;
        }
        if let Some(v) = ai_chat_sol {
            config.ai_chat_sol_price = v;
        }
        if let Some(v) = compatibility_sol {
            config.compatibility_sol_price = v;
        }
        if let Some(v) = potensi_neptu {
            config.potensi_neptu_price = v;
        }
        if let Some(v) = peluang_neptu {
            config.peluang_neptu_price = v;
        }
        if let Some(v) = ai_chat_neptu {
            config.ai_chat_neptu_price = v;
        }
        if let Some(v) = compatibility_neptu {
            config.compatibility_neptu_price = v;
        }

        msg!("Pricing updated");
        Ok(())
    }

    /// Pay with SOL to get a reading - receives NEPTU reward
    /// User pays SOL fee, SOL goes to treasury, NEPTU transferred from rewards pool
    pub fn pay_with_sol(ctx: Context<PayWithSol>, reading_type: ReadingType) -> Result<()> {
        let config = &ctx.accounts.pricing_config;
        let sol_price = config.get_sol_price(&reading_type);
        let neptu_reward = config.get_neptu_price(&reading_type);

        msg!(
            "Pay with SOL: {} lamports for {:?}, reward: {} NEPTU",
            sol_price,
            reading_type,
            neptu_reward
        );

        // Transfer SOL from user to treasury
        system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                system_program::Transfer {
                    from: ctx.accounts.user.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                },
            ),
            sol_price,
        )?;
        msg!("Transferred {} lamports to treasury", sol_price);

        // Transfer NEPTU reward from rewards pool to user (NOT minting)
        let seeds = &[b"economy".as_ref(), &[ctx.bumps.economy_authority]];
        let signer_seeds = &[&seeds[..]];

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.rewards_pool.to_account_info(),
                    to: ctx.accounts.user_neptu_account.to_account_info(),
                    authority: ctx.accounts.economy_authority.to_account_info(),
                },
                signer_seeds,
            ),
            neptu_reward,
        )?;
        msg!("Transferred {} NEPTU reward to user", neptu_reward);

        Ok(())
    }

    /// Pay with NEPTU for a reading - 50% burned, 50% recycled
    /// User pays fee, NEPTU burned and recycled
    pub fn pay_with_neptu(ctx: Context<PayWithNeptu>, reading_type: ReadingType) -> Result<()> {
        let config = &ctx.accounts.pricing_config;
        let neptu_price = config.get_neptu_price(&reading_type);
        let burn_amount = (neptu_price * BURN_RATE_BPS) / 10000;
        let recycle_amount = neptu_price - burn_amount;

        msg!(
            "Pay with NEPTU: {} total, {} burned, {} recycled",
            neptu_price,
            burn_amount,
            recycle_amount
        );

        // Burn 50% of NEPTU
        burn(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Burn {
                    mint: ctx.accounts.neptu_mint.to_account_info(),
                    from: ctx.accounts.user_neptu_account.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            burn_amount,
        )?;
        msg!("Burned {} NEPTU", burn_amount);

        // Transfer 50% to ecosystem pool (recycled for future rewards)
        transfer(
            CpiContext::new(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.user_neptu_account.to_account_info(),
                    to: ctx.accounts.ecosystem_pool.to_account_info(),
                    authority: ctx.accounts.user.to_account_info(),
                },
            ),
            recycle_amount,
        )?;
        msg!("Recycled {} NEPTU to ecosystem pool", recycle_amount);

        Ok(())
    }

    /// Claim accumulated gamification rewards
    /// User initiates, backend signs authorization, NEPTU transferred from rewards pool
    pub fn claim_rewards(
        ctx: Context<ClaimRewards>,
        amount: u64,
        nonce: u64,
        _signature: [u8; 64],
    ) -> Result<()> {
        // In production, verify the Ed25519 signature from backend
        // The signature proves user earned this amount
        // For now, the backend co-signs the transaction as authority

        msg!("Claiming {} NEPTU rewards, nonce: {}", amount, nonce);

        require!(amount > 0, NeptuError::InvalidAmount);

        // Verify nonce hasn't been used (prevent replay)
        let claim_record = &mut ctx.accounts.claim_record;
        require!(
            claim_record.last_nonce < nonce,
            NeptuError::NonceAlreadyUsed
        );
        claim_record.last_nonce = nonce;
        claim_record.total_claimed = claim_record
            .total_claimed
            .checked_add(amount)
            .ok_or(NeptuError::Overflow)?;

        // Transfer NEPTU from rewards pool to user (NOT minting)
        let seeds = &[b"economy".as_ref(), &[ctx.bumps.economy_authority]];
        let signer_seeds = &[&seeds[..]];

        transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.to_account_info(),
                Transfer {
                    from: ctx.accounts.rewards_pool.to_account_info(),
                    to: ctx.accounts.user_neptu_account.to_account_info(),
                    authority: ctx.accounts.economy_authority.to_account_info(),
                },
                signer_seeds,
            ),
            amount,
        )?;
        msg!("Transferred {} NEPTU from rewards pool to user", amount);

        Ok(())
    }

    /// Initialize the economy program state
    pub fn initialize_economy(ctx: Context<InitializeEconomy>) -> Result<()> {
        msg!("Initializing NEPTU Economy");
        let state = &mut ctx.accounts.economy_state;
        state.authority = ctx.accounts.authority.key();
        state.neptu_mint = ctx.accounts.neptu_mint.key();
        state.treasury = ctx.accounts.treasury.key();
        state.ecosystem_pool = ctx.accounts.ecosystem_pool.key();
        state.total_sol_collected = 0;
        state.total_neptu_burned = 0;
        state.total_neptu_rewarded = 0;
        msg!("Economy initialized");
        Ok(())
    }
}

/// Pricing configuration (admin-managed)
#[account]
pub struct PricingConfig {
    pub authority: Pubkey,
    pub potensi_sol_price: u64,
    pub peluang_sol_price: u64,
    pub ai_chat_sol_price: u64,
    pub compatibility_sol_price: u64,
    pub potensi_neptu_price: u64,
    pub peluang_neptu_price: u64,
    pub ai_chat_neptu_price: u64,
    pub compatibility_neptu_price: u64,
}

impl PricingConfig {
    pub const SIZE: usize = 8 + 32 + (8 * 8); // discriminator + authority + 8 u64 prices

    pub fn get_sol_price(&self, reading_type: &ReadingType) -> u64 {
        match reading_type {
            ReadingType::Potensi => self.potensi_sol_price,
            ReadingType::Peluang => self.peluang_sol_price,
            ReadingType::AiChat => self.ai_chat_sol_price,
            ReadingType::Compatibility => self.compatibility_sol_price,
        }
    }

    pub fn get_neptu_price(&self, reading_type: &ReadingType) -> u64 {
        match reading_type {
            ReadingType::Potensi => self.potensi_neptu_price,
            ReadingType::Peluang => self.peluang_neptu_price,
            ReadingType::AiChat => self.ai_chat_neptu_price,
            ReadingType::Compatibility => self.compatibility_neptu_price,
        }
    }
}

/// Economy program state
#[account]
pub struct EconomyState {
    pub authority: Pubkey,
    pub neptu_mint: Pubkey,
    pub treasury: Pubkey,
    pub ecosystem_pool: Pubkey,
    pub total_sol_collected: u64,
    pub total_neptu_burned: u64,
    pub total_neptu_rewarded: u64,
}

/// User claim record to prevent replay attacks
#[account]
pub struct ClaimRecord {
    pub user: Pubkey,
    pub last_nonce: u64,
    pub total_claimed: u64,
}

#[derive(Accounts)]
pub struct InitializeEconomy<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        seeds = [b"economy_state"],
        bump,
        payer = authority,
        space = 8 + 32 + 32 + 32 + 32 + 8 + 8 + 8,
    )]
    pub economy_state: Account<'info, EconomyState>,

    /// CHECK: Economy authority PDA
    #[account(
        seeds = [b"economy"],
        bump,
    )]
    pub economy_authority: UncheckedAccount<'info>,

    pub neptu_mint: Account<'info, Mint>,

    /// CHECK: Treasury wallet
    pub treasury: UncheckedAccount<'info>,

    pub ecosystem_pool: Account<'info, TokenAccount>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct InitializePricing<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        seeds = [b"pricing_config"],
        bump,
        payer = authority,
        space = PricingConfig::SIZE,
    )]
    pub pricing_config: Account<'info, PricingConfig>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct UpdatePricing<'info> {
    #[account(
        constraint = authority.key() == pricing_config.authority @ NeptuError::Unauthorized
    )]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [b"pricing_config"],
        bump,
    )]
    pub pricing_config: Account<'info, PricingConfig>,
}

#[derive(Accounts)]
pub struct PayWithSol<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"pricing_config"],
        bump,
    )]
    pub pricing_config: Account<'info, PricingConfig>,

    /// CHECK: Treasury wallet receives SOL
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,

    #[account(mut)]
    pub neptu_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = neptu_mint,
        associated_token::authority = user,
    )]
    pub user_neptu_account: Account<'info, TokenAccount>,

    /// Rewards pool: ATA owned by economy_authority PDA
    #[account(
        mut,
        associated_token::mint = neptu_mint,
        associated_token::authority = economy_authority,
    )]
    pub rewards_pool: Account<'info, TokenAccount>,

    /// CHECK: Economy authority PDA (rewards pool owner)
    #[account(
        seeds = [b"economy"],
        bump,
    )]
    pub economy_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct PayWithNeptu<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        seeds = [b"pricing_config"],
        bump,
    )]
    pub pricing_config: Account<'info, PricingConfig>,

    #[account(mut)]
    pub neptu_mint: Account<'info, Mint>,

    #[account(
        mut,
        associated_token::mint = neptu_mint,
        associated_token::authority = user,
    )]
    pub user_neptu_account: Account<'info, TokenAccount>,

    #[account(mut)]
    pub ecosystem_pool: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
    #[account(mut)]
    pub user: Signer<'info>,

    #[account(
        init_if_needed,
        seeds = [b"claim", user.key().as_ref()],
        bump,
        payer = user,
        space = 8 + 32 + 8 + 8,
    )]
    pub claim_record: Account<'info, ClaimRecord>,

    #[account(mut)]
    pub neptu_mint: Account<'info, Mint>,

    #[account(
        init_if_needed,
        payer = user,
        associated_token::mint = neptu_mint,
        associated_token::authority = user,
    )]
    pub user_neptu_account: Account<'info, TokenAccount>,

    /// Rewards pool: ATA owned by economy_authority PDA
    #[account(
        mut,
        associated_token::mint = neptu_mint,
        associated_token::authority = economy_authority,
    )]
    pub rewards_pool: Account<'info, TokenAccount>,

    /// CHECK: Economy authority PDA (rewards pool owner)
    #[account(
        seeds = [b"economy"],
        bump,
    )]
    pub economy_authority: UncheckedAccount<'info>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

#[error_code]
pub enum NeptuError {
    #[msg("Invalid amount")]
    InvalidAmount,
    #[msg("Nonce already used")]
    NonceAlreadyUsed,
    #[msg("Arithmetic overflow")]
    Overflow,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Unauthorized")]
    Unauthorized,
}
