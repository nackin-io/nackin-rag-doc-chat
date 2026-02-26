# 🧠 RAG Document Intelligence Chat

AI-powered document Q&A — upload PDFs, ask questions, get cited answers using retrieval augmented generation.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://rag-doc-chat.vercel.app)
[![GitHub stars](https://img.shields.io/github/stars/nackin/rag-doc-chat?style=flat-square)](https://github.com/nackin/rag-doc-chat)

![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000?style=flat-square&logo=vercel)

---

## Features

- 📄 **PDF Upload** — Drag & drop with progress indicator, validation, and Supabase Storage
- 🔍 **RAG Pipeline** — Parse → Chunk → Embed → Store → Retrieve with pgvector similarity search
- 💬 **Streaming Chat** — Real-time AI responses with typewriter effect and conversation history
- 📎 **Source Citations** — Expandable citation chips showing matched document chunks with similarity scores
- 🌗 **Dark Mode** — System-aware theme toggle persisted in localStorage
- 📱 **Responsive** — Mobile-first design with collapsible sidebar
- 🗂️ **Multi-Document** — Chat with a specific document or across all uploads

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────────┐
│   Browser     │────▶│  Next.js API │────▶│  OpenAI API      │
│  (React UI)   │     │   Routes     │     │  GPT-4o / embed  │
└──────────────┘     └──────┬───────┘     └──────────────────┘
                            │
                            ▼
                    ┌───────────────┐
                    │   Supabase    │
                    │  ┌─────────┐  │
                    │  │pgvector │  │
                    │  │ chunks  │  │
                    │  └─────────┘  │
                    │  ┌─────────┐  │
                    │  │ Storage │  │
                    │  │  PDFs   │  │
                    │  └─────────┘  │
                    └───────────────┘
```

**How it works:**

1. **Upload** — PDF is uploaded to Supabase Storage and a document record is created
2. **Process** — `pdf-parse` extracts text, a recursive character splitter creates overlapping chunks (1000 chars, 200 overlap)
3. **Embed** — Each chunk is embedded via OpenAI `text-embedding-3-small` (1536 dimensions)
4. **Store** — Chunks + embeddings are stored in Supabase with pgvector
5. **Query** — User message is embedded, pgvector finds top 5 similar chunks via cosine distance
6. **Answer** — GPT-4o generates a streaming answer grounded in the retrieved context with source citations

## Quick Start

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project (free tier works)
- [OpenAI API key](https://platform.openai.com/api-keys)

### 1. Clone & Install

```bash
git clone https://github.com/nackin/rag-doc-chat.git
cd rag-doc-chat
npm install
```

### 2. Environment Variables

Copy the example and fill in your keys:

```bash
cp .env.local.example .env.local
```

| Variable | Description |
|---|---|
| `OPENAI_API_KEY` | OpenAI API key for embeddings & chat |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

### 3. Supabase Setup

Run this SQL in your Supabase SQL Editor to create the required tables and functions:

```sql
-- Enable pgvector
create extension if not exists vector;

-- Documents table
create table documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size integer,
  status text default 'processing',
  created_at timestamptz default now()
);

-- Chunks table with vector embeddings
create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  chunk_index integer,
  created_at timestamptz default now()
);

-- Vector similarity search function
create or replace function match_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_doc_id uuid default null
)
returns table (
  id uuid,
  document_id uuid,
  content text,
  similarity float
)
language sql stable
as $$
  select
    id,
    document_id,
    content,
    1 - (embedding <=> query_embedding) as similarity
  from document_chunks
  where
    (filter_doc_id is null or document_id = filter_doc_id)
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;

-- Enable RLS
alter table documents enable row level security;
alter table document_chunks enable row level security;

-- Allow all operations (for demo purposes)
create policy "Allow all" on documents for all using (true);
create policy "Allow all" on document_chunks for all using (true);
```

Also create a **Storage bucket** named `pdfs` in your Supabase dashboard (Storage → New Bucket → name: `pdfs`, public: off).

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| AI | OpenAI GPT-4o + text-embedding-3-small |
| Database | Supabase (PostgreSQL + pgvector) |
| Storage | Supabase Storage |
| PDF Parsing | pdf-parse |
| Theming | next-themes |
| Deployment | Vercel |

## Project Structure

```
app/
├── layout.tsx              # Root layout with ThemeProvider
├── page.tsx                # Main chat page
└── api/
    ├── upload/route.ts     # PDF upload + processing
    ├── chat/route.ts       # RAG chat with streaming
    ├── documents/route.ts  # List documents
    └── documents/[id]/route.ts  # Delete document
components/
├── chat/                   # ChatInterface, MessageBubble, SourceCitations
├── upload/                 # DropZone
├── documents/              # DocumentList
└── ui/                     # shadcn/ui components
lib/
├── supabase.ts             # Supabase client
├── openai.ts               # OpenAI client + embedding
├── pdf-processor.ts        # Parse → chunk → embed → store
└── text-splitter.ts        # Recursive character splitter
types/
└── index.ts                # TypeScript interfaces
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT
