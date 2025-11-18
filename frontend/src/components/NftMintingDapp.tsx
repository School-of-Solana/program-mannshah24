"use client";

import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import {
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";
import { IDL } from "../idl/nft_minting";

// Metaplex Token Metadata Program ID
const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

// Replace with your deployed program ID
const PROGRAM_ID = new PublicKey(
  "9ceJddyiUyjE6cCW9DgBy9QbhAAVqYz86XFXcMJwrU3J"
);

interface CollectionAuthority {
  authority: PublicKey;
  totalMinted: anchor.BN;
  createdAt: anchor.BN;
  bump: number;
}

// Manual decode function for CollectionAuthority account
function decodeCollectionAuthority(data: Buffer): CollectionAuthority {
  // Skip 8-byte discriminator
  let offset = 8;

  // Read authority (32 bytes)
  const authority = new PublicKey(data.slice(offset, offset + 32));
  offset += 32;

  // Read totalMinted (8 bytes, u64)
  const totalMinted = new anchor.BN(data.slice(offset, offset + 8), "le");
  offset += 8;

  // Read createdAt (8 bytes, i64)
  const createdAt = new anchor.BN(data.slice(offset, offset + 8), "le");
  offset += 8;

  // Read bump (1 byte, u8)
  const bump = data[offset];

  return { authority, totalMinted, createdAt, bump };
}

export function NftMintingDapp() {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [mounted, setMounted] = useState(false);
  const [program, setProgram] = useState<Program | null>(null);
  const [collectionAuthority, setCollectionAuthority] =
    useState<CollectionAuthority | null>(null);
  const [collectionAuthorityPda, setCollectionAuthorityPda] =
    useState<PublicKey | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  // NFT form state
  const [nftName, setNftName] = useState("");
  const [nftSymbol, setNftSymbol] = useState("");
  const [nftUri, setNftUri] = useState("");

  // Handle client-side mounting
  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize program
  useEffect(() => {
    if (
      !wallet.publicKey ||
      !wallet.signTransaction ||
      !wallet.signAllTransactions
    ) {
      console.log("Wallet not ready, clearing program state");
      setProgram(null);
      setCollectionAuthorityPda(null);
      return;
    }

    try {
      console.log(
        "Initializing program with wallet:",
        wallet.publicKey.toString()
      );

      console.log("Initializing with program ID:", PROGRAM_ID.toString());

      // Derive and set the PDA (no Program instance needed for manual transactions)
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("collection_authority"), wallet.publicKey.toBuffer()],
        PROGRAM_ID
      );
      setCollectionAuthorityPda(pda);
      setProgram({} as any); // Set dummy program to pass checks

      console.log("✅ Setup successful");
      console.log("Program ID:", PROGRAM_ID.toString());
      console.log("Collection Authority PDA:", pda.toString());
    } catch (error) {
      console.error("❌ Failed to initialize program:");
      console.error(error);
      setProgram(null);
      setCollectionAuthorityPda(null);
    }
  }, [connection, wallet, wallet.publicKey]);

  // Fetch collection authority
  useEffect(() => {
    if (!program || !wallet.publicKey) return;

    const fetchCollectionAuthority = async () => {
      try {
        const [pda] = PublicKey.findProgramAddressSync(
          [Buffer.from("collection_authority"), wallet.publicKey!.toBuffer()],
          PROGRAM_ID
        );

        setCollectionAuthorityPda(pda);

        // Check whether the account exists before calling Anchor's fetch
        const acctInfo = await connection.getAccountInfo(pda);
        if (!acctInfo) {
          // Account not created yet
          setCollectionAuthority(null);
          return;
        }

        // Fetch using generic account method
        const accountData = await connection.getAccountInfo(pda);
        if (accountData) {
          const account = decodeCollectionAuthority(accountData.data);
          setCollectionAuthority(account);
        }
      } catch (error) {
        console.error("Failed to fetch collection authority:", error);
        setCollectionAuthority(null);
      }
    };

    fetchCollectionAuthority();
  }, [program, wallet.publicKey]);

  const initializeCollection = async () => {
    if (!wallet.publicKey || !collectionAuthorityPda) {
      setStatus("Error: Wallet not connected or program not initialized");
      return;
    }

    setLoading(true);
    setStatus("Initializing collection...");

    try {
      console.log("PDA:", collectionAuthorityPda.toString());
      console.log("Wallet:", wallet.publicKey.toString());

      // Build instruction manually
      const discriminator = Buffer.from([112, 62, 53, 139, 173, 152, 98, 93]);

      const keys = [
        { pubkey: collectionAuthorityPda, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ];

      const ix = new anchor.web3.TransactionInstruction({
        keys,
        programId: PROGRAM_ID,
        data: discriminator,
      });

      const tx = new anchor.web3.Transaction().add(ix);
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;

      const signed = await wallet.signTransaction!(tx);
      const txid = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(txid, "confirmed");

      console.log("Transaction successful:", txid);
      setStatus(`Collection initialized! Transaction: ${txid}`);

      // Refetch collection authority
      const accountData = await connection.getAccountInfo(
        collectionAuthorityPda
      );
      if (accountData) {
        const account = decodeCollectionAuthority(accountData.data);
        setCollectionAuthority(account);
      }
    } catch (error: any) {
      console.error("Error initializing collection:", error);
      console.error("Error details:", error.logs);
      setStatus(`Error: ${error.message || "Unknown error occurred"}`);
    } finally {
      setLoading(false);
    }
  };

  const mintNft = async () => {
    if (!program || !wallet.publicKey || !collectionAuthorityPda) return;

    if (!nftName || !nftSymbol || !nftUri) {
      setStatus("Please fill in all NFT details");
      return;
    }

    setLoading(true);
    setStatus("Minting NFT...");

    try {
      const mintKeypair = Keypair.generate();

      const tokenAccount = await getAssociatedTokenAddress(
        mintKeypair.publicKey,
        wallet.publicKey
      );

      const [metadataAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      const [masterEditionAccount] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("metadata"),
          TOKEN_METADATA_PROGRAM_ID.toBuffer(),
          mintKeypair.publicKey.toBuffer(),
          Buffer.from("edition"),
        ],
        TOKEN_METADATA_PROGRAM_ID
      );

      // Build instruction manually with mint_nft discriminator
      const discriminator = Buffer.from([211, 57, 6, 167, 15, 219, 35, 251]);

      // Encode string arguments (name, symbol, uri)
      const nameBytes = Buffer.from(nftName);
      const symbolBytes = Buffer.from(nftSymbol);
      const uriBytes = Buffer.from(nftUri);

      // Build instruction data: discriminator + (u32 len + string) for each arg
      const data = Buffer.concat([
        discriminator,
        // Name: u32 length + string bytes
        Buffer.from(new Uint8Array(new Uint32Array([nameBytes.length]).buffer)),
        nameBytes,
        // Symbol: u32 length + string bytes
        Buffer.from(
          new Uint8Array(new Uint32Array([symbolBytes.length]).buffer)
        ),
        symbolBytes,
        // URI: u32 length + string bytes
        Buffer.from(new Uint8Array(new Uint32Array([uriBytes.length]).buffer)),
        uriBytes,
      ]);

      const keys = [
        { pubkey: collectionAuthorityPda, isSigner: false, isWritable: true },
        { pubkey: metadataAccount, isSigner: false, isWritable: true },
        { pubkey: masterEditionAccount, isSigner: false, isWritable: true },
        { pubkey: mintKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: tokenAccount, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        {
          pubkey: ASSOCIATED_TOKEN_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
        {
          pubkey: TOKEN_METADATA_PROGRAM_ID,
          isSigner: false,
          isWritable: false,
        },
      ];

      const ix = new anchor.web3.TransactionInstruction({
        keys,
        programId: PROGRAM_ID,
        data,
      });

      const tx = new anchor.web3.Transaction().add(ix);
      const { blockhash } = await connection.getLatestBlockhash();
      tx.recentBlockhash = blockhash;
      tx.feePayer = wallet.publicKey;
      tx.partialSign(mintKeypair);

      const signed = await wallet.signTransaction!(tx);
      const txid = await connection.sendRawTransaction(signed.serialize());
      await connection.confirmTransaction(txid, "confirmed");

      setStatus(`NFT minted successfully! Transaction: ${txid}`);
      console.log(`Mint address: ${mintKeypair.publicKey.toString()}`);

      // Clear form
      setNftName("");
      setNftSymbol("");
      setNftUri("");

      // Refetch collection authority
      const accountData = await connection.getAccountInfo(
        collectionAuthorityPda
      );
      if (accountData) {
        const account = decodeCollectionAuthority(accountData.data);
        setCollectionAuthority(account);
      }
    } catch (error: any) {
      console.error("Error minting NFT:", error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Prevent hydration errors by only rendering after mount
  if (!mounted) {
    return (
      <div className="text-center py-20">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!wallet.connected) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl text-white mb-4">
          Welcome to NFT Minting Platform
        </h2>
        <p className="text-gray-300 mb-8">
          Please connect your wallet to get started
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Debug Info */}
      <div className="bg-blue-900/30 backdrop-blur-md rounded-lg p-4 mb-4 text-sm">
        <p className="text-gray-300">
          <span className="font-semibold">Wallet Connected:</span>{" "}
          {wallet.connected ? "✅ Yes" : "❌ No"}
        </p>
        <p className="text-gray-300">
          <span className="font-semibold">Program Initialized:</span>{" "}
          {program ? "✅ Yes" : "❌ No"}
        </p>
        <p className="text-gray-300">
          <span className="font-semibold">PDA Set:</span>{" "}
          {collectionAuthorityPda ? "✅ Yes" : "❌ No"}
        </p>
        {wallet.publicKey && (
          <p className="text-gray-300 break-all">
            <span className="font-semibold">Wallet:</span>{" "}
            {wallet.publicKey.toString()}
          </p>
        )}
      </div>

      {/* Collection Status Card */}
      <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8">
        <h2 className="text-2xl font-bold text-white mb-4">
          Collection Status
        </h2>

        {collectionAuthority ? (
          <div className="space-y-2">
            <p className="text-gray-300">
              <span className="font-semibold">Authority:</span>{" "}
              {collectionAuthority.authority.toString().slice(0, 8)}...
              {collectionAuthority.authority.toString().slice(-8)}
            </p>
            <p className="text-gray-300">
              <span className="font-semibold">Total Minted:</span>{" "}
              {collectionAuthority.totalMinted.toString()}
            </p>
            <p className="text-gray-300">
              <span className="font-semibold">Created:</span>{" "}
              {new Date(
                collectionAuthority.createdAt.toNumber() * 1000
              ).toLocaleString()}
            </p>
          </div>
        ) : (
          <div>
            <p className="text-gray-300 mb-4">
              You haven't initialized your collection yet.
            </p>
            <button
              onClick={initializeCollection}
              disabled={loading}
              className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Initializing..." : "Initialize Collection"}
            </button>
          </div>
        )}
      </div>

      {/* Mint NFT Card */}
      {collectionAuthority && (
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Mint New NFT</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                NFT Name (max 32 characters)
              </label>
              <input
                type="text"
                value={nftName}
                onChange={(e) => setNftName(e.target.value)}
                maxLength={32}
                placeholder="My Awesome NFT"
                className="w-full px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Symbol (max 10 characters)
              </label>
              <input
                type="text"
                value={nftSymbol}
                onChange={(e) => setNftSymbol(e.target.value)}
                maxLength={10}
                placeholder="MNFT"
                className="w-full px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Metadata URI (max 200 characters)
              </label>
              <input
                type="text"
                value={nftUri}
                onChange={(e) => setNftUri(e.target.value)}
                maxLength={200}
                placeholder="https://arweave.net/your-metadata-uri"
                className="w-full px-4 py-2 bg-white/5 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                The URI should point to a JSON file with NFT metadata
              </p>
            </div>

            <button
              onClick={mintNft}
              disabled={loading || !nftName || !nftSymbol || !nftUri}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Minting..." : "Mint NFT"}
            </button>
          </div>
        </div>
      )}

      {/* Status Messages */}
      {status && (
        <div className="bg-white/10 backdrop-blur-md rounded-lg p-4">
          <p className="text-sm text-gray-300 break-all">{status}</p>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-white/5 backdrop-blur-md rounded-lg p-6 mt-8">
        <h3 className="text-lg font-bold text-white mb-3">How to Use</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-300 text-sm">
          <li>Connect your Solana wallet (Phantom, Solflare, etc.)</li>
          <li>Initialize your collection (one-time setup)</li>
          <li>Fill in your NFT details (name, symbol, metadata URI)</li>
          <li>Click "Mint NFT" and approve the transaction</li>
          <li>Your NFT will be visible in your wallet!</li>
        </ol>
      </div>
    </div>
  );
}
