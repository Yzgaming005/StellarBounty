import type { Metadata } from "next";
import { absoluteUrl, siteName } from "../seo";

const description = "Review your StellarBounty submissions and posted bounties.";

export const metadata: Metadata = {
  title: "Dashboard",
  description,
  alternates: {
    canonical: absoluteUrl("/dashboard"),
  },
  openGraph: {
    title: `Dashboard | ${siteName}`,
    description,
    url: absoluteUrl("/dashboard"),
    type: "website",
  },
  twitter: {
    card: "summary",
    title: `Dashboard | ${siteName}`,
    description,
  },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
