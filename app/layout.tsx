import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "../components/ThemeProvider";
import { EVMWalletProvider } from "../components/wallet/EVMWalletProvider";
// import BackgroundLiquidChrome from "../components/BackgroundLiquidChrome";



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AutoDeFi",
  description: "AutoDeFi - Bonding curve token launchpad on Hedera Testnet (EVM)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <EVMWalletProvider>
          {/* <BackgroundLiquidChrome /> */}
          <ThemeProvider>{children}</ThemeProvider>
        </EVMWalletProvider>
      </body>
    </html>
  );
}
