import {vectorStore} from "../../../lib/vectorstore";
import {ChatOpenAI} from "@langchain/openai";

const model = new ChatOpenAI({model: "gpt-4o-mini"});

export async function POST(req) {
    const {question} = await req.json();

    const results = await vectorStore.similaritySearch(question,
        4);
    const context = results.map(doc =>
        doc.pageContent).join("\n\n");

    const response = await model.invoke([
        {role: "system", content: `Answer using thiscontext:\n\n${context}`},
        {role: "user", content: question},
    ]);

    return Response.json({answer: response.content});
}
