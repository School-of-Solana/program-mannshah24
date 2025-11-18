"use client";

import dynamic from "next/dynamic";
import { NftMintingDapp } from "@/components/NftMintingDapp";

// Dynamically import wallet button with no SSR
const WalletMultiButton = dynamic(
  async () =>
    (await import("@solana/wallet-adapter-react-ui")).WalletMultiButton,
  { ssr: false }
);

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-black">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              NFT Minting Platform
            </h1>
            <p className="text-gray-300">
              Create your own NFTs on Solana with Metaplex
            </p>
          </div>
          <WalletMultiButton />
        </header>

        <NftMintingDapp />
      </div>
    </main>
  );
}
