import { GithubRepoLoader } from "@langchain/community/document_loaders/web/github";

const run = async () => {
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

  console.log({ docs });
};

run();
