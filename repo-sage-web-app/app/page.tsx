"use client";

import React, {useState, useEffect, useRef} from "react";
import ReactMarkdown from "react-markdown";
import {Status} from "@/lib/types";
import type {Document, Message} from "@/lib/types";

export default function Home() {
    const [repoUrl, setRepoUrl] = useState("");
    const [ingestStatus, setIngestStatus] = useState<Status>(Status.Idle);
    const [ingestError, setIngestError] = useState("");
    const [documents, setDocuments] = useState<Document[]>([]);

    const [activeRepo, setActiveRepo] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [question, setQuestion] = useState("");
    const [queryLoading, setQueryLoading] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch("/api/supabase")
            .then((res) => res.json())
            .then(({data}) => setDocuments(data ?? []));
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({behavior: "smooth"});
    }, [messages]);

    const fetchDocuments = async () => {
        const res = await fetch("/api/supabase");
        const data = await res.json();

        if (res.ok) {
            setDocuments(data.data);
        }
    };

    const handleIngest = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIngestStatus(Status.Loading);
        setIngestError("");

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

            setIngestStatus(Status.Success);
            setActiveRepo(repoUrl);
            setMessages([]);
            setRepoUrl("");
            await fetchDocuments();
        } catch (err: unknown) {
            setIngestError(err instanceof Error ? err.message : "Something went wrong");
            setIngestStatus(Status.Error);
        }
    };

    const handleQuery = async (e: React.SyntheticEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!question.trim()) {
            return;
        }

        const userMessage: Message = {role: "user", content: question};
        setMessages((prev) => [...prev, userMessage]);
        setQuestion("");
        setQueryLoading(true);

        try {
            const res = await fetch("/api/query", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({question: userMessage.content, repoUrl: activeRepo}),
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error ?? "Something went wrong");
            }

            setMessages((prev) => [...prev, {role: "assistant", content: data.answer}]);
        } catch (err: unknown) {
            setMessages((prev) => [
                ...prev,
                {role: "assistant", content: err instanceof Error ? err.message : "Something went wrong"},
            ]);
        } finally {
            setQueryLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center px-4 py-12">
            <div className="w-full max-w-2xl flex flex-col gap-10">

                {/* Header */}
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl">&#x1F333;</span>
                        <h1 className="text-3xl font-semibold tracking-tight">RepoSage</h1>
                    </div>
                    <p className="text-zinc-400 text-sm">Chat with any GitHub repository using RAG and LangChain.</p>
                </div>

                {/* Ingest */}
                <div className="flex flex-col gap-3">
                    <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                        GitHub Repository URL
                    </label>
                    <form onSubmit={handleIngest} className="flex gap-2">
                        <input
                            type="url"
                            value={repoUrl}
                            onChange={(e) => setRepoUrl(e.target.value)}
                            placeholder="https://github.com/owner/repo"
                            required
                            disabled={ingestStatus === Status.Loading}
                            className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors disabled:opacity-50"
                        />
                        <button
                            type="submit"
                            disabled={ingestStatus === Status.Loading || !repoUrl}
                            className="bg-white text-black font-medium text-sm px-5 py-3 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
                        >
                            {ingestStatus === Status.Loading ? "Ingesting..." : "Ingest Repo"}
                        </button>
                    </form>
                    {ingestStatus === Status.Success && (
                        <p className="text-xs text-emerald-400">Repository ingested successfully.</p>
                    )}
                    {ingestStatus === Status.Error && (
                        <p className="text-xs text-red-400">{ingestError}</p>
                    )}
                </div>

                {/* Chat */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                            Ask the repo
                        </label>
                        {activeRepo && (
                            <span className="text-xs text-zinc-600 font-mono truncate max-w-[60%]">{activeRepo}</span>
                        )}
                    </div>
                    <div
                        className="rounded-lg border border-zinc-800 bg-zinc-900/40 flex flex-col min-h-64 max-h-120">
                        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
                            {messages.length === 0 ? (
                                <p className="text-zinc-600 text-sm m-auto">
                                    {!activeRepo ? "Ingest a repo to get started." : "Ask a question about the repo."}
                                </p>
                            ) : (
                                messages.map((msg, i) => (
                                    <div key={i}
                                         className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                        <div
                                            className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                                                msg.role === "user"
                                                    ? "bg-white text-black"
                                                    : "bg-zinc-800 text-zinc-200"
                                            }`}
                                        >
                                            {msg.role === "user" ? msg.content : (
                                                <div className="prose prose-sm prose-invert max-w-none">
                                                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                            {queryLoading && (
                                <div className="flex justify-start">
                                    <div
                                        className="bg-zinc-800 rounded-lg px-4 py-2 text-sm text-zinc-500">Thinking...
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef}/>
                        </div>

                        <form onSubmit={handleQuery} className="border-t border-zinc-800 flex gap-2 p-3">
                            <input
                                type="text"
                                value={question}
                                onChange={(e) => setQuestion(e.target.value)}
                                placeholder="Ask a question..."
                                disabled={queryLoading || !activeRepo}
                                className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2 text-sm text-white placeholder-zinc-600 outline-none focus:border-zinc-600 transition-colors disabled:opacity-50"
                            />
                            <button
                                type="submit"
                                disabled={queryLoading || !question.trim() || !activeRepo}
                                className="bg-white text-black font-medium text-sm px-4 py-2 rounded-lg hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                                Send
                            </button>
                        </form>
                    </div>
                </div>

                {/* Documents table */}
                {documents.length > 0 && (
                    <div className="flex flex-col gap-3">
                        <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-widest">
                            stored documents <span className="text-zinc-600">({documents.length} chunks)</span>
                        </h2>
                        <div className="rounded-lg border border-zinc-800 overflow-hidden">
                            <div className="overflow-x-auto max-h-64 overflow-y-auto">
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
