# Project Description

**Deployed Frontend URL:** https://program-mannshah24.vercel.app/

**Solana Program ID:** 9ceJddyiUyjE6cCW9DgBy9QbhAAVqYz86XFXcMJwrU3J

## Project Overview

### Description

A decentralized NFT minting platform built on Solana that allows users to create NFT collections and mint unique digital assets with customizable metadata. The dApp leverages Metaplex Token Metadata standards to ensure compatibility with all major Solana NFT marketplaces and wallets. Users can create their own NFT collections, mint individual NFTs with custom names, symbols, and URIs, and view their minted NFTs in a beautiful gallery interface.

This project demonstrates advanced Solana concepts including PDA derivation, integration with the Metaplex Token Metadata program, proper account management, and comprehensive error handling.

### Key Features

- **Create NFT Collection**: Initialize a new NFT collection with custom metadata and authority
- **Mint NFTs**: Create unique NFTs within a collection with customizable metadata (name, symbol, URI)
- **Collection Authority**: Use PDAs to manage collection ownership and minting permissions
- **Metadata Storage**: Full integration with Metaplex Token Metadata for standard-compliant NFTs
- **Gallery View**: Display all minted NFTs with metadata in a responsive gallery interface
- **Wallet Integration**: Seamless connection with Solana wallets (Phantom, Solflare, etc.)

### How to Use the dApp

1. **Connect Wallet** - Click "Connect Wallet" and approve the connection with your Solana wallet
2. **Initialize Collection** - Click "Create Collection" to set up your NFT collection authority (one-time setup)
3. **Mint NFT** - Fill in the NFT details:
   - Name: Your NFT's display name
   - Symbol: Short ticker symbol (e.g., "MNFT")
   - URI: Link to metadata JSON (can use IPFS, Arweave, or any URI)
4. **View Gallery** - Browse all your minted NFTs in the gallery view
5. **Share** - Your NFTs are compatible with all Solana marketplaces and wallets

## Program Architecture

The NFT Minting dApp uses a modular architecture with two main instructions and integrates with the Metaplex Token Metadata program for NFT standard compliance. The program uses PDAs to manage collection authority and ensures that only authorized users can mint NFTs.

### PDA Usage

The program leverages Program Derived Addresses to create deterministic, secure accounts for collection management and to derive mint authorities.

**PDAs Used:**

- **Collection Authority PDA**: Derived from seeds `["collection_authority", user_wallet_pubkey]` - stores the collection configuration and ensures only the creator can manage their collection. This PDA acts as the mint authority for all NFTs in the collection.
- **Metadata Account**: Derived using Metaplex standards from seeds `["metadata", metadata_program_id, mint_pubkey]` - stores NFT metadata following the Token Metadata standard.
- **Master Edition Account**: Derived using Metaplex standards to create unique, non-fungible tokens.

### Program Instructions

**Instructions Implemented:**

- **Initialize Collection**: Creates a collection authority PDA for the user with initial configuration. This instruction sets up the user as the collection creator and initializes their minting permissions. Only needs to be called once per user.
- **Mint NFT**: Creates a new NFT with specified metadata (name, symbol, URI) by:

  1. Creating a new mint account
  2. Creating an associated token account for the user
  3. Minting exactly 1 token to the user's account
  4. Creating Metaplex metadata account with provided metadata
  5. Creating a master edition account to make the token non-fungible

  The instruction validates that the signer owns the collection authority and handles all the cross-program invocations (CPIs) to the Token Program and Metaplex Token Metadata program.

### Account Structure

```rust
#[account]
pub struct CollectionAuthority {
    pub authority: Pubkey,        // The wallet that owns this collection
    pub total_minted: u64,         // Total number of NFTs minted in this collection
    pub created_at: i64,           // Unix timestamp when collection was created
    pub bump: u8,                  // PDA bump seed for signature verification
}

// Metaplex Token Metadata (external program)
pub struct Metadata {
    pub key: Key,                  // Account discriminator
    pub update_authority: Pubkey,  // Authority that can update metadata
    pub mint: Pubkey,              // NFT mint address
    pub data: Data,                // Metadata (name, symbol, uri, creators, etc.)
    pub primary_sale_happened: bool,
    pub is_mutable: bool,
    // ... additional Metaplex fields
}
```

## Testing

### Test Coverage

Comprehensive test suite covering all critical paths including successful operations, authorization checks, and error conditions to ensure program security and reliability.

**Happy Path Tests:**

- **Initialize Collection Authority**: Successfully creates a collection authority PDA with correct initial values (authority, total_minted=0, timestamp)
- **Mint NFT**: Successfully mints an NFT with:
  - Proper mint account creation
  - Associated token account with 1 token balance
  - Metaplex metadata account with correct name, symbol, URI
  - Master edition account for non-fungibility
  - Incremented total_minted counter

**Unhappy Path Tests:**

- **Initialize Duplicate Collection**: Fails when user tries to initialize collection authority twice (account already exists)
- **Mint Without Collection**: Fails when user tries to mint NFT before initializing their collection authority
- **Unauthorized Minting**: Fails when user tries to mint using another user's collection authority
- **Invalid Metadata**: Fails when provided with invalid URI or metadata that exceeds size limits
- **Wrong Program IDs**: Fails when incorrect Token Program or Metadata Program IDs are provided

### Running Tests

```bash
# Install dependencies
yarn install

# Run all tests (starts local validator, deploys program, runs tests)
anchor test

# Run tests with verbose logging
anchor test -- --features "test-bpf"

# Build program only
anchor build
```

### Additional Notes for Evaluators

This is my implementation of an NFT minting platform that demonstrates integration with Metaplex Token Metadata, proper PDA usage, and comprehensive error handling. The biggest challenges were:

1. **Metaplex Integration**: Understanding the Token Metadata program's account structure and CPI requirements took significant research. Had to carefully follow the Metaplex documentation to ensure proper account derivation and instruction formatting.

2. **Account Size Calculation**: Calculating proper account sizes for rent-exemption, especially with variable-length metadata fields, required careful planning and testing.

3. **Cross-Program Invocations (CPIs)**: Implementing CPIs to both the Token Program (for minting) and Metadata Program (for metadata creation) required understanding invoke_signed for PDA signing.

4. **Testing Complexity**: Writing tests that properly set up all required accounts (mint, token account, metadata, master edition) and verify the complete minting flow was more complex than simple instruction tests.

The program uses industry-standard patterns and is fully compatible with Solana NFT infrastructure (wallets, marketplaces, explorers).
