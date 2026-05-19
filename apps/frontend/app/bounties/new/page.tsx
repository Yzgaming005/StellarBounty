"use client";

import { useState } from "react";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";

/**
 * Create bounty form with live markdown preview.
 * Write/Preview tabs for the description field.
 */
export default function CreateBountyPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [reward, setReward] = useState("");
  const [deadline, setDeadline] = useState("");
  const [activeTab, setActiveTab] = useState<"write" | "preview">("write");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: POST /bounties when backend is ready
    alert("Bounty created! (backend not yet connected)");
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Create a New Bounty</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-1">
              Title
            </label>
            <input
              id="title"
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-slate-100"
              placeholder="e.g. Build a bounty listing page"
            />
          </div>

          {/* Reward + Deadline */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="reward" className="block text-sm font-medium text-slate-300 mb-1">
                Reward (XLM)
              </label>
              <input
                id="reward"
                type="text"
                required
                value={reward}
                onChange={(e) => setReward(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-slate-100"
                placeholder="e.g. 500"
              />
            </div>
            <div>
              <label htmlFor="deadline" className="block text-sm font-medium text-slate-300 mb-1">
                Deadline
              </label>
              <input
                id="deadline"
                type="date"
                required
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:border-blue-500 text-slate-100"
              />
            </div>
          </div>

          {/* Description with Write/Preview tabs */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">
              Description (supports Markdown)
            </label>

            {/* Tabs */}
            <div className="flex border-b border-slate-700 mb-0">
              <button
                type="button"
                onClick={() => setActiveTab("write")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "write"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Write
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === "preview"
                    ? "border-blue-500 text-blue-400"
                    : "border-transparent text-slate-400 hover:text-slate-200"
                }`}
              >
                Preview
              </button>
            </div>

            {/* Content */}
            {activeTab === "write" ? (
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={12}
                className="w-full p-4 bg-slate-900 border border-t-0 border-slate-700 rounded-b-lg font-mono text-sm resize-y focus:outline-none focus:border-blue-500 text-slate-100"
                placeholder="Write your bounty requirements in markdown..."
              />
            ) : (
              <div className="p-4 bg-slate-900 border border-t-0 border-slate-700 rounded-b-lg min-h-[200px]">
                {description ? (
                  <MarkdownRenderer content={description} />
                ) : (
                  <p className="text-slate-500 text-sm italic">Nothing to preview yet...</p>
                )}
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              Create Bounty
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
