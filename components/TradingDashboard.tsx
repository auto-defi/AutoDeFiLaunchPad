"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import { motion } from "framer-motion";
import { XAxis, YAxis, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, TrendingDown, Activity, BarChart3, Zap } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { ethers, Contract } from "ethers";
import { useEVMWallet } from "./wallet/EVMWalletProvider";
import { toast } from "sonner";

// Mock chart data
const chartData = [
  { time: "00:00", price: 0.000042, volume: 120 },
  { time: "04:00", price: 0.000045, volume: 150 },
  { time: "08:00", price: 0.000038, volume: 180 },
  { time: "12:00", price: 0.000052, volume: 220 },
  { time: "16:00", price: 0.000048, volume: 190 },
  { time: "20:00", price: 0.000055, volume: 250 },
  { time: "24:00", price: 0.000061, volume: 280 },
];

const orderBookData = {
  bids: [
    { price: 0.000058, amount: 1250000, total: 72.5 },
    { price: 0.000057, amount: 2100000, total: 119.7 },
    { price: 0.000056, amount: 1800000, total: 100.8 },
    { price: 0.000055, amount: 3200000, total: 176.0 },
    { price: 0.000054, amount: 2500000, total: 135.0 },
  ],
  asks: [
    { price: 0.000062, amount: 1100000, total: 68.2 },
    { price: 0.000063, amount: 1900000, total: 119.7 },
    { price: 0.000064, amount: 1600000, total: 102.4 },
    { price: 0.000065, amount: 2800000, total: 182.0 },
    { price: 0.000066, amount: 2200000, total: 145.2 },
  ]
};

export function TradingDashboard() {
  // Avoid SSR/CSR mismatch from chart measurements
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // EVM wallet and env
  const { account, signer, connected, connect } = useEVMWallet();
  const ROUTER_ADDRESS = process.env.NEXT_PUBLIC_ROUTER_ADDRESS as string | undefined;
  const PUBLIC_RPC = process.env.NEXT_PUBLIC_HEDERA_RPC_URL || "https://testnet.hashio.io/api";

  // Minimal ABIs
  const RouterABI = [
    "function WETH() view returns (address)",
    "function swapExactETHForTokens(uint amountOutMin, address[] calldata path, address to, uint deadline) payable returns (uint[] memory amounts)",
    "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] calldata path, address to, uint deadline) returns (uint[] memory amounts)",
    "function getAmountsOut(uint amountIn, address[] calldata path) view returns (uint[] memory amounts)"
  ];
  const ERC20ABI = [
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function allowance(address owner, address spender) view returns (uint256)",
    "function approve(address spender, uint256 value) returns (bool)",
  ];

  // Quick Trade state
  const [hbarAmount, setHbarAmount] = useState<string>("");
  const [tokenAmount, setTokenAmount] = useState<string>("");
  const [selectedToken, setSelectedToken] = useState<{ address: string; symbol: string; decimals?: number } | null>(null);
  const [loadingToken, setLoadingToken] = useState(false);
  const [slippageBps, setSlippageBps] = useState<number>(100); // 1%

  // Load first trending token (fallback to /api/tokens)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        setLoadingToken(true);
        let tok: any | null = null;
        try {
          const r = await fetch("/api/tokens/trending", { cache: "no-store" });
          if (r.ok) {
            const j = await r.json();
            if (j?.data?.length) tok = j.data[0];
          }
        } catch {}
        if (!tok) {
          try {
            const r2 = await fetch("/api/tokens", { cache: "no-store" });
            if (r2.ok) {
              const j2 = await r2.json();
              if (j2?.data?.length) tok = j2.data[0];
            }
          } catch {}
        }
        if (!tok) return;

        let addr = tok.address || tok.fa_object_addr || tok.fa?.address;
        let sym = tok.symbol || tok.fa?.symbol || "TOKEN";
        let dec = tok.decimals as number | undefined;

        // Ensure decimals using public RPC if missing
        if (!dec && addr) {
          try {
            const provider = new ethers.JsonRpcProvider(PUBLIC_RPC);
            const erc = new Contract(addr, ERC20ABI, provider);
            dec = Number(await erc.decimals());
          } catch {}
        }
        if (!cancelled && addr) setSelectedToken({ address: addr, symbol: sym, decimals: dec });
      } finally {
        if (!cancelled) setLoadingToken(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const ensureEnv = () => {
    if (!ROUTER_ADDRESS) {
      toast.error("Router not configured", {
        description: "Set NEXT_PUBLIC_ROUTER_ADDRESS in your env",
      });
      return false;
    }
    return true;
  };

  const handleBuy = async () => {
    try {
      if (!ensureEnv()) return;
      if (!selectedToken) return toast.error("No token available to trade");
      if (!hbarAmount || Number(hbarAmount) <= 0) return toast.error("Enter HBAR amount");
      if (!connected) await connect();
      if (!signer || !account) return toast.error("Wallet not ready");

      const router = new Contract(ROUTER_ADDRESS!, RouterABI, signer);
      const amountIn = ethers.parseEther(hbarAmount);
      const whbar: string = await router.WETH();
      const path = [whbar, selectedToken.address];
      let amountOutMin = BigInt(0);
      try {
        const amounts: bigint[] = await router.getAmountsOut(amountIn, path);
        const outRaw = amounts[amounts.length - 1];
        amountOutMin = (outRaw * BigInt(10000 - slippageBps)) / BigInt(10000);
      } catch {
        // Router might not expose getAmountsOut; proceed with 0 as min
      }
      const to = account;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);
      const tx = await router.swapExactETHForTokens(amountOutMin, path, to, deadline, { value: amountIn });
      toast.info("Submitting buy transaction...");
      await tx.wait();
      toast.success(`Bought ${selectedToken.symbol}`);
      setHbarAmount("");
    } catch (e: any) {
      const msg = e?.reason || e?.message || String(e);
      toast.error("Buy failed", { description: msg });
    }
  };

  const handleSell = async () => {
    try {
      if (!ensureEnv()) return;
      if (!selectedToken) return toast.error("No token available to trade");
      if (!tokenAmount || Number(tokenAmount) <= 0) return toast.error("Enter token amount");
      if (!connected) await connect();
      if (!signer || !account) return toast.error("Wallet not ready");

      // Ensure decimals
      let decimals = selectedToken.decimals;
      if (!decimals) {
        try {
          const ercRO = new Contract(selectedToken.address, ERC20ABI, signer);
          decimals = Number(await ercRO.decimals());
          setSelectedToken(prev => prev ? { ...prev, decimals } : prev);
        } catch {}
      }
      const amountIn = ethers.parseUnits(tokenAmount, decimals || 18);

      const token = new Contract(selectedToken.address, ERC20ABI, signer);
      const allowance: bigint = await token.allowance(account, ROUTER_ADDRESS!);
      if (allowance < amountIn) {
        const txA = await token.approve(ROUTER_ADDRESS!, ethers.MaxUint256);
        toast.info("Approving token...");
        await txA.wait();
      }

      const router = new Contract(ROUTER_ADDRESS!, RouterABI, signer);
      const whbar: string = await router.WETH();
      const path = [selectedToken.address, whbar];
      let amountOutMin = BigInt(0);
      try {
        const amounts: bigint[] = await router.getAmountsOut(amountIn, path);
        const outRaw = amounts[amounts.length - 1];
        amountOutMin = (outRaw * BigInt(10000 - slippageBps)) / BigInt(10000);
      } catch {}
      const to = account;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 60 * 10);
      const tx = await router.swapExactTokensForETH(amountIn, amountOutMin, path, to, deadline);
      toast.info("Submitting sell transaction...");
      await tx.wait();
      toast.success(`Sold ${selectedToken.symbol}`);
      setTokenAmount("");
    } catch (e: any) {
      const msg = e?.reason || e?.message || String(e);
      toast.error("Sell failed", { description: msg });
    }
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center px-4 py-2 rounded-full glass-morphism border border-primary/30 mb-4">
            <BarChart3 className="w-4 h-4 text-accent mr-2" />
            <span className="text-sm">Live Trading</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold mb-4">
            Advanced <span className="text-gradient-primary">Trading</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Professional trading interface with real-time charts, order books, and advanced analytics.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Chart Section */}
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="xl:col-span-3 space-y-6"
          >
            {/* Token Info */}
            <Card className="glass-morphism border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center neon-glow-pink">
                      <span className="font-bold text-white">MD</span>
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">MoonDoge / USDT</h3>
                      <p className="text-muted-foreground">MDOGE</p>
                    </div>
                  </div>
                  <Badge className="bg-accent/20 text-accent border-accent/30">
                    🔥 HOT
                  </Badge>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <StatItem
                    label="Price"
                    value="$0.000061"
                    change="+45.2%"
                    positive={true}
                  />
                  <StatItem
                    label="24h Volume"
                    value="$1.2M"
                    change="+23%"
                    positive={true}
                  />
                  <StatItem
                    label="Market Cap"
                    value="$8.4M"
                    change="+18%"
                    positive={true}
                  />
                  <StatItem
                    label="Holders"
                    value="2,847"
                    change="+156"
                    positive={true}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Chart */}
            <Card className="glass-morphism border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Price Chart</span>
                  <Tabs defaultValue="1h" className="w-auto">
                    <TabsList className="bg-muted/20">
                      <TabsTrigger value="1h">1H</TabsTrigger>
                      <TabsTrigger value="1d">1D</TabsTrigger>
                      <TabsTrigger value="1w">1W</TabsTrigger>
                      <TabsTrigger value="1m">1M</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {mounted ? (
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--neon-green)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--neon-green)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis
                          dataKey="time"
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                        />
                        <YAxis
                          axisLine={false}
                          tickLine={false}
                          tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }}
                          tickFormatter={(value) => `$${value.toFixed(6)}`}
                        />
                        <Area
                          type="monotone"
                          dataKey="price"
                          stroke="var(--neon-green)"
                          fillOpacity={1}
                          fill="url(#colorPrice)"
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="h-80" />
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Trading Panel */}
          <motion.div
            initial={{ x: 50, opacity: 0 }}
            whileInView={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Trading Form */}
            <Card className="glass-morphism border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg">Quick Trade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs defaultValue="buy" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy" className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground">
                      Buy
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground">
                      Sell
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="buy" className="space-y-4 mt-4">
                    <div className="text-sm text-muted-foreground">
                      {loadingToken ? "Loading token..." : selectedToken ? `Token: ${selectedToken.symbol}` : "No token available"}
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Amount (HBAR)</label>
                      <Input placeholder="0.00" className="mt-1" value={hbarAmount} onChange={(e) => setHbarAmount(e.target.value)} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Slippage</span>
                      <div className="flex gap-2">
                        {[50,100,200].map(opt => (
                          <Button key={opt} type="button" variant={slippageBps===opt?"default":"outline"} size="sm"
                            className={slippageBps===opt?"px-2 py-1 h-7":"px-2 py-1 h-7"}
                            onClick={() => setSlippageBps(opt)}>
                            {(opt/100).toFixed(1)}%
                          </Button>
                        ))}
                      </div>
                    </div>
                    {!connected ? (
                      <Button onClick={connect} className="w-full bg-gradient-secondary neon-glow-green hover:neon-glow-cyan transition-all duration-300">
                        <Zap className="w-4 h-4 mr-2" />
                        Connect Wallet
                      </Button>
                    ) : (
                      <Button onClick={handleBuy} disabled={!selectedToken || !hbarAmount} className="w-full bg-gradient-secondary neon-glow-green hover:neon-glow-cyan transition-all duration-300">
                        <Zap className="w-4 h-4 mr-2" />
                        {`Buy ${selectedToken?.symbol || "Token"}`}

                      </Button>
                    )}
                  </TabsContent>

                  <TabsContent value="sell" className="space-y-4 mt-4">
                    <div className="text-sm text-muted-foreground">
                      {loadingToken ? "Loading token..." : selectedToken ? `Token: ${selectedToken.symbol}` : "No token available"}
                    </div>
                    <div>
                      <label className="text-sm text-muted-foreground">Amount ({selectedToken?.symbol || "Token"})</label>
                      <Input placeholder="0.00" className="mt-1" value={tokenAmount} onChange={(e) => setTokenAmount(e.target.value)} />
                    </div>
                    {!connected ? (
                      <Button onClick={connect} className="w-full bg-destructive neon-glow-pink hover:neon-glow-cyan transition-all duration-300">
                        <TrendingDown className="w-4 h-4 mr-2" />
                        Connect Wallet
                      </Button>
                    ) : (
                      <Button onClick={handleSell} disabled={!selectedToken || !tokenAmount} className="w-full bg-destructive neon-glow-pink hover:neon-glow-cyan transition-all duration-300">
                        <TrendingDown className="w-4 h-4 mr-2" />
                        {`Sell ${selectedToken?.symbol || "Token"}`}
                      </Button>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Slippage</span>
                      <div className="flex gap-2">
                        {[50,100,200].map(opt => (
                          <Button key={opt} type="button" variant={slippageBps===opt?"default":"outline"} size="sm"
                            className={slippageBps===opt?"px-2 py-1 h-7":"px-2 py-1 h-7"}
                            onClick={() => setSlippageBps(opt)}>
                            {(opt/100).toFixed(1)}%
                          </Button>
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {/* Order Book */}
            <Card className="glass-morphism border-primary/20">
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Order Book
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground grid grid-cols-3 gap-2 mb-2">
                    <span>Price</span>
                    <span>Amount</span>
                    <span>Total</span>
                  </div>

                  {/* Asks */}
                  <div className="space-y-1">
                    {[...orderBookData.asks].reverse().map((ask, index) => (
                      <div key={index} className="text-xs grid grid-cols-3 gap-2 text-destructive">
                        <span>{ask.price.toFixed(6)}</span>
                        <span>{(ask.amount / 1000000).toFixed(1)}M</span>
                        <span>${ask.total.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>

                  {/* Spread */}
                  <div className="py-2 text-center border-y border-border">
                    <span className="text-xs text-muted-foreground">Spread: 0.000004</span>
                  </div>

                  {/* Bids */}
                  <div className="space-y-1">
                    {orderBookData.bids.map((bid, index) => (
                      <div key={index} className="text-xs grid grid-cols-3 gap-2 text-accent">
                        <span>{bid.price.toFixed(6)}</span>
                        <span>{(bid.amount / 1000000).toFixed(1)}M</span>
                        <span>${bid.total.toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function StatItem({ label, value, change, positive }: {
  label: string;
  value: string;
  change: string;
  positive: boolean;
}) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="text-lg font-bold">{value}</p>
      <p className={`text-sm flex items-center ${positive ? "text-accent" : "text-destructive"}`}>
        {positive ? (
          <TrendingUp className="w-3 h-3 mr-1" />
        ) : (
          <TrendingDown className="w-3 h-3 mr-1" />
        )}
        {change}
      </p>
    </div>
  );
}