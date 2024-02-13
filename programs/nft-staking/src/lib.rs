use anchor_lang::{prelude::*, AnchorDeserialize};

pub mod constant;
pub mod error;
pub mod instructions;
pub mod state;
use constant::*;
use error::*;
use instructions::*;
use state::*;

declare_id!("PLSeoaC7uLWpkbFjUMvF2Er4RXQThdA6T7S9ZY6BqiT");

#[program]
pub mod nft_staking {
    use super::*;

    /**
     * Initialize global pool
     * super admin sets to the caller of this instruction
     */
    pub fn initialize(mut ctx: Context<Initialize>) -> Result<()> {
        Initialize::process_instruction(&mut ctx)
    }

    //  Admin can hand over admin role
    pub fn change_admin(mut ctx: Context<ChangeAdmin>, new_admin: Pubkey) -> Result<()> {
        ChangeAdmin::process_instruction(&mut ctx, new_admin)
    }

    //  Initialize user pool
    pub fn init_user(mut ctx: Context<InitUser>) -> Result<()> {
        InitUser::process_instruction(&mut ctx)
    }

    /**
     * User can unstake pNFTs from specific collection
     */
    pub fn lock_pnft(ctx: Context<LockPNFT>) -> Result<()> {
        lock_pnft::lock_pnft_handler(ctx)
    }

    /**
     * User can unlock pNFTs when they want
     */
    pub fn unlock_pnft(ctx: Context<UnlockPNFT>) -> Result<()> {
        unlock_pnft::unlock_pnft_handler(ctx)
    }
}
