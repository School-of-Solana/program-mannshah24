use anchor_lang::prelude::*;
use crate::state::CollectionAuthority;

#[derive(Accounts)]
pub struct InitializeCollection<'info> {
    #[account(
        init,
        payer = authority,
        space = CollectionAuthority::LEN,
        seeds = [b"collection_authority", authority.key().as_ref()],
        bump
    )]
    pub collection_authority: Account<'info, CollectionAuthority>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

pub fn handler(ctx: Context<InitializeCollection>) -> Result<()> {
    let collection_authority = &mut ctx.accounts.collection_authority;
    let clock = Clock::get()?;
    
    collection_authority.authority = ctx.accounts.authority.key();
    collection_authority.total_minted = 0;
    collection_authority.created_at = clock.unix_timestamp;
    collection_authority.bump = ctx.bumps.collection_authority;
    
    msg!("Collection authority initialized for: {}", ctx.accounts.authority.key());
    
    Ok(())
}
