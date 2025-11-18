use anchor_lang::prelude::*;

/// Stores collection authority information for a user
/// This account is a PDA derived from the user's pubkey
#[account]
pub struct CollectionAuthority {
    /// The wallet that owns this collection
    pub authority: Pubkey,
    
    /// Total number of NFTs minted in this collection
    pub total_minted: u64,
    
    /// Unix timestamp when the collection was created
    pub created_at: i64,
    
    /// Bump seed for PDA derivation
    pub bump: u8,
}

impl CollectionAuthority {
    // Discriminator (8) + Pubkey (32) + u64 (8) + i64 (8) + u8 (1)
    pub const LEN: usize = 8 + 32 + 8 + 8 + 1;
}
