# 🧠 RAG Document Intelligence Chat

> AI-powered document Q&A — upload PDFs, ask questions, get cited answers using retrieval-augmented generation.

[![Live Demo](https://img.shields.io/badge/demo-live-brightgreen?style=flat-square)](https://nackin-rag-doc-chat.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=flat-square&logo=openai&logoColor=white)](https://openai.com)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com)
[![Vercel](https://img.shields.io/badge/Vercel-000?style=flat-square&logo=vercel)](https://vercel.com)

> ⚠️ **Demo Version** — Based on a production system built for a real client. Sensitive data and proprietary business logic have been removed.

---

![App Screenshot](./public/screenshot.png)

---

## ✨ Features

- 📄 **PDF Upload** — Drag & drop with progress indicator, validation, and Supabase Storage
- 🔍 **RAG Pipeline** — Parse → Chunk → Embed → Store → Retrieve with pgvector similarity search
- 💬 **Streaming Chat** — Real-time AI responses with typewriter effect and conversation history
- 📎 **Source Citations** — Expandable citation chips showing matched document chunks with similarity scores
- 🌗 **Dark Mode** — System-aware theme toggle persisted in localStorage
- 📱 **Responsive** — Mobile-first design with collapsible sidebar
- 🗂️ **Multi-Document** — Chat with a specific document or across all uploads

---

## 🏗 Architecture

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
2. **Process** — `pdf-parse` extracts text; a recursive character splitter creates overlapping chunks (1000 chars, 200 overlap)
3. **Embed** — Each chunk is embedded via OpenAI `text-embedding-3-small` (1536 dimensions)
4. **Store** — Chunks + embeddings stored in Supabase with pgvector
5. **Query** — User message is embedded; pgvector finds top 5 similar chunks via cosine distance
6. **Answer** — GPT-4o generates a streaming answer grounded in retrieved context with source citations

---

## 🛠 Tech Stack

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

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- [Supabase](https://supabase.com) project (free tier works)
- [OpenAI API key](https://platform.openai.com/api-keys)

### 1. Clone & Install

```bash
git clone https://github.com/nackin-io/nackin-rag-doc-chat.git
cd nackin-rag-doc-chat
npm install
```

### 2. Environment Variables

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

Run this SQL in your Supabase SQL Editor:

```sql
create extension if not exists vector;

create table documents (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  size integer,
  status text default 'processing',
  created_at timestamptz default now()
);

create table document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references documents(id) on delete cascade,
  content text not null,
  embedding vector(1536),
  chunk_index integer,
  created_at timestamptz default now()
);

create or replace function match_chunks(
  query_embedding vector(1536),
  match_threshold float default 0.7,
  match_count int default 5,
  filter_doc_id uuid default null
)
returns table (id uuid, document_id uuid, content text, similarity float)
language sql stable as $$
  select id, document_id, content,
    1 - (embedding <=> query_embedding) as similarity
  from document_chunks
  where
    (filter_doc_id is null or document_id = filter_doc_id)
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding limit match_count;
$$;

alter table documents enable row level security;
alter table document_chunks enable row level security;
create policy "Allow all" on documents for all using (true);
create policy "Allow all" on document_chunks for all using (true);
```

Create a **Storage bucket** named `pdfs` (Storage → New Bucket → public: off).

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
app/
├── layout.tsx
├── page.tsx
└── api/
    ├── upload/route.ts
    ├── chat/route.ts
    ├── documents/route.ts
    └── documents/[id]/route.ts
components/
├── chat/
├── upload/
├── documents/
└── ui/
lib/
├── supabase.ts
├── openai.ts
├── pdf-processor.ts
└── text-splitter.ts
types/
└── index.ts
```

---

## 📄 License

MIT

---

> Built by [**Nackin**](https://nackin.io) — AI Engineering & Full-Stack Development Studio
