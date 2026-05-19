"use client";

import { useState } from "react";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";

/**
 * Bounty detail page with markdown-rendered description.
 * Uses mock data since backend is not yet connected.
 */
export default function BountyDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState<"write" | "preview">("preview");

  // Mock bounty data — replace with API call when backend is ready
  const bounty = {
    id: params.id,
    title: "Build a bounty listing page",
    description: `## Summary\n\nThe home page is a static placeholder. Build a real bounty listing page that fetches from the backend.\n\n## Acceptance Criteria\n\n- [ ] \`GET /bounties\` fetched server-side with Next.js \`fetch\`\n- [ ] Display bounty cards with title, reward, deadline\n- [ ] Filter by status (open, in-progress, completed)\n- [ ] Sort by reward amount or deadline\n- [ ] Loading skeleton while fetching\n- [ ] Empty state when no bounties match filters\n\n## Tech Notes\n\n- Use \`fetch(\`\${process.env.NEXT_PUBLIC_API_URL}/bounties\`)\`\n- Tailwind for styling\n- \`@/app/components/BountyCard.tsx\` for individual cards`,
    reward: "500 XLM",
    status: "open",
    deadline: "2026-06-18",
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2 py-0.5 text-xs font-medium rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              {bounty.status}
            </span>
            <span className="text-sm text-slate-400">Reward: {bounty.reward}</span>
            <span className="text-sm text-slate-400">Deadline: {bounty.deadline}</span>
          </div>
          <h1 className="text-2xl font-bold">{bounty.title}</h1>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 mb-6">
          <button
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "preview"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab("write")}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === "write"
                ? "border-blue-500 text-blue-400"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            Write
          </button>
        </div>

        {/* Content */}
        {activeTab === "preview" ? (
          <MarkdownRenderer content={bounty.description} className="p-4 bg-slate-900 rounded-lg" />
        ) : (
          <textarea
            className="w-full h-96 bg-slate-900 text-slate-100 p-4 rounded-lg font-mono text-sm resize-y border border-slate-700 focus:outline-none focus:border-blue-500"
            defaultValue={bounty.description}
          />
        )}

        {/* Submit button */}
        <div className="mt-6 flex justify-end">
          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors">
            Claim Bounty
          </button>
        </div>
      </div>
    </main>
  );
}
