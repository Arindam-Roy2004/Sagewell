# Sagewell

Chat with your own documents. Upload a file, paste some text, or add a web page, then ask questions. Sagewell answers using only your sources and points to the passages it used.

---

## Features

- **Multiple source types:** PDF, DOCX, TXT, CSV, pasted text, and web pages.
- **Grounded chat:** answers stream in word by word, with citations to the source passages.
- **Retrieval:** keyword search (BM25) and meaning search (vectors) combined, then re-ranked.
- **Workspace:** rename, pin, and delete chats and sources.
- **Memory:** remembers durable facts about the user across chats (optional Neo4j graph).
- **Auth:** JWT login, password hashing, input validation, rate limiting, and security headers.

---

## Tech stack

| Layer | Tech |
|-------|------|
| Frontend | React + Vite, Zustand, Tailwind CSS, Radix UI |
| API | Bun + Express 5 |
| Worker | Node + BullMQ (background jobs) |
| Data | MongoDB (Mongoose), Qdrant (vectors), Redis (queues), Neo4j (optional memory graph) |
| File storage | S3 / Cloudflare R2 |
| AI | Google Gemini (AI SDK Google provider), LangChain.js |

---

## How it works

```
Browser ──▶ API (backend/src) ──▶ Redis queue ──▶ Worker (backend/worker)
   ▲            │                                   │
   │            ├── MongoDB   (users, chats, chunks)│
   │            ├── S3 / R2   (uploaded files) ◀────┤
   │            ├── Qdrant    (search index)  ◀─────┘
   │            └── Gemini    (answers, summaries, embeddings)
   └── streamed answer
```

1. **Upload:** the browser sends the file straight to storage, then the API queues a processing job.
2. **Process:** the worker reads the file, splits it into chunks, stores the chunks, creates embeddings for search, and writes a title and summary.
3. **Ask:** the API searches the chunks, builds a prompt from the best passages, and streams the answer back.

---

## Run locally

You need [Bun](https://bun.sh), Node 18+, and running MongoDB, Redis, and Qdrant. Neo4j and S3/R2 are optional.

```bash
# 1) Backend API
cd backend
bun install
cp .env.example .env     # then fill in your keys
bun run dev              # http://localhost:8080

# 2) Worker (a second terminal). Required, or sources stay "processing".
# No separate install: locally it shares backend/node_modules from step 1.
# (Do NOT run npm install inside backend/worker; two copies of the AI SDK would break the
# Gemini setup. worker/package.json is only used by the Docker image.)
cd backend/worker
node index.js

# 3) Frontend (a third terminal)
cd frontend
npm install
npm run dev              # http://localhost:5173
```

All settings are listed in [`backend/.env.example`](backend/.env.example) and [`frontend/.env.example`](frontend/.env.example). The API checks the required variables at startup and stops with a message naming any that are missing.

---

## Usage

1. Sign up, then add sources (upload a file, paste text, or add a URL).
2. Wait for processing to finish. Each source gets a title and summary.
3. Select sources and ask a question. The answer streams in with citations.
4. Rename, pin, or delete chats and sources from their menus.
