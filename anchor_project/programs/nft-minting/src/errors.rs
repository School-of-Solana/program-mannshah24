use anchor_lang::prelude::*;

#[error_code]
pub enum NftMintingError {
    #[msg("The provided name is too long. Maximum length is 32 characters.")]
    NameTooLong,
    
    #[msg("The provided symbol is too long. Maximum length is 10 characters.")]
    SymbolTooLong,
    
    #[msg("The provided URI is too long. Maximum length is 200 characters.")]
    UriTooLong,
    
    #[msg("Collection authority not initialized. Please initialize first.")]
    CollectionNotInitialized,
    
    #[msg("You are not authorized to mint NFTs for this collection.")]
    Unauthorized,
}
