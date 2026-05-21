import Link from "next/link";
import BountyCard, { type BountyCardData } from "@/app/components/BountyCard";

export const revalidate = 60;

type ApiBounty = Partial<BountyCardData> & {
  _id?: string;
  amount?: string | number | null;
  rewardAmount?: string | number | null;
  dueDate?: string | null;
};

async function getBounties(): Promise<BountyCardData[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  try {
    const response = await fetch(`${apiUrl}/bounties`, { next: { revalidate } });

    if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
      return [];
    }

    const bounties = (await response.json()) as ApiBounty[];

    return bounties.map((bounty, index) => ({
      id: bounty.id ?? bounty._id ?? index,
      title: bounty.title ?? "Untitled bounty",
      reward: bounty.reward ?? bounty.rewardAmount ?? bounty.amount ?? null,
      deadline: bounty.deadline ?? bounty.dueDate ?? null,
      status: bounty.status ?? "open",
    }));
  } catch {
    return [];
  }
}

export default async function Home() {
  const bounties = await getBounties();

  return (
    <main className="min-h-[calc(100vh-73px)] bg-slate-950 px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <section className="mb-10 flex flex-col justify-between gap-6 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-6 shadow-2xl shadow-black/20 sm:p-8 lg:flex-row lg:items-end">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-yellow-400">StellarBounty</p>
            <h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">
              Open bounties ready for builders
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-400">
              Browse funded work, compare rewards and deadlines, then jump into a task that matches your skills.
            </p>
          </div>
          <Link
            href="/bounties/new"
            className="inline-flex items-center justify-center rounded-xl bg-yellow-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-yellow-300"
          >
            Create Bounty
          </Link>
        </section>

        {bounties.length > 0 ? (
          <section className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {bounties.map((bounty) => (
              <BountyCard key={bounty.id} bounty={bounty} />
            ))}
          </section>
        ) : (
          <section className="rounded-3xl border border-dashed border-slate-700 bg-slate-900/50 px-6 py-16 text-center">
            <p className="text-lg font-semibold text-slate-200">No bounties available yet.</p>
            <p className="mt-2 text-slate-400">Create the first bounty and bring new work onto Stellar.</p>
            <Link
              href="/bounties/new"
              className="mt-6 inline-flex rounded-xl border border-slate-700 px-5 py-3 font-medium text-slate-200 transition hover:border-yellow-400 hover:text-yellow-300"
            >
              Post a bounty
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
