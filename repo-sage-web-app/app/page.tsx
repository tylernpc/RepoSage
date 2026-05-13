"use client";

import { useState } from "react";

type Status = "idle" | "loading" | "success" | "error";

export default function Home() {
  const [repoUrl, setRepoUrl] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setError("");

    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrl }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? "Something went wrong");
      }

      setStatus("success");
      setRepoUrl("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  return (
    <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xl flex flex-col gap-8">

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl">&#x1F333;</span>
            <h1 className="text-3xl font-semibold tracking-tight">RepoSage</h1>
          </div>
          <p className="text-zinc-400 text-sm">
            Chat with any GitHub repository using RAG and LangChain.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
            GitHub Repository URL
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              required
              disabled={status === "loading"}
              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "loading" || !repoUrl}
              className="bg-white text-black font-medium text-sm px-5 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {status === "loading" ? "Ingesting..." : "Ingest Repo"}
            </button>
          </div>
        </form>

        {/* Status */}
        {status === "success" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-emerald-400">
            Repository ingested successfully. Ready to query.
          </div>
        )}
        {status === "error" && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Footer hint */}
        <p className="text-xs text-zinc-600">
          Paste a public GitHub repo URL above to embed its contents into the vector database.
        </p>
      </div>
    </main>
  );
}
