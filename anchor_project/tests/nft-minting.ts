import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { NftMinting } from "../target/types/nft_minting";
import { 
  TOKEN_PROGRAM_ID, 
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { 
  MPL_TOKEN_METADATA_PROGRAM_ID as TOKEN_METADATA_PROGRAM_ID,
} from "@metaplex-foundation/mpl-token-metadata";
import { assert } from "chai";

describe("nft-minting", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.NftMinting as Program<NftMinting>;
  const authority = provider.wallet as anchor.Wallet;
  
  // Test users
  let unauthorizedUser: anchor.web3.Keypair;
  
  // PDAs and accounts
  let collectionAuthorityPda: anchor.web3.PublicKey;
  let collectionAuthorityBump: number;
  
  // NFT-related accounts
  let mintKeypair: anchor.web3.Keypair;
  let tokenAccount: anchor.web3.PublicKey;
  let metadataAccount: anchor.web3.PublicKey;
  let masterEditionAccount: anchor.web3.PublicKey;
  
  before(async () => {
    // Create unauthorized user
    unauthorizedUser = anchor.web3.Keypair.generate();
    
    // Airdrop SOL to unauthorized user for testing
    const airdropSig = await provider.connection.requestAirdrop(
      unauthorizedUser.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(airdropSig);
    
    // Derive collection authority PDA
    [collectionAuthorityPda, collectionAuthorityBump] = 
      anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("collection_authority"),
          authority.publicKey.toBuffer(),
        ],
        program.programId
      );
  });
  
  describe("Happy Path Tests", () => {
    it("Initializes collection authority successfully", async () => {
      const tx = await program.methods
        .initializeCollection()
        .accounts({
          collectionAuthority: collectionAuthorityPda,
          authority: authority.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      
      console.log("Initialize collection transaction:", tx);
      
      // Fetch and verify the collection authority account
      const collectionAuthority = await program.account.collectionAuthority.fetch(
        collectionAuthorityPda
      );
      
      assert.equal(
        collectionAuthority.authority.toString(),
        authority.publicKey.toString(),
        "Authority should match"
      );
      assert.equal(
        collectionAuthority.totalMinted.toNumber(),
        0,
        "Total minted should be 0"
      );
      assert.equal(
        collectionAuthority.bump,
        collectionAuthorityBump,
        "Bump should match"
      );
      assert.isAbove(
        collectionAuthority.createdAt.toNumber(),
        0,
        "Created timestamp should be set"
      );
    });
    
    it("Mints an NFT successfully", async () => {
      // Create a new mint keypair
      mintKeypair = anchor.web3.Keypair.generate();
      
      // Derive associated token account
      tokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        authority.publicKey
      );
      
      // Derive metadata account
      [metadataAccount] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      
      // Derive master edition account
      [masterEditionAccount] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      
      const nftMetadata = {
        name: "Test NFT",
        symbol: "TNFT",
        uri: "https://arweave.net/test-metadata-uri",
      };
      
      const tx = await program.methods
        .mintNft(nftMetadata.name, nftMetadata.symbol, nftMetadata.uri)
        .accounts({
          collectionAuthority: collectionAuthorityPda,
          metadata: metadataAccount,
          masterEdition: masterEditionAccount,
          mint: mintKeypair.publicKey,
          tokenAccount: tokenAccount,
          authority: authority.publicKey,
          rent: anchor.web3.SYSVAR_RENT_PUBKEY,
          systemProgram: anchor.web3.SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
        })
        .signers([mintKeypair])
        .rpc();
      
      console.log("Mint NFT transaction:", tx);
      
      // Verify token account has 1 token
      const tokenAccountInfo = await provider.connection.getTokenAccountBalance(
        tokenAccount
      );
      assert.equal(
        tokenAccountInfo.value.amount,
        "1",
        "Token account should have 1 token"
      );
      
      // Verify collection authority total_minted incremented
      const collectionAuthority = await program.account.collectionAuthority.fetch(
        collectionAuthorityPda
      );
      assert.equal(
        collectionAuthority.totalMinted.toNumber(),
        1,
        "Total minted should be 1"
      );
      
      // Verify metadata account exists
      const metadataAccountInfo = await provider.connection.getAccountInfo(
        metadataAccount
      );
      assert.isNotNull(metadataAccountInfo, "Metadata account should exist");
      
      // Verify master edition account exists
      const masterEditionAccountInfo = await provider.connection.getAccountInfo(
        masterEditionAccount
      );
      assert.isNotNull(masterEditionAccountInfo, "Master edition account should exist");
    });
  });
  
  describe("Unhappy Path Tests", () => {
    it("Fails to initialize collection authority twice", async () => {
      try {
        await program.methods
          .initializeCollection()
          .accounts({
            collectionAuthority: collectionAuthorityPda,
            authority: authority.publicKey,
            systemProgram: anchor.web3.SystemProgram.programId,
          })
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(
          error.message,
          "already in use",
          "Should fail because account already exists"
        );
      }
    });
    
    it("Fails to mint NFT without collection authority", async () => {
      // Derive collection authority for unauthorized user
      const [unauthorizedCollectionPda] = 
        anchor.web3.PublicKey.findProgramAddressSync(
          [
            Buffer.from("collection_authority"),
            unauthorizedUser.publicKey.toBuffer(),
          ],
          program.programId
        );
      
      const unauthorizedMint = anchor.web3.Keypair.generate();
      const unauthorizedTokenAccount = await getAssociatedTokenAddress(
        unauthorizedMint.publicKey,
        unauthorizedUser.publicKey
      );
      
      const [unauthorizedMetadata] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          unauthorizedMint.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      
      const [unauthorizedMasterEdition] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          unauthorizedMint.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      
      try {
        await program.methods
          .mintNft("Unauthorized NFT", "UNFT", "https://test.com")
          .accounts({
            collectionAuthority: unauthorizedCollectionPda,
            metadata: unauthorizedMetadata,
            masterEdition: unauthorizedMasterEdition,
            mint: unauthorizedMint.publicKey,
            tokenAccount: unauthorizedTokenAccount,
            authority: unauthorizedUser.publicKey,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          })
          .signers([unauthorizedUser, unauthorizedMint])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(
          error.message,
          "AccountNotInitialized",
          "Should fail because collection authority doesn't exist"
        );
      }
    });
    
    it("Fails to mint NFT with name too long", async () => {
      const longName = "A".repeat(33); // 33 characters, max is 32
      const testMint = anchor.web3.Keypair.generate();
      const testTokenAccount = await getAssociatedTokenAddress(
        testMint.publicKey,
        authority.publicKey
      );
      
      const [testMetadata] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          testMint.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      
      const [testMasterEdition] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          testMint.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      
      try {
        await program.methods
          .mintNft(longName, "TEST", "https://test.com")
          .accounts({
            collectionAuthority: collectionAuthorityPda,
            metadata: testMetadata,
            masterEdition: testMasterEdition,
            mint: testMint.publicKey,
            tokenAccount: testTokenAccount,
            authority: authority.publicKey,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          })
          .signers([testMint])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(
          error.message,
          "NameTooLong",
          "Should fail because name is too long"
        );
      }
    });
    
    it("Fails to mint NFT with symbol too long", async () => {
      const longSymbol = "A".repeat(11); // 11 characters, max is 10
      const testMint = anchor.web3.Keypair.generate();
      const testTokenAccount = await getAssociatedTokenAddress(
        testMint.publicKey,
        authority.publicKey
      );
      
      const [testMetadata] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          testMint.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      
      const [testMasterEdition] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          testMint.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      
      try {
        await program.methods
          .mintNft("Test", longSymbol, "https://test.com")
          .accounts({
            collectionAuthority: collectionAuthorityPda,
            metadata: testMetadata,
            masterEdition: testMasterEdition,
            mint: testMint.publicKey,
            tokenAccount: testTokenAccount,
            authority: authority.publicKey,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          })
          .signers([testMint])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(
          error.message,
          "SymbolTooLong",
          "Should fail because symbol is too long"
        );
      }
    });
    
    it("Fails to mint NFT with URI too long", async () => {
      const longUri = "https://arweave.net/" + "A".repeat(200); // Over 200 chars
      const testMint = anchor.web3.Keypair.generate();
      const testTokenAccount = await getAssociatedTokenAddress(
        testMint.publicKey,
        authority.publicKey
      );
      
      const [testMetadata] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          testMint.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      
      const [testMasterEdition] = anchor.web3.PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          testMint.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );
      
      try {
        await program.methods
          .mintNft("Test", "TST", longUri)
          .accounts({
            collectionAuthority: collectionAuthorityPda,
            metadata: testMetadata,
            masterEdition: testMasterEdition,
            mint: testMint.publicKey,
            tokenAccount: testTokenAccount,
            authority: authority.publicKey,
            rent: anchor.web3.SYSVAR_RENT_PUBKEY,
            systemProgram: anchor.web3.SystemProgram.programId,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            tokenMetadataProgram: TOKEN_METADATA_PROGRAM_ID,
          })
          .signers([testMint])
          .rpc();
        
        assert.fail("Should have thrown an error");
      } catch (error) {
        assert.include(
          error.message,
          "UriTooLong",
          "Should fail because URI is too long"
        );
      }
    });
  });
});
