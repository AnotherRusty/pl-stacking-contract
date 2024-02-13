use {
    crate::*,
    anchor_lang::{
        solana_program::program::invoke_signed,
        solana_program::program::invoke, 
        solana_program::instruction::Instruction
    },
    mpl_token_metadata::{
        state::{Metadata, TokenMetadataAccount},
        instruction::{MetadataInstruction, DelegateArgs, LockArgs}
    },
    anchor_spl::token::{Mint, Token, TokenAccount}
};

#[derive(Accounts)]
pub struct LockPNFT<'info> {
    // Need admin sign to lock pNFT
    #[account(
        constraint = global_pool.admin == *admin.key @StakingError::InvalidAdmin
    )]
    pub admin: Signer<'info>,

    #[account(
        seeds = [GLOBAL_AUTHORITY_SEED.as_ref()],
        bump,
    )]
    pub global_pool: Account<'info, GlobalPool>,

    #[account(
        mut, 
        token::mint = token_mint, 
        token::authority = signer,
    )]
    pub token_account: Box<Account<'info, TokenAccount>>,
    pub token_mint: Box<Account<'info, Mint>>,
    /// CHECK instruction will fail if wrong edition is supplied
    pub token_mint_edition: AccountInfo<'info>,
    /// CHECK instruction will fail if wrong record is supplied
    #[account(mut)]
    pub token_mint_record: AccountInfo<'info>,
    /// CHECK instruction will fail if wrong metadata is supplied
    #[account(mut)]
    mint_metadata: UncheckedAccount<'info>,
    /// CHECK instruction will fail if wrong rules are supplied
    pub auth_rules: UncheckedAccount<'info>,
    /// CHECK instruction will fail if wrong sysvar ixns are supplied
    pub sysvar_instructions: AccountInfo<'info>,
    #[account(mut)]
    pub signer: Signer<'info>,

    //  PDA that stores user's stake info
    #[account(
        mut,
        seeds = [signer.key().as_ref(), USER_POOL_SEED.as_ref()],
        bump,
    )]
    pub user_pool: Box<Account<'info, UserPool>>,

    token_program: Program<'info, Token>,
    /// CHECK intstruction will fail if wrong program is supplied
    token_metadata_program: AccountInfo<'info>,
    /// CHECK intstruction will fail if wrong program is supplied
    auth_rules_program: AccountInfo<'info>,
    pub system_program: Program<'info, System>
}

pub fn lock_pnft_handler(ctx: Context<LockPNFT>) -> Result<()> {
    let user_pool = &mut ctx.accounts.user_pool;

    // Verify metadata is legit
    let mint_metadata = &ctx.accounts.mint_metadata;
    let nft_metadata = Metadata::from_account_info(mint_metadata)?;
    
    // Check if this NFT is the wanted collection and verified
    if let Some(creators) = nft_metadata.data.creators {
        let mut valid: u8 = 0;
        for creator in creators {
            if creator.address.to_string() == COLLECTION_ADDRESS {
                valid = 1;
                break;
            }
        }
        require!(valid == 1, StakingError::InvalidCollection);
    } else {
        return Err(error!(StakingError::MetadataCreatorParseError));
    };
    
    let signer = ctx.accounts.signer.key();
    let seeds = &[
        signer.as_ref(),
        USER_POOL_SEED.as_bytes(), 
        &[*ctx.bumps.get("user_pool").unwrap()]
    ];
    let delegate_seeds = &[&seeds[..]];

    invoke(
        &Instruction {
            program_id: mpl_token_metadata::id(),
            accounts: vec![
                // 0. `[writable]` Delegate record account
                AccountMeta::new_readonly(mpl_token_metadata::id(), false),
                // 1. `[]` Delegated owner
                AccountMeta::new_readonly(user_pool.key(), false),
                // 2. `[writable]` Metadata account
                AccountMeta::new(ctx.accounts.mint_metadata.key(), false),
                // 3. `[optional]` Master Edition account
                AccountMeta::new_readonly(ctx.accounts.token_mint_edition.key(), false),
                // 4. `[]` Token record
                AccountMeta::new(ctx.accounts.token_mint_record.key(), false),
                // 5. `[]` Mint account
                AccountMeta::new_readonly(ctx.accounts.token_mint.key(), false),
                // 6. `[optional, writable]` Token account
                AccountMeta::new(ctx.accounts.token_account.key(), false),
                // 7. `[signer]` Approver (update authority or token owner) to approve the delegation
                AccountMeta::new_readonly(ctx.accounts.signer.key(), true),
                // 8. `[signer, writable]` Payer
                AccountMeta::new(ctx.accounts.signer.key(), true),
                // 9. `[]` System Program
                AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
                // 10. `[]` Instructions sysvar account
                AccountMeta::new_readonly(ctx.accounts.sysvar_instructions.key(), false),
                // 11. `[optional]` SPL Token Program
                AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
                // 12. `[optional]` Token Authorization Rules program
                AccountMeta::new_readonly(ctx.accounts.auth_rules_program.key(), false),
                // 13. `[optional]` Token Authorization Rules account
                AccountMeta::new_readonly(ctx.accounts.auth_rules.key(), false),
            ],
            data: MetadataInstruction::Delegate(DelegateArgs::StakingV1 {
                amount: 1,
                authorization_data: None,
            })
            .try_to_vec()
            .unwrap(),
        },
        &[
            user_pool.to_account_info(),
            ctx.accounts.mint_metadata.to_account_info(),
            ctx.accounts.token_mint_edition.to_account_info(),
            ctx.accounts.token_mint_record.to_account_info(),
            ctx.accounts.token_mint.to_account_info(),
            ctx.accounts.token_account.to_account_info(),
            ctx.accounts.signer.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.sysvar_instructions.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.auth_rules_program.to_account_info(),
            ctx.accounts.auth_rules.to_account_info(),
        ],
    )?;

    invoke_signed(
        &Instruction {
            program_id: mpl_token_metadata::id(),
            accounts: vec![
                // 0. `[signer]` Delegate
                AccountMeta::new_readonly(user_pool.key(), true),
                // 1. `[optional]` Token owner
                AccountMeta::new_readonly(ctx.accounts.signer.key(), false),
                // 2. `[mut]` Token account
                AccountMeta::new(ctx.accounts.token_account.key(), false),
                // 3. `[]` Mint account
                AccountMeta::new_readonly(ctx.accounts.token_mint.key(), false),
                // 4. `[mut]` Metadata account
                AccountMeta::new(ctx.accounts.mint_metadata.key(), false),
                // 5. `[optional]` Edition account
                AccountMeta::new_readonly(ctx.accounts.token_mint_edition.key(), false),
                // 6. `[optional, mut]` Token record account
                AccountMeta::new(ctx.accounts.token_mint_record.key(), false),
                // 7. `[signer, mut]` Payer
                AccountMeta::new(ctx.accounts.signer.key(), true),
                // 8. `[]` System Program
                AccountMeta::new_readonly(ctx.accounts.system_program.key(), false),
                // 9. `[]` Instructions sysvar account
                AccountMeta::new_readonly(ctx.accounts.sysvar_instructions.key(), false),
                // 10. `[optional]` SPL Token Program
                AccountMeta::new_readonly(ctx.accounts.token_program.key(), false),
                // 11. `[optional]` Token Authorization Rules program
                AccountMeta::new_readonly(ctx.accounts.auth_rules_program.key(), false),
                // 12. `[optional]` Token Authorization Rules account
                AccountMeta::new_readonly(ctx.accounts.auth_rules.key(), false),
            ],
            data: MetadataInstruction::Lock(LockArgs::V1 { authorization_data: None }).try_to_vec().unwrap(),
        },
        &[
            user_pool.to_account_info(),
            ctx.accounts.signer.to_account_info(),
            ctx.accounts.token_account.to_account_info(),
            ctx.accounts.token_mint.to_account_info(),
            ctx.accounts.mint_metadata.to_account_info(),
            ctx.accounts.token_mint_edition.to_account_info(),
            ctx.accounts.token_mint_record.to_account_info(),
            ctx.accounts.system_program.to_account_info(),
            ctx.accounts.sysvar_instructions.to_account_info(),
            ctx.accounts.token_program.to_account_info(),
            ctx.accounts.auth_rules_program.to_account_info(),
            ctx.accounts.auth_rules.to_account_info(),
        ],
        delegate_seeds,
    )?;

    user_pool.stake_cnt += 1;

    Ok(())

}
