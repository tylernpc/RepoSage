import { ChatOpenAI } from "@langchain/openai";

const model = new ChatOpenAI({
  model: "gpt-5.4",
  apiKey: process.env.OPENAI_API_KEY
});
