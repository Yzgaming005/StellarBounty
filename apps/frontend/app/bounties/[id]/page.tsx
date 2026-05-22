import BountyDetailClient from "./BountyDetailClient";

type Bounty = {
  id: string;
  title: string;
  description: string;
  reward: string;
  deadline: string;
  status: "open" | "in-progress" | "completed";
  ownerAddress: string;
};

const mockBounties: Bounty[] = [
  {
    id: "demo",
    title: "Build a bounty listing page",
    description:
      "Create a browsable bounty marketplace landing page with filters, sorting, loading states, and an empty state for the StellarBounty frontend.",
    reward: "500 XLM",
    deadline: "2026-06-18",
    status: "open",
    ownerAddress: "GAFD5P2D6MX3QJ4S5Z6L7A8B9C0D1E2F3G4H5I6J7K8L9M0N1OP2QR3",
  },
  {
    id: "detail-page",
    title: "Build a bounty detail page",
    description:
      "Create a dynamic detail view that shows the full bounty brief, owner, reward, deadline, status, and lets connected users submit completed work.",
    reward: "650 XLM",
    deadline: "2026-07-02",
    status: "open",
    ownerAddress: "GCKFBEIYTKP7THSR5SQX4MF2ZW3ZHRLDMW4U74JVGHWA5WYUSM4B4D2K",
  },
  {
    id: "archived-brand-kit",
    title: "Refresh archived brand kit",
    description: "Update an older brand kit package and document the assets for future community campaigns.",
    reward: "120 XLM",
    deadline: "2026-05-08",
    status: "completed",
    ownerAddress: "GB3QW7BPNFOK6LFTJY5MTQUP7ACX6U2OTSN2KZOLKGNHQUHYYJDBV6QM",
  },
];

async function getBounties(): Promise<Bounty[]> {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;

  if (!apiUrl) {
    return mockBounties;
  }

  try {
    const response = await fetch(`${apiUrl}/bounties`, { next: { revalidate: 60 } });

    if (!response.ok) {
      return mockBounties;
    }

    return response.json();
  } catch {
    return mockBounties;
  }
}

export async function generateStaticParams() {
  const bounties = await getBounties();

  return bounties.map((bounty) => ({ id: bounty.id }));
}

export default async function BountyDetailPage({ params }: { params: { id: string } }) {
  const bounties = await getBounties();
  const bounty = bounties.find((item) => item.id === params.id) ?? mockBounties[1];

  return <BountyDetailClient bounty={bounty} />;
}
