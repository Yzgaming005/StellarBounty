export const siteUrl = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://stellar-bounty.example.com");

export const siteName = "StellarBounty";

export const defaultDescription =
  "Discover, fund, and submit work for decentralized bounties on Stellar.";

export function absoluteUrl(path = "/") {
  return new URL(path, siteUrl).toString();
}
