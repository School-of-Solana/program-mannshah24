use anchor_lang::prelude::*;

declare_id!("9ceJddyiUyjE6cCW9DgBy9QbhAAVqYz86XFXcMJwrU3J");

pub mod instructions;
pub mod state;
pub mod errors;

pub use instructions::*;
pub use state::*;
pub use errors::*;

#[program]
pub mod nft_minting {
    use super::*;

    /// Initialize a collection authority for the user
    /// This creates a PDA that will manage the user's NFT collection
    pub fn initialize_collection(ctx: Context<InitializeCollection>) -> Result<()> {
        instructions::initialize_collection::handler(ctx)
    }

    /// Mint a new NFT with the specified metadata
    /// Creates mint, token account, metadata, and master edition accounts
    pub fn mint_nft(
        ctx: Context<MintNft>,
        name: String,
        symbol: String,
        uri: String,
    ) -> Result<()> {
        instructions::mint_nft::handler(ctx, name, symbol, uri)
    }
}
