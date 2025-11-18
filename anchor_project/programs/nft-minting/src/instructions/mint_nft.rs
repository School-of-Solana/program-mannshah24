use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken,
    token::{Mint, Token, TokenAccount, mint_to, MintTo},
};
use mpl_token_metadata::{
    instructions::{
        CreateMetadataAccountV3Cpi, CreateMetadataAccountV3CpiAccounts,
        CreateMetadataAccountV3InstructionArgs, CreateMasterEditionV3Cpi,
        CreateMasterEditionV3CpiAccounts, CreateMasterEditionV3InstructionArgs,
    },
    types::{Creator, DataV2},
};
use crate::{state::CollectionAuthority, errors::NftMintingError};

#[derive(Accounts)]
pub struct MintNft<'info> {
    #[account(
        mut,
        seeds = [b"collection_authority", authority.key().as_ref()],
        bump = collection_authority.bump,
        constraint = collection_authority.authority == authority.key() @ NftMintingError::Unauthorized
    )]
    pub collection_authority: Account<'info, CollectionAuthority>,
    
    /// CHECK: This account will be created by Metaplex Token Metadata program
    #[account(mut)]
    pub metadata: UncheckedAccount<'info>,
    
    /// CHECK: This account will be created by Metaplex Token Metadata program
    #[account(mut)]
    pub master_edition: UncheckedAccount<'info>,
    
    #[account(
        init,
        payer = authority,
        mint::decimals = 0,
        mint::authority = collection_authority,
        mint::freeze_authority = collection_authority,
    )]
    pub mint: Account<'info, Mint>,
    
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::mint = mint,
        associated_token::authority = authority,
    )]
    pub token_account: Account<'info, TokenAccount>,
    
    #[account(mut)]
    pub authority: Signer<'info>,
    
    pub rent: Sysvar<'info, Rent>,
    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    
    /// CHECK: Metaplex Token Metadata Program
    #[account(address = mpl_token_metadata::ID)]
    pub token_metadata_program: UncheckedAccount<'info>,
}

pub fn handler(
    ctx: Context<MintNft>,
    name: String,
    symbol: String,
    uri: String,
) -> Result<()> {
    // Validate metadata lengths
    require!(name.len() <= 32, NftMintingError::NameTooLong);
    require!(symbol.len() <= 10, NftMintingError::SymbolTooLong);
    require!(uri.len() <= 200, NftMintingError::UriTooLong);
    
    let collection_authority = &ctx.accounts.collection_authority;
    let authority_key = ctx.accounts.authority.key();
    
    // Create PDA signer seeds
    let seeds = &[
        b"collection_authority",
        authority_key.as_ref(),
        &[collection_authority.bump],
    ];
    let signer_seeds = &[&seeds[..]];
    
    // Mint 1 token to the user's token account
    let cpi_context = CpiContext::new_with_signer(
        ctx.accounts.token_program.to_account_info(),
        MintTo {
            mint: ctx.accounts.mint.to_account_info(),
            to: ctx.accounts.token_account.to_account_info(),
            authority: ctx.accounts.collection_authority.to_account_info(),
        },
        signer_seeds,
    );
    mint_to(cpi_context, 1)?;
    
    msg!("Minted 1 token to user's account");
    
    // Create metadata account using Metaplex CPI
    let creators = vec![Creator {
        address: authority_key,
        verified: false,
        share: 100,
    }];
    
    let data_v2 = DataV2 {
        name: name.clone(),
        symbol: symbol.clone(),
        uri: uri.clone(),
        seller_fee_basis_points: 0,
        creators: Some(creators),
        collection: None,
        uses: None,
    };
    
    // Create bindings for account infos
    let metadata_program_info = ctx.accounts.token_metadata_program.to_account_info();
    let metadata_info = ctx.accounts.metadata.to_account_info();
    let mint_info = ctx.accounts.mint.to_account_info();
    let collection_authority_info = ctx.accounts.collection_authority.to_account_info();
    let authority_info = ctx.accounts.authority.to_account_info();
    let system_program_info = ctx.accounts.system_program.to_account_info();
    let rent_info = ctx.accounts.rent.to_account_info();
    
    let create_metadata_accounts = CreateMetadataAccountV3Cpi::new(
        &metadata_program_info,
        CreateMetadataAccountV3CpiAccounts {
            metadata: &metadata_info,
            mint: &mint_info,
            mint_authority: &collection_authority_info,
            payer: &authority_info,
            update_authority: (&collection_authority_info, true),
            system_program: &system_program_info,
            rent: Some(&rent_info),
        },
        CreateMetadataAccountV3InstructionArgs {
            data: data_v2,
            is_mutable: true,
            collection_details: None,
        },
    );
    
    create_metadata_accounts.invoke_signed(signer_seeds)?;
    
    msg!("Metadata account created");
    
    // Create master edition account (makes it an NFT)
    let master_edition_info = ctx.accounts.master_edition.to_account_info();
    let token_program_info = ctx.accounts.token_program.to_account_info();
    
    let create_master_edition_accounts = CreateMasterEditionV3Cpi::new(
        &metadata_program_info,
        CreateMasterEditionV3CpiAccounts {
            edition: &master_edition_info,
            mint: &mint_info,
            update_authority: &collection_authority_info,
            mint_authority: &collection_authority_info,
            payer: &authority_info,
            metadata: &metadata_info,
            token_program: &token_program_info,
            system_program: &system_program_info,
            rent: Some(&rent_info),
        },
        CreateMasterEditionV3InstructionArgs {
            max_supply: Some(0), // No prints allowed
        },
    );
    
    create_master_edition_accounts.invoke_signed(signer_seeds)?;
    
    msg!("Master edition created - NFT is now non-fungible");
    
    // Increment the total minted counter
    let collection_authority = &mut ctx.accounts.collection_authority;
    collection_authority.total_minted = collection_authority.total_minted
        .checked_add(1)
        .unwrap();
    
    msg!("NFT minted successfully! Total minted: {}", collection_authority.total_minted);
    msg!("Name: {}, Symbol: {}, URI: {}", name, symbol, uri);
    
    Ok(())
}
