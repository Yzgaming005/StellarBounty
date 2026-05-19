import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">StellarBounty</h1>
        <p className="mt-3 text-slate-400">Decentralized bounty marketplace on Stellar.</p>
        <div className="mt-8 flex gap-4 justify-center">
          <Link
            href="/bounties/new"
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
          >
            Create Bounty
          </Link>
          <Link
            href="/bounties/demo"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-lg border border-slate-700 transition-colors"
          >
            View Demo Bounty
          </Link>
        </div>
      </div>
    </main>
  );
}
