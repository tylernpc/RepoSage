"use client";

import React, {useState, useEffect} from "react";
import {Status} from "@/lib/types";
import type {Document} from "@/lib/types";


export default function Home() {
    const [repoUrl, setRepoUrl] = useState("");
    const [status, setStatus] = useState<Status>(Status.Idle);
    const [error, setError] = useState("");
    const [documents, setDocuments] = useState<Document[]>([]);

    const fetchDocuments = async () => {
        const res = await fetch("/api/supabase");
        const data = await res.json();
        if (res.ok) {
            setDocuments(data.data);
        }
    };

    useEffect(() => {
        fetch("/api/supabase")
            .then((res) => res.json())
            .then(({data}) => setDocuments(data ?? []));
    }, []);

    const handleSubmit = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setStatus(Status.Loading);
        setError("");

        // storing vector data api call
        try {
            const res = await fetch("/api/vector", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({repoUrl}),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error ?? "Something went wrong");
            }

            setStatus(Status.Success);
            setRepoUrl("");
            await fetchDocuments();
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setStatus(Status.Error);
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
                            disabled={status === Status.Loading || !repoUrl}
                            className="bg-white text-black font-medium text-sm px-5 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {status === Status.Loading ? "Ingesting..." : "Ingest Repo"}
                        </button>
                    </div>
                </form>

                {/* Status */}
                {status === Status.Success && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-emerald-400">
                        Repository ingested successfully. Ready to query.
                    </div>
                )}
                {status === Status.Error && (
                    <div className="bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-red-400">
                        {error}
                    </div>
                )}

                {/* Footer hint */}
                <p className="text-xs text-zinc-600">
                    Paste a public GitHub repo URL above to embed its contents into the vector database.
                </p>

                {/* Documents table */}
                {documents.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                            documents <span className="text-zinc-600">({documents.length} rows)</span>
                        </h2>
                        <div className="rounded-lg border border-zinc-800 overflow-hidden">
                            <div className="overflow-x-auto max-h-80 overflow-y-auto">
                                <table className="w-full text-xs">
                                    <thead>
                                    <tr className="border-b border-zinc-800 bg-zinc-900/80 sticky top-0">
                                        <th className="text-left px-3 py-2 text-zinc-500 font-medium w-12">id</th>
                                        <th className="text-left px-3 py-2 text-zinc-500 font-medium">source</th>
                                        <th className="text-left px-3 py-2 text-zinc-500 font-medium">content</th>
                                        <th className="text-left px-3 py-2 text-zinc-500 font-medium w-20">status</th>
                                        <th className="text-left px-3 py-2 text-zinc-500 font-medium w-24">created_at</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {documents.map((doc, i) => (
                                        <tr
                                            key={doc.id}
                                            className={`border-b border-zinc-800/50 hover:bg-zinc-900/40 transition-colors ${i === documents.length - 1 ? "border-b-0" : ""}`}
                                        >
                                            <td className="px-3 py-2 text-zinc-600 font-mono">{doc.id}</td>
                                            <td className="px-3 py-2 text-zinc-400 font-mono max-w-35 truncate">
                                                {(doc.metadata?.source as string) ?? "—"}
                                            </td>
                                            <td className="px-3 py-2 text-zinc-400 max-w-50 truncate">{doc.content}</td>
                                            <td className="px-3 py-2">
                                                <span className="text-amber-500/80">{doc.status ?? "—"}</span>
                                            </td>
                                            <td className="px-3 py-2 text-zinc-600 font-mono whitespace-nowrap">
                                                {new Date(doc.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
