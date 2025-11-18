# NFT Minting Frontend

Next.js frontend for NFT minting on Solana with wallet integration and custom metadata.

## Setup

```bash
# Install dependencies
yarn install

# Run development server
yarn dev

# Build for production
yarn build
```

## Environment

Program ID and network are configured in the component. The app connects to Solana Devnet.

In `src/components/NftMintingDapp.tsx`, update the program ID with your deployed program:

```typescript
const PROGRAM_ID = new PublicKey("YOUR_DEPLOYED_PROGRAM_ID");
```

Get your program ID by running `anchor keys list` in the `anchor_project` directory.

### 5. Run Development Server

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Building for Production

```bash
# Build the application
yarn build

# Start production server
yarn start
```

## Deployment to Vercel

### Option 1: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Option 2: GitHub Integration

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project"
4. Import your GitHub repository
5. Configure build settings (Vercel auto-detects Next.js)
6. Add environment variables:
   - `NEXT_PUBLIC_SOLANA_NETWORK=devnet`
7. Click "Deploy"

### After Deployment

Update `PROJECT_DESCRIPTION.md` with your deployed URL:

```markdown
**Deployed Frontend URL:** https://your-app.vercel.app
```

## Usage Guide

### For Users

1. **Connect Wallet**

   - Click "Connect Wallet" button in the top right
   - Approve the connection in your wallet

2. **Initialize Collection**

   - Click "Initialize Collection" button (one-time setup)
   - Approve the transaction in your wallet
   - Your collection authority is now created

3. **Mint NFT**
   - Fill in NFT details:
     - **Name**: Display name (max 32 characters)
     - **Symbol**: Short ticker (max 10 characters)
     - **URI**: Link to metadata JSON (max 200 characters)
   - Click "Mint NFT"
   - Approve the transaction
   - Your NFT will appear in your wallet!

### Metadata URI Format

Your metadata URI should point to a JSON file with this structure:

```json
{
  "name": "My Awesome NFT",
  "symbol": "MNFT",
  "description": "This is an amazing NFT",
  "image": "https://arweave.net/your-image-url",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    }
  ]
}
```

You can host metadata on:

- [Arweave](https://arweave.org/)
- [IPFS](https://ipfs.io/)
- [NFT.Storage](https://nft.storage/)
- Any public URL

## Project Structure

```
frontend/
├── src/
│   ├── app/
│   │   ├── layout.tsx        # Root layout with wallet provider
│   │   ├── page.tsx          # Home page
│   │   └── globals.css       # Global styles
│   ├── components/
│   │   ├── WalletContextProvider.tsx  # Wallet adapter setup
│   │   └── NftMintingDapp.tsx         # Main dApp component
│   └── idl/
│       └── nft_minting.json  # Anchor program IDL
├── public/                   # Static assets
├── package.json              # Dependencies
├── next.config.mjs           # Next.js config
├── tailwind.config.js        # Tailwind CSS config
└── tsconfig.json             # TypeScript config
```

## Troubleshooting

### "Failed to fetch" or connection errors

- Check that `NEXT_PUBLIC_SOLANA_NETWORK` matches your deployment
- Ensure your wallet is on the correct network
- Try refreshing the page

### "Program account not found"

- Verify the `PROGRAM_ID` in `NftMintingDapp.tsx` matches your deployed program
- Check the program is deployed: `solana program show <PROGRAM_ID>`

### Transaction failures

- Ensure you have enough SOL for transaction fees
- Check the Solana network status
- Verify the Anchor program is deployed correctly

### IDL import errors

- Make sure you copied the IDL file to `src/idl/nft_minting.json`
- Check the file is valid JSON
- Rebuild the Anchor program if needed

## Environment Variables

| Variable                     | Description                  | Default  |
| ---------------------------- | ---------------------------- | -------- |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Solana cluster to connect to | `devnet` |

## Development Tips

### Hot Reload

Changes to components automatically reload in the browser during development.

### Wallet Testing

For local testing, use the Phantom wallet's devnet mode or create test wallets with:

```bash
solana-keygen new --outfile ~/.config/solana/test-wallet.json
solana airdrop 2 <WALLET_ADDRESS> --url devnet
```

### Debugging

Open browser DevTools console to see detailed error messages and transaction logs.

## Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- [Anchor Documentation](https://www.anchor-lang.com/)
- [Metaplex Token Metadata](https://developers.metaplex.com/token-metadata)
- [Tailwind CSS](https://tailwindcss.com/docs)

## License

MIT
