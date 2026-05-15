import {vectorStore} from "../../../lib/vectorstore";
import {ChatOpenAI} from "@langchain/openai";

const model = new ChatOpenAI({model: "gpt-4o-mini"});

export async function POST(req) {
    try {
        const {question, repoUrl} = await req.json();

        if (!question) return Response.json({error: "question is required"}, {status: 400});

        const filter = repoUrl ? {repo: repoUrl} : {};
        const results = await vectorStore.similaritySearch(question, 4, filter);
        const context = results.map(doc => doc.pageContent).join("\n\n");

        const response = await model.invoke([
            {
                role: "system",
                content: `You are a helpful code assistant. Use the context below to answer questions about this repository. Be generous in what you consider relevant — questions about dependencies, architecture, how things work, and general code questions are all fair game. Only decline if the question is clearly unrelated to software or this codebase entirely.

Context:
${context}`
            },
            {role: "user", content: question},
        ]);

        return Response.json({answer: response.content});
    } catch (error) {
        return Response.json({error: error.message}, {status: 500});
    }
}
