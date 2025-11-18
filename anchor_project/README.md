# NFT Minting - Anchor Program

Solana program for minting NFTs with Metaplex Token Metadata integration.

## Features

- Collection authority PDA for each user
- NFT minting with custom metadata
- Metaplex Token Metadata compliance
- Comprehensive test coverage

## Setup

```bash
# Install dependencies
yarn install

# Build program
anchor build

# Run tests
anchor test
```

## Program Architecture

**PDAs**: Collection Authority - `["collection_authority", user_pubkey]`

**Instructions**:
- `initialize_collection` - Creates collection authority
- `mint_nft` - Mints NFT with metadata

**Deployed Program ID**: `9ceJddyiUyjE6cCW9DgBy9QbhAAVqYz86XFXcMJwrU3J`
# Set to localnet for testing
solana config set --url localhost

# Or set to devnet for deployment
solana config set --url devnet

# Create a new keypair if needed
solana-keygen new

# Airdrop SOL for testing (localnet/devnet only)
solana airdrop 2
```

## Testing

### Run Tests on Localnet

The test suite starts a local validator automatically:

```bash
# Run all tests
anchor test

# Run tests with verbose output
anchor test -- --features "test-bpf"
```

### Test Coverage

The tests cover:
- ✅ Initialize collection authority
- ✅ Mint NFT with valid metadata
- ❌ Duplicate collection initialization
- ❌ Mint without collection authority
- ❌ Name too long (>32 chars)
- ❌ Symbol too long (>10 chars)
- ❌ URI too long (>200 chars)

## Deployment

### Deploy to Devnet

```bash
# Set cluster to devnet
solana config set --url devnet

# Ensure you have SOL for deployment
solana balance

# If needed, airdrop SOL
solana airdrop 2

# Build the program
anchor build

# Deploy to devnet
anchor deploy

# The program ID will be displayed - update Anchor.toml and lib.rs with this ID
```

### Update Program ID

After deployment, update the program ID in:
1. `Anchor.toml` - Update `[programs.devnet]` section
2. `programs/nft-minting/src/lib.rs` - Update `declare_id!()` macro

Then rebuild and redeploy:

```bash
anchor build
anchor deploy
```

## Usage Example

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NftMinting } from "./target/types/nft_minting";

// Initialize collection
await program.methods
  .initializeCollection()
  .accounts({
    collectionAuthority: collectionAuthorityPda,
    authority: wallet.publicKey,
    systemProgram: SystemProgram.programId,
  })
  .rpc();

// Mint NFT
await program.methods
  .mintNft("My NFT", "MNFT", "https://arweave.net/metadata-uri")
  .accounts({
    collectionAuthority: collectionAuthorityPda,
    metadata: metadataAccount,
    masterEdition: masterEditionAccount,
    mint: mintKeypair.publicKey,
    tokenAccount: tokenAccount,
    authority: wallet.publicKey,
    // ... other required accounts
  })
  .signers([mintKeypair])
  .rpc();
```

## Project Structure

```
anchor_project/
├── Anchor.toml              # Anchor configuration
├── Cargo.toml               # Rust workspace config
├── package.json             # Node.js dependencies
├── programs/
│   └── nft-minting/
│       ├── Cargo.toml       # Program dependencies
│       └── src/
│           ├── lib.rs       # Program entry point
│           ├── state.rs     # Account structures
│           ├── errors.rs    # Custom errors
│           └── instructions/
│               ├── initialize_collection.rs
│               └── mint_nft.rs
└── tests/
    └── nft-minting.ts       # TypeScript tests
```

## Troubleshooting

### "Program ID mismatch" error
- Run `anchor keys list` to see your program ID
- Update `declare_id!()` in `lib.rs` to match
- Rebuild with `anchor build`

### "Insufficient funds" error
- Check balance: `solana balance`
- Airdrop SOL: `solana airdrop 2`

### Test failures
- Ensure local validator is not already running
- Try `anchor test --skip-local-validator` if you want to use an existing validator

## Resources

- [Anchor Documentation](https://www.anchor-lang.com/)
- [Solana Cookbook](https://solanacookbook.com/)
- [Metaplex Token Metadata](https://developers.metaplex.com/token-metadata)
- [Solana CLI Reference](https://docs.solana.com/cli)