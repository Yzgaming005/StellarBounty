import type { Metadata } from "next";
import { ConnectWalletButton } from "../components/ConnectWalletButton";
import { WalletProvider } from "../components/WalletContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "StellarBounty",
  description: "Decentralized bounty marketplace on Stellar.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <WalletProvider>
          <div className="min-h-screen bg-slate-950 text-slate-100">
            <header className="border-b border-slate-800">
              <nav className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
                <a href="/" className="text-lg font-semibold tracking-normal text-slate-50">
                  StellarBounty
                </a>
                <ConnectWalletButton />
              </nav>
            </header>
            {children}
          </div>
        </WalletProvider>
      </body>
    </html>
  );
}
