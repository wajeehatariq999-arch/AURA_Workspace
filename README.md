## Python runtime

AURA Phase 3 targets **CPython 3.14.x**. On Windows use `py -3.14 -m venv .venv` before installing `requirements.txt`.

# AURA — AI Unified Business Operations Assistant

Final Phase 3 build: a FastAPI + SQLAlchemy business platform with real Groq agentic orchestration, business-scoped RAG, controlled memory, human approvals, audit logging and a premium responsive UI.

## Stack

- Python / FastAPI
- HTML / CSS / JavaScript
- SQLite / SQLAlchemy
- Groq for agentic LLM reasoning
- Sentence Transformers + ChromaDB for local RAG
- PDF / DOCX / TXT ingestion
- JWT in HttpOnly cookies + CSRF protection

## Setup

```bash
python -m venv .venv
# Windows
.venv\\Scripts\\activate
# macOS/Linux
source .venv/bin/activate
pip install -r requirements.txt
```

Create `.env` from `.env.example` and replace at minimum:

```env
SECRET_KEY=<long-random-secret>
GROQ_API_KEY=<your-real-groq-key>
```

For a public HTTPS deployment also set:

```env
COOKIE_SECURE=true
ALLOWED_ORIGINS=https://your-domain.example
```

Initialize the real database and editable demo data:

```bash
python seed.py
```

Run:

```bash
python run.py
```

Open `http://127.0.0.1:8000`.

API documentation is available at `/docs` in development.

## Demo accounts

Owner:

```text
owner@aurademo.local
ChangeMe-123!
```

Staff:

```text
staff@aurademo.local
ChangeMe-123!
```

Customer:

```text
customer@aurademo.local
ChangeMe-123!
```

Change demo credentials before public deployment.

## Product imagery

`seed.py` generates non-private demo catalog imagery and associates it with real `ProductImage` database records. Uploaded runtime images remain ignored by Git.

## Phase 3 UI

The premium UI includes:

- SaaS landing page
- Sign in / sign up
- Responsive business dashboard
- Product catalog and product management
- Secure product image management
- Inventory
- Orders and customer order view
- Supplier management
- Analytics
- AI Command Center
- Real agent workflow/evidence presentation
- Admin-only RAG Knowledge Base
- Human Approval Center
- Agent Activity
- Security & Audit
- Business Settings and team management
- Profile
- Loading/error/empty/pending states
- Desktop/tablet/mobile layouts

## Agent architecture

```text
User request
   ↓
Manager / Orchestrator
   ↓
Dynamic specialist selection
   ├── Customer Support Agent
   ├── Order Agent
   ├── Inventory Agent
   ├── Supplier Agent
   └── Analytics Agent
   ↓
Authorized database/RAG tools
   ↓
Specialist findings
   ↓
Evidence evaluator
   ↓
Manager synthesis
   ↓
Human approval when required
   ↓
Grounded final response
```

The frontend displays the returned workflow. It does not invent agent activity.

## RAG

```text
Admin uploads PDF/DOCX/TXT
        ↓
Secure storage + database metadata
        ↓
Text extraction
        ↓
Cleaning / chunking
        ↓
Local Sentence Transformer embeddings
        ↓
Persistent ChromaDB collection scoped to business
        ↓
Semantic retrieval
        ↓
Agent tool context
        ↓
Grounded response with source metadata
```

Only owner/admin users can manage the knowledge base. Retrieval is scoped to the authenticated business.

## Memory

Conversation records and controlled agent memories are stored with both `business_id` and `user_id`. A user's memory is not available to another user or another business.

## Approval workflow

Important actions such as supplier requests can be proposed by agents but are not silently executed.

```text
Agent proposal
   ↓
PENDING APPROVAL
   ↓
Owner/Admin reviews reason + data
   ├── Reject → recorded
   └── Approve → permitted action executes → recorded
```

## Security

- Password hashing
- JWT authentication in HttpOnly cookies
- CSRF protection for state-changing browser requests
- Backend role authorization
- Business-level object isolation
- Secure image/document upload handling
- No secrets in frontend
- No API key in source code
- Admin-only RAG management
- Protected product/document retrieval
- Audit logging
- Safe user-facing error messages
- Git ignore for `.env`, databases and runtime private files

## Testing

```bash
pytest -q
```

The repository includes Phase 1 and Phase 2 tests. A full live AI/RAG test requires the dependencies in `requirements.txt` and a configured `GROQ_API_KEY`.

## Hackathon demo flow

1. Sign in as the demo customer and browse real products/images.
2. Place a small customer order.
3. Open AI Command Center and ask for the order status.
4. Sign in as owner and ask which products need restocking.
5. Ask AURA to prepare a supplier request.
6. Show the actual Manager → Inventory → Supplier workflow.
7. Open Approval Center and approve/reject the real pending request.
8. Open Knowledge Base as owner and upload a return/delivery policy PDF or DOCX.
9. Ask AURA a policy question that requires the uploaded document.
10. Show the source document information in the AI result.
11. Replace the document and re-index it.
12. Ask the question again to demonstrate updated knowledge.
13. Show Analytics, Agent Activity and Security & Audit.

## Troubleshooting

### `GROQ_API_KEY` missing
Set it in `.env`, never in JavaScript or HTML.

### RAG package/import errors
Run:

```bash
pip install -r requirements.txt
```

Sentence Transformers and ChromaDB may download model/runtime assets on first use.

### Demo database already exists
`python seed.py` is idempotent for the demo business and also backfills demo imagery if the products have no images.

### Cookies/authentication issues locally
Use the exact origin from `ALLOWED_ORIGINS`, normally `http://127.0.0.1:8000` or `http://localhost:8000`. For HTTPS production, set `COOKIE_SECURE=true`.

### AI request fails
Check the Groq key, configured model name, network access and the server log. The API returns a safe user-facing error instead of exposing provider exceptions.
