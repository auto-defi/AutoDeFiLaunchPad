# 🚀 AutoDeFi LaunchPad - Bonding Curve Token Launchpad on Hedera

<div align="center">

**The Ultimate Bonding Curve Token Launchpad on Hedera Blockchain (EVM)**

[![Next.js](https://img.shields.io/badge/Next.js-15.5-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.1-blue)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Hedera](https://img.shields.io/badge/Hedera-Testnet-purple)](https://hashscan.io/testnet)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

</div>



---

## 📋 Table of Contents

- [Overview](#-overview)
- [Smart Contract](#-smart-contract)
- [Indexer](#-indexer)
- [Key Features](#-key-features)
- [Architecture](#-architecture)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Smart Contract Integration](#-smart-contract-integration)
- [Real-Time Indexer](#-real-time-indexer)
- [DEX Integration](#-dex-integration)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

**AutoDeFi LaunchPad** is a cutting-edge token launchpad built on the Hedera network (EVM), featuring an innovative bonding curve mechanism for fair token distribution and price discovery. The platform enables creators to launch tokens instantly while providing traders with a seamless, low-slippage trading experience.

### Why LaunchPad?

- **🔄 Bonding Curve Mechanism** - Fair price discovery through XYK (x*y=k) automated market maker formula
- **⚡ Real-Time Trading** - Sub-second transaction confirmation with instant UI updates
- **🎓 Graduation System** - Automatic migration to DEX pools when reaching 21,500 HBAR threshold
- **📊 Advanced Analytics** - Comprehensive token metrics, trading volume, and pool statistics
- **🔗 Blockchain-First** - Direct smart contract integration with no intermediaries

---

## 📃 Smart Contract

Factory (Hedera Testnet): 0xEEBed6dC5e12Ee6379A59c7C35fF80cE7853FE7B

---

## ⚙ Indexer

EVM Indexer: periodic snapshots via /api/indexer-evm/cron and metrics at /api/indexer-evm/metrics

---

## ✨ Key Features

### 🚀 Token Launchpad
- **Instant Token Creation** - Launch fungible assets (FA) in seconds
- **Fixed Supply** - 1 billion tokens (ERC-20, default 18 decimals)
- **Initial Buy Option** - Creators can purchase tokens immediately at launch
- **Customizable Metadata** - Token name, symbol, icon URI, and project URI
- **No Fees** - Zero minting fees for token creation

### 💹 Bonding Curve Trading
- **XYK Formula** - Industry-standard automated market maker (AMM) algorithm
- **Virtual Reserves** - 28.24 HBAR virtual reserves for price stability
- **Low Fees** - Only 0.1% trading fee
- **Slippage Protection** - Configurable slippage tolerance (5% default)
- **Real-Time Pricing** - Live price updates based on pool reserves

### 🎓 Graduation Mechanism
- **Automatic Threshold** - Graduates to DEX at 21,500 HBAR
- **Token Burn** - Remaining tokens burned upon graduation
- **DEX Pool Creation** - Seamless migration to liquidity pools
- **Progress Tracking** - Visual indicators showing graduation progress

### 📊 Portfolio Management
- **Multi-Wallet Support** - MetaMask (EIP-1193) and compatible wallets
- **Real-Time Balances** - Live balance updates from blockchain
- **Token Discovery** - Automatic detection of LaunchPad tokens
- **Portfolio Analytics** - Total value, asset distribution, P&L tracking

### 🔍 Search & Discovery
- **Real-Time Search** - Debounced search with autocomplete
- **Trending Tokens** - Top tokens by volume and trade count
- **Token Details** - Comprehensive coin information pages
- **Trade History** - Complete transaction history with explorer links

### ⚡ Real-Time Indexer
- **Cron-based snapshots** - Periodic indexing (every 10 minutes)
- **Metrics freshness** - Near-real-time metrics via snapshots
- **Event Tracking** - All LaunchPad events (Create, Buy, Graduation)
- **Cron Triggered** - Invoked by Vercel Cron or external schedulers
- **Smart Resume** - Continues from last processed transaction

### 🎨 Modern UI/UX
- **Responsive Design** - Mobile-first, works on all devices
- **Dark Mode** - Built-in theme support
- **Animated Transitions** - Smooth animations with Framer Motion
- **3D Effects** - Three.js powered visual effects
- **Professional Design** - Clean, elegant interface

### 🔄 DEX Integration (EVM Pools)
- **Graduated Token Trading** – Tokens move from bonding curve to DEX at 21,500 HBAR
- **EVM DEX Integration-Ready** – Pool address is returned on graduation
- **Seamless Migration** – Automatic transition without user friction


## 🏗 Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐  │
│  │   LaunchPad   │  │   Trading    │  │   Portfolio     │  │
│  └───────┬───────┘  └──────┬───────┘  └────────┬────────┘  │
│          │                  │                   │           │
│          └──────────────────┼───────────────────┘           │
│                             │                               │
│                    ┌────────▼────────┐                      │
│                    │   Wallet SDK    │                      │
│                    │  (EVM / MetaMask)│                      │
│                    └────────┬────────┘                      │
└─────────────────────────────┼───────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
        │            ┌────────▼────────┐            │
        │            │   API Routes    │            │
        │            │   (Next.js)     │            │
        │            └────────┬────────┘            │
        │                     │                     │
        │        ┌────────────┼────────────┐        │
        │        │            │            │        │
  ┌─────▼─────┐  │  ┌────────▼────────┐  │  ┌─────▼──────┐
  │  Indexer  │──┼──│    Database     │──┼──│  Hedera    │
  │  Service  │  │  │  (PostgreSQL)   │  │  │ Blockchain │
  └───────────┘  │  └─────────────────┘  │  └────────────┘
                 │                        │
                 │  ┌─────────────────┐  │
                 └──│     Prisma      │──┘
                    │      ORM        │
                    └─────────────────┘
```

### Data Flow

```
┌──────────────┐
│    User      │
└──────┬───────┘
       │ 1. Interact
       ▼
┌──────────────────┐
│   React UI       │
└──────┬───────────┘
       │ 2. Call API / Smart Contract
       ▼
┌─────────────────────────────────┐
│   API Routes / Wallet Adapter   │
└──────┬──────────────────┬───────┘
       │                  │
       │ 3. Query DB      │ 4. Sign Transaction
       ▼                  ▼
┌──────────────┐   ┌────────────────┐
│  PostgreSQL  │   │ Hedera Network │
└──────────────┘   └────────┬────────┘
       ▲                    │
       │ 6. Store Data      │ 5. Emit Events
       │                    ▼
       └────────────┌───────────────┐
                    │  Indexer      │
                    │  (Real-Time)  │
                    └───────────────┘
```

---

## 🛠 Tech Stack

### Frontend
- **[Next.js 15.5.2](https://nextjs.org/)** - React framework with App Router & Turbopack
- **[React 19.1.0](https://reactjs.org/)** - UI library with latest features
- **[TypeScript 5.x](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Tailwind CSS 4.x](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Framer Motion 12.23.12](https://www.framer.com/motion/)** - Production-ready animation library
- **[Radix UI](https://www.radix-ui.com/)** - 25+ unstyled, accessible component primitives
- **[Lucide React 0.542.0](https://lucide.dev/)** - Beautiful & consistent icon library
- **[Three.js 0.179.1](https://threejs.org/)** - WebGL 3D graphics library
- **[Postprocessing 6.37.7](https://github.com/pmndrs/postprocessing)** - Post-processing effects for Three.js
- **[Next Themes 0.4.6](https://github.com/pacocoursey/next-themes)** - Perfect dark mode support
- **[Recharts 3.1.2](https://recharts.org/)** - Composable charting library
- **[Sonner 2.0.7](https://sonner.emilkowal.ski/)** - Opinionated toast notifications
- **[cmdk 1.1.1](https://cmdk.paco.me/)** - Command menu for React
- **[CVA 0.7.1](https://cva.style/)** - Class variance authority for component variants
- **[Tailwind Merge 3.3.1](https://github.com/dcastil/tailwind-merge)** - Merge Tailwind classes intelligently

### Backend
- **[Prisma 6.16.2](https://www.prisma.io/)** - Next-generation type-safe ORM
- **[PostgreSQL](https://www.postgresql.org/)** - Powerful relational database
- **[pg 8.16.3](https://node-postgres.com/)** - Non-blocking PostgreSQL client
- **[Node.js 20+](https://nodejs.org/)** - JavaScript runtime environment
- **[Express](https://expressjs.com/)** - Web Framework

### Blockchain
- **[ethers.js v6](https://docs.ethers.org/)** - EVM library for Hedera RPC interactions
- **EIP-1193 Provider (MetaMask/Rabby)** - Browser wallet integration for EVM chains
- **LaunchPad Factory (Hedera Testnet)** - 0xEEBed6dC5e12Ee6379A59c7C35fF80cE7853FE7B

### DevOps & Tooling
- **[Vercel](https://vercel.com/)** - Serverless deployment platform
- **[Supabase](https://supabase.com/)** - Managed PostgreSQL with connection pooling
- **[Turbopack](https://turbo.build/)** - Next.js 15 native bundler (10x faster)
- **[ESLint 9](https://eslint.org/)** - Code linting with Next.js config
- **[PostCSS](https://postcss.org/)** - CSS transformations
- **[PM2](https://pm2.io/)** - Monitoring Dashboard and 24/7 Uptime

---

## 🚀 Getting Started

### Prerequisites

- **Node.js 20+** - [Download](https://nodejs.org/)
- **PostgreSQL 14+** - [Download](https://www.postgresql.org/download/) or use [Supabase](https://supabase.com/)
- **npm or yarn** - Package manager
- **Git** - Version control

### Installation

#### 1. Clone the Repository

```bash
git clone https://github.com/auto-defi/AutoDeFiLaunchPad.git
cd AutoDeFiLaunchPad
```

#### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

#### 3. Setup Environment Variables

Create `.env.local` file in the root directory:

```env
# ═══════════════════════════════════════════════════════
#  Frontend Configuration
# ═══════════════════════════════════════════════════════
NEXT_PUBLIC_FACTORY_ADDRESS=0xEEBed6dC5e12Ee6379A59c7C35fF80cE7853FE7B
NEXT_PUBLIC_HEDERA_RPC_URL=https://testnet.hashio.io/api
NEXT_PUBLIC_CHAIN_ID=296
# No faucet/API key required for Hashio (you may use other RPCs)

# ═══════════════════════════════════════════════════════
#  Backend Configuration
# ═══════════════════════════════════════════════════════
HEDERA_RPC_URL=https://testnet.hashio.io/api
CHAIN_ID=296
FACTORY_ADDRESS=0xEEBed6dC5e12Ee6379A59c7C35fF80cE7853FE7B

# Optional: Router Module (for DEX swaps)
# Router not used (EVM); swaps happen via bonding curve and DEX

# ═══════════════════════════════════════════════════════
#  Database Configuration (Supabase)
# ═══════════════════════════════════════════════════════
DATABASE_URL="postgresql://username:password@host:6543/database?pgbouncer=true"
DIRECT_URL="postgresql://username:password@host:5432/database"

# ═══════════════════════════════════════════════════════
#  Server Configuration
# ═══════════════════════════════════════════════════════
PORT=3000
NODE_ENV=development
```

> No RPC API key required for Hashio. You may use other RPC providers if preferred.

#### 4. Setup Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Run migrations
npm run db:migrate

# (Optional) Open Prisma Studio
npm run db:studio
```

#### 5. Start Development Server

```bash
npm run dev
```

The application will be available at **[http://localhost:3000](http://localhost:3000)**

#### 6. Start Real-Time Indexer

The indexer runs via a cron endpoint. Trigger locally and fetch metrics:

```bash
# Trigger a snapshot now
curl http://localhost:3000/api/indexer-evm/cron

# Get metrics for specific tokens
curl "http://localhost:3000/api/indexer-evm/metrics?tokens=0xYourToken,0xAnotherToken"
```

---

## 🔗 Smart Contract Integration

### Contract Address

```
Factory: 0xEEBed6dC5e12Ee6379A59c7C35fF80cE7853FE7B
Network: Hedera Testnet (Chain ID 296)
```

### Contracts and Interfaces

- BondingCurveFactory.sol
  - event TokenCreated(address token, address pool, string name, string symbol, string iconURI, string projectURI, address indexed creator)
  - function createToken(string calldata name, string calldata symbol, string calldata iconURI, string calldata projectURI, uint256 initialBuyAmountWei) external payable returns (address token, address pool)
  - function getPool(address token) external view returns (address pool)
  - function allTokens(uint256 index) external view returns (address token)
  - function allTokensLength() external view returns (uint256 length)

- BondingCurvePool.sol
  - event Bought(address indexed buyer, uint256 hbarInWei, uint256 tokensOut)
  - event Sold(address indexed seller, uint256 tokensIn, uint256 hbarOutWei)
  - function token() external view returns (address)
  - function buy(address to) external payable returns (uint256 tokensOut)
  - function sell(address from, uint256 tokensIn) external returns (uint256 hbarOutWei)
  - function getPriceForBuy(uint256 hbarInWei) external view returns (uint256 tokensOut)
  - function getPriceForSell(uint256 tokensIn) external view returns (uint256 hbarOutWei)
  - function reserves() external view returns (uint256 hbarReserves, uint256 tokenReserves)

- LaunchPadToken.sol (ERC-20)
  - Standard ERC-20 (name, symbol, decimals, totalSupply, balanceOf, transfer, approve, transferFrom)
  - Mint/Burn restricted to pool via ILaunchPadMintable

### Example: Create a token via factory (ethers v6)

```ts
import { ethers } from "ethers";

const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

const FACTORY_ADDRESS = process.env.NEXT_PUBLIC_FACTORY_ADDRESS!;
const factory = new ethers.Contract(FACTORY_ADDRESS, BondingCurveFactoryABI, signer);

const initialBuy = ethers.parseEther("1.0");
const tx = await factory.createToken(
  "MyToken",
  "MTK",
  "", // iconURI
  "", // projectURI
  initialBuy,
  { value: initialBuy }
);
await tx.wait();
```

### Bonding Curve Math (XYK with virtual reserves)

**Formula**: `(H + vHbar) * (T + vToken) = k` with fee on input.

```ts
// Buy (HBAR -> TOKEN)
const H = hbarReserves;
const T = tokenReserves;
const k = (H + vHbar) * (T + vToken);
const hInEff = hbarIn * (10_000 - feeBps) / 10_000;
const newHPlusV = H + hInEff + vHbar;
const newTPlusV = k / newHPlusV;
const tokensOut = (T + vToken) - newTPlusV;

// Sell (TOKEN -> HBAR)
const tInEff = tokensIn * (10_000 - feeBps) / 10_000;
const newTPlusV2 = T + tInEff + vToken;
const newHPlusV2 = k / newTPlusV2;
const hbarOut = (H + vHbar) - newHPlusV2;
```

- Fee: `feeBps = 10` (0.10%)
- Virtual reserves: `vHbar = 28.24 ether`, `vToken = 1_000_000 ether`
- Graduation threshold (product spec): ~21,500 HBAR in pool reserves

---

## ⚡ Real-Time Indexer

- Cron-triggered snapshots: `GET /api/indexer-evm/cron` (schedule every ~10 minutes via Vercel Cron)
- On-demand metrics for specific tokens: `GET /api/indexer-evm/metrics?tokens=0xTokenA,0xTokenB`
- Health check: `GET /api/health`

### Usage

Trigger a snapshot locally:
```bash
curl http://localhost:3000/api/indexer-evm/cron
```

Fetch metrics for tokens:
```bash
curl "http://localhost:3000/api/indexer-evm/metrics?tokens=0xEEBed6dC5e12Ee6379A59c7C35fF80cE7853FE7B"
```

Example response (per token):
```json
{
  "token": "0x...",
  "pool": "0x...",
  "currentPrice": 0.00123,
  "priceChange24h": 5.67,
  "marketCap": 123456.78,
  "volume24hUsd": 890.12,
  "snapshotAt": "2025-01-01T12:34:56.789Z"
}
```

### Configuration

- RPC: `HEDERA_RPC_URL` (server-side)
- Factory: `NEXT_PUBLIC_FACTORY_ADDRESS`
- Implementation: `lib/services/evm-indexer.ts` (24h volume derived from logs; periodic snapshots stored in `TokenSnapshot`)

---

## 🔄 DEX Integration

### Graduated Token Trading

When a token reaches 21,500 HBAR threshold, it **graduates** from the bonding curve. The EVM pool address is returned on graduation and can be used with EVM DEXs.


### DEX Swap Implementation (Hedera EVM)

Example: Swap HBAR → TOKEN using a UniswapV2-style router via ethers.js v6.

```ts
import { ethers } from "ethers";

// 1) Get signer from browser wallet (EIP-1193 / MetaMask)
const provider = new ethers.BrowserProvider(window.ethereum);
const signer = await provider.getSigner();

// 2) Setup router (replace with your chosen DEX router on Hedera Testnet)
const ROUTER_ADDRESS = "0xYourRouterAddress"; // e.g., UniswapV2-like router
const WHBAR_ADDRESS = "0xWrappedHBAR";       // Wrapped HBAR address
const TOKEN_ADDRESS  = "0xYourTokenAddress"; // ERC-20 token to buy

const router = new ethers.Contract(
  ROUTER_ADDRESS,
  [
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)"
  ],
  signer
);

// 3) Prepare swap params
const hbarIn = ethers.parseEther("0.1");           // 0.1 HBAR
const amountOutMin = 0n;                            // set via slippage calc
const path = [WHBAR_ADDRESS, TOKEN_ADDRESS];        // HBAR → TOKEN via WHBAR
const to = await signer.getAddress();
const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);

// 4) Execute swap (HBAR → TOKEN)
const tx = await router.swapExactETHForTokens(amountOutMin, path, to, deadline, { value: hbarIn });
await tx.wait();
```

Notes:
- Replace ROUTER_ADDRESS/WHBAR_ADDRESS/TOKEN_ADDRESS with actual addresses on Hedera Testnet.
- For TOKEN → HBAR swaps, approve the router on the ERC-20, then call `swapExactTokensForETH`.
- Use a price quote + slippage tolerance to compute `amountOutMin`.

### UI Features

- **Visual Differentiation** - Green gradient for graduated tokens
- **Swap Interface** - "Swap HBAR → TOKEN" instead of "Buy"
- **Explorer Links** - Direct links to transaction explorer
- **Real-Time Updates** - Balance refreshes after swaps

---

## 📡 API Documentation

### Token Endpoints

- Get all tokens
```http
GET /api/tokens
```
Response (trimmed):
```json
{
  "success": true,
  "data": [
    {
      "address": "0x...",
      "name": "MyToken",
      "symbol": "MTK",
      "decimals": 18,
      "pool_stats": {
        "hbar_reserves": "123000000000000000000",
        "total_volume": "0",
        "trade_count": 0,
        "is_graduated": false
      },
      "_count": { "trades": 0 }
    }
  ]
}
```

- Get token details
```http
GET /api/tokens/[address]
```

- Search tokens
```http
GET /api/tokens/search?q=query
```

- Trending tokens (top by 24h volume)
```http
GET /api/tokens/trending
```

### Trade Endpoints

- Recent trades (paginated)
```http
GET /api/trades/recent?limit=50&offset=0
```

- Trades for a token
```http
GET /api/trades/[faAddress]
```

### Indexer Endpoints (EVM)

- Metrics (per token)
```http
GET /api/indexer-evm/metrics?tokens=0xTokenA,0xTokenB
```

- Cron snapshot (schedule via Vercel)
```http
GET /api/indexer-evm/cron
```

### Health
```http
GET /api/health
```

---

## 🗄 Database Schema

### Models (see prisma/schema.prisma)

```prisma
model FA {
  address           String   @id
  name              String
  symbol            String
  creator           String
  decimals          Int      @default(8)
  max_supply        Decimal?
  icon_uri          String?
  project_uri       String?
  mint_fee_per_unit Decimal  @default(0)
  created_at        DateTime @default(now())

  trades   Trade[]
  pool_stats PoolStats?
  events   FAEvent[]
}

model Trade {
  id                String   @id @default(cuid())
  transaction_hash  String   @unique
  transaction_version String?
  fa_address        String
  user_address      String
  hbar_amount       Decimal  // HBAR paid/received
  token_amount      Decimal
  price_per_token   Decimal  // HBAR per token
  fee_amount        Decimal  @default(0)
  trade_type        TradeType @default(BUY)
  created_at        DateTime @default(now())

  fa FA @relation(fields: [fa_address], references: [address])
}

model PoolStats {
  fa_address           String  @id
  hbar_reserves        Decimal
  total_volume         Decimal @default(0)
  trade_count          Int     @default(0)
  is_graduated         Boolean @default(false)
  graduation_threshold Decimal @default(21500000000000000000000) // 21,500 HBAR (18dp)
  dex_pool_addr        String?
  updated_at           DateTime @updatedAt

  fa FA @relation(fields: [fa_address], references: [address])
}

model TokenSnapshot {
  id            String  @id @default(cuid())
  token         String
  pool          String
  priceUsd      Decimal
  priceHbar     Decimal
  hbarPriceUsd  Decimal
  reservesHbar  Decimal?
  reservesToken Decimal?
  blockNumber   Int
  blockTime     DateTime
  createdAt     DateTime @default(now())
}

enum TradeType { BUY SELL MINT BURN }

enum EventType { CREATE_FA MINT_FA BURN_FA BUY_TOKENS POOL_GRADUATED }
```
---

## 🚢 Deployment

### Vercel Deployment

#### 1. Prerequisites
- Vercel account
- GitHub repository
- PostgreSQL database (Supabase recommended)

#### 2. Environment Variables

Set in Vercel Dashboard → Settings → Environment Variables:

```env
# Frontend
NEXT_PUBLIC_FACTORY_ADDRESS
NEXT_PUBLIC_HEDERA_RPC_URL
NEXT_PUBLIC_CHAIN_ID
# Router not used (EVM)

# Backend
HEDERA_RPC_URL
CHAIN_ID
FACTORY_ADDRESS

# Database
DATABASE_URL
DIRECT_URL

# Server
NODE_ENV=production
```

#### 3. Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Local vs Production

| Feature | Local | Production (Vercel) |
|---------|-------|---------------------|
| **Indexer Mode** | Dev (optional polling) | Cron-based snapshots (10 min) |
| **Expected Delay** | 1-3 seconds | 1-3 seconds |
| **Database** | Local PostgreSQL | Supabase/Neon |
| **Server** | Node.js | Node.js |

---

## 📂 Project Structure

```
launchpad/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── health/               # Health check endpoint
│   │   ├── indexer-evm/
│   │   │   ├── cron/             # Snapshot trigger (schedule via Vercel Cron)
│   │   │   └── metrics/          # Price/volume metrics for given tokens
│   │   ├── tokens/               # Token endpoints (list, detail, search, trending, registry)
│   │   └── trades/               # Trade endpoints (recent, by token)
│   ├── bonding-curve/            # Trading dashboard page
│   ├── coin/[address]/           # Token detail page
│   ├── launch/                   # Token creation launchpad
│   ├── portfolio/                # User portfolio page
│   ├── layout.tsx                # Root layout with providers
│   ├── page.tsx                  # Home page with hero
│   └── globals.css               # Global styles
├── components/                   # React components
│   ├── ui/                       # Radix UI components
│   ├── wallet/
│   │   ├── EVMWalletProvider.tsx # EVM wallet integration (EIP-1193)

│   ├── BondingCurveTrading.tsx   # Trading interface component (UI)
│   └── ...                       # Header, Footer, Hero, etc.
├── contracts/                    # Solidity smart contracts
│   ├── BondingCurveFactory.sol
│   ├── BondingCurvePool.sol
│   ├── LaunchPadToken.sol
│   └── interfaces/
├── abis/                         # Compiled contract ABIs (JSON)
│   ├── BondingCurveFactory.json
│   ├── BondingCurvePool.json
│   └── LaunchPadToken.json
├── addresses/                    # Deployed addresses per network
│   └── hedera-testnet.json
├── lib/                          # Utilities & services
│   ├── services/evm-indexer.ts   # EVM indexer used by API and cron snapshot
│   ├── types/
│   ├── prisma.ts                 # Prisma database client
│   └── reset-indexer.ts          # Indexer reset utility
├── prisma/                       # Database configuration
│   ├── schema.prisma             # Database schema (FA, Trade, PoolStats, TokenSnapshot)
│   └── migrations/               # Migration files
├── scripts/                      # Deploy and ops scripts
│   ├── deploy-factory.js
│   └── deploy-factory-ethers.js
├── public/                       # Static assets (images, icons, etc.)
├── vercel.json                   # Vercel deployment config
├── next.config.ts                # Next.js configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies & scripts
├── eslint.config.mjs             # ESLint configuration
└── postcss.config.mjs            # PostCSS configuration
```

### Key Directories Explained

**`app/api/`** - Backend API routes
- `indexer-evm/` - EVM indexer snapshot (cron) and metrics endpoints
- `tokens/` - Token operations (list all, get details, search, trending)
- `trades/` - Trading history and recent trades
- `health/` - Application health check

**`contracts/`** - Solidity contracts deployed on Hedera EVM
- Factory, Pool, and Token contracts with interfaces
- ABIs available under `abis/`

**`lib/services/`** - Core services
- `evm-indexer.ts` - Snapshot + metrics helpers for Hedera EVM

**`prisma/`** - Database layer
- Schema defines FA tokens, trades, pool stats, events, and snapshots
- Migrations track database changes

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork the Repository

```bash
git clone https://github.com/auto-defi/AutoDeFiLaunchPad.git
cd AutoDeFiLaunchPad
```

### 2. Create a Branch

```bash
git checkout -b feature/amazing-feature
```

### 3. Make Changes

- Write clean, documented code
- Follow existing code style
- Add tests if applicable
- Update documentation

### 4. Commit Changes

```bash
git add .
git commit -m "Add amazing feature"
```

### 5. Push and Create PR

```bash
git push origin feature/amazing-feature
```

Then open a Pull Request on GitHub.

### Code Style

- **TypeScript** - Strict mode enabled
- **ESLint** - Follow Next.js recommended rules
- **Prettier** - Auto-format on save
- **Naming** - camelCase for variables, PascalCase for components

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Hedera Hashgraph** - For the amazing network and tooling
- **Next.js Team** - For the incredible React framework
- **Vercel** - For seamless deployment
- **Prisma** - For type-safe database access
- **Radix UI** - For accessible component primitives
- **God** - For Giving us life to make this dapp

---

<div align="center">

**Built with ❤️ by the AutoDeFi LaunchPad Team**

[Website](https://AutoDeFi.lol) • [GitHub](https://github.com/auto-defi/AutoDeFiLaunchPad) • [Factory](https://hashscan.io/testnet/contract/0xEEBed6dC5e12Ee6379A59c7C35fF80cE7853FE7B)

</div>
