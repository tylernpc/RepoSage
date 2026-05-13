import path from "node:path";
import {GithubRepoLoader} from "@langchain/community/document_loaders/web/github";
import {RecursiveCharacterTextSplitter} from "@langchain/textsplitters";
import {vectorStore} from "../../../lib/vectorstore";

const langMap = {
  ".js": "js",
  ".ts": "ts",
  ".py": "python",
  ".md": "markdown",
};

// doc LOADER, splitter, and runner
const load = async (repoUrl) => {
  const loader = new GithubRepoLoader(
    repoUrl,
    {
      branch: "main",
      recursive: false,
      unknown: "warn",
      maxConcurrency: 5,
    },
  );

  const docs = await loader.load();
  const splitDocs = await split(docs);
  await store(splitDocs);
};

// doc split
const split = async (docs) => {
  const splitDocs = await Promise.all(
    docs.map(async (doc) => {
      const ext = path.extname(doc.metadata.source ?? "");
      const lang = langMap[ext] ?? "";

      const splitter = RecursiveCharacterTextSplitter.fromLanguage(lang, {
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      return splitter.splitDocuments([doc]);
    }),
  );

  return splitDocs.flat();
};

// doc store
const store = async (splitDocs) => {
  await vectorStore.addDocuments(splitDocs);
};

export async function POST(req) {
  try {
    const { repoUrl } = await req.json();

    if (!repoUrl) {
      return Response.json({ error: "repoUrl is required" }, { status: 400 });
    }

    await load(repoUrl);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}