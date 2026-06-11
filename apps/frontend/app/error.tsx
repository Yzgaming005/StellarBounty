"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("Unhandled page error:", error);
  }, [error]);

  return (
    <main className="flex min-h-[calc(100vh-73px)] flex-col items-center justify-center bg-slate-950 px-4 text-center text-slate-100">
      <h1 className="text-7xl font-black tracking-tight text-red-500/50">500</h1>
      <p className="mt-4 text-lg text-slate-300">Something went wrong</p>
      <p className="mt-2 max-w-md text-sm text-slate-500">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-blue-500"
      >
        Try again
      </button>
    </main>
  );
}
