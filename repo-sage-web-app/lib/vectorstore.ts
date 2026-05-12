import { MemoryVectorStore } from "@langchain/classic/vectorstores/memory";
import { embeddings } from "./embeddings.js";

export const vectorStore = new MemoryVectorStore(embeddings);
