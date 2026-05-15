import {vectorStore} from "../../../lib/vectorstore";
import {ChatOpenAI} from "@langchain/openai";

const model = new ChatOpenAI({model: "gpt-4o-mini"});

export async function POST(req) {
    try {
        const {question} = await req.json();

        if (!question) return Response.json({error: "question is required"}, {status: 400});

        const results = await vectorStore.similaritySearch(question, 4);
        const context = results.map(doc => doc.pageContent).join("\n\n");

        const response = await model.invoke([
            {role: "system", content: `Answer using this context:\n\n${context}`},
            {role: "user", content: question},
        ]);

        return Response.json({answer: response.content});
    } catch (error) {
        return Response.json({error: error.message}, {status: 500});
    }
}
