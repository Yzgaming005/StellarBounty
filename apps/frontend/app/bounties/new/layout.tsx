import type { Metadata } from "next";
import { absoluteUrl, siteName } from "../../seo";

const description = "Create a Stellar bounty with reward, deadline, and markdown requirements.";

export const metadata: Metadata = {
  title: "Create Bounty",
  description,
  alternates: {
    canonical: absoluteUrl("/bounties/new"),
  },
  openGraph: {
    title: `Create Bounty | ${siteName}`,
    description,
    url: absoluteUrl("/bounties/new"),
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Create Bounty | ${siteName}`,
    description,
  },
};

export default function CreateBountyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
