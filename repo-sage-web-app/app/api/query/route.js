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
                content: `You are a code assistant that answers questions 
                about the provided repository context. If the question is 
                not related to the code or repository, respond with: "I can 
                only answer questions about this repository." Do not answer 
                general programming questions, personal questions, or anything 
                unrelated to the context below. Context: ${context}`
            },
            {role: "user", content: question},
        ]);

        return Response.json({answer: response.content});
    } catch (error) {
        return Response.json({error: error.message}, {status: 500});
    }
}
