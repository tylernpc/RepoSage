# RepoSage

Chat with any GitHub repository using RAG (Retrieval Augmented Generation), LangChain, and Supabase.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square) ![LangChain](https://img.shields.io/badge/LangChain-1.x-green?style=flat-square) ![Supabase](https://img.shields.io/badge/Supabase-pgvector-brightgreen?style=flat-square)

https://github.com/user-attachments/assets/aa5bb464-e354-4bcd-a422-af26fc62d498

## How It Works

1. Paste a public GitHub repo URL
2. RepoSage loads every file, splits it into chunks, and embeds them using OpenAI
3. Embeddings are stored in Supabase with pgvector
4. Ask questions in natural language — your query is embedded and matched against the stored chunks via similarity search
5. The most relevant code chunks are passed to the LLM as context to generate an answer

```
GitHub Repo → GithubRepoLoader → RecursiveCharacterTextSplitter → OpenAI Embeddings → Supabase (pgvector)
                                                                                              ↓
User Query → Embed Query → Similarity Search → Relevant Chunks → LLM (gpt-4o-mini) → Answer
```

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| AI Orchestration | LangChain |
| Embeddings | OpenAI `text-embedding-3-small` |
| LLM | OpenAI `gpt-4o-mini` |
| Vector Store | Supabase + pgvector |
| UI | React 19, Tailwind CSS v4 |

## Getting Started

### Prerequisites

- Node.js 18+
- OpenAI API key
- Supabase project with pgvector enabled
- GitHub personal access token (classic, with `repo` scope)

### Setup

1. Clone the repo and install dependencies:

```bash
git clone https://github.com/tylernpc/RepoSage.git
cd RepoSage/repo-sage-web-app
npm install
```

2. Create a `.env.local` file:

```env
OPENAI_API_KEY=your_openai_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SECRET_KEY=your_supabase_service_role_key
GITHUB_ACCESS_TOKEN=your_github_classic_token
```

3. Set up the Supabase database. Run the following in the Supabase SQL editor:

```sql
create extension if not exists vector;

create table documents (
  id bigserial primary key,
  content text,
  metadata jsonb,
  embedding vector(1536),
  created_at timestamptz default now(),
  status text default 'pending',
  checksum text
);

create index on documents using ivfflat (embedding vector_cosine_ops);

create or replace function match_documents (
  query_embedding vector(1536),
  match_count int default null,
  filter jsonb default '{}'
) returns table (
  id bigint,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
as $$
#variable_conflict use_column
begin
  return query
  select
    id,
    content,
    metadata,
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  where metadata @> filter
  order by documents.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

4. Start the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Paste a public GitHub repo URL into the input and click **Ingest Repo**
2. Wait for ingestion to complete (time varies by repo size)
3. Ask questions about the codebase in the chat
4. Re-ingesting the same repo replaces existing chunks automatically

## API Routes

| Method | Route | Description |
|---|---|---|
| `POST` | `/api/vector` | Ingest a GitHub repo into the vector store |
| `POST` | `/api/query` | Query the vector store and return an LLM response |
| `GET` | `/api/supabase` | Fetch stored document chunks for display |

## Notes

- Avoid repos with committed `node_modules`, `bin`, or `obj` directories — they cause excessive GitHub API calls during traversal
- Re-ingesting a repo clears existing chunks for that repo before storing new ones
- Each chunk stores the source file path and repo URL in its metadata for filtering
