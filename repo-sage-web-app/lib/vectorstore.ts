import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { client } from "./supbase"
import { embeddings } from "./embeddings";

// this basically wires up LangChain up to the exact schema we set in supabase
export const vectorStore = new SupabaseVectorStore(embeddings, {
  client,
  tableName: "documents",
  // match_documents is the the postgres function to call when doing similarity search,
  // this maps to the match_doucments function from our SQL script.
  // langchain calls that function under the hood passing in the query embedding
  queryName: "match_documents",
});
