import path from "node:path";
import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";

const langMap = {
  ".js": "js",
  ".ts": "ts",
  ".py": "python",
  ".md": "markdown",
};

const load = async () => {
  const loader = new GithubRepoLoader(
    //todo: tyler - remove link and switch to a user input based link
    "https://github.com/langchain-ai/langchainjs",
    {
      branch: "main",
      recursive: false,
      unknown: "warn",
      maxConcurrency: 5,
    },
  );

  const docs = await loader.load();
  const chunks = await split(docs);
};

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

const run = async () => {
  console.log("Starting...");

  await load();

  console.log("Repo Ingested...");
};

run();
