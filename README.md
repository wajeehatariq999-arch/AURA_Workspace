✦ AURA Marketplace

<p align="center">

<strong>{=html}AI-Powered Business & Customer Commerce
Platform</strong>{=html}<br>{=html} <em>{=html}Where intelligent
business operations meet a simple shopping experience.</em>{=html}

</p>

<p align="center">

<a href="https://aura-workspace.fastapicloud.dev">{=html}🌐 Live
Demo</a>{=html} ·
<a href="https://github.com/wajeehatariq999-arch/AURA_Workspace">{=html}💻
GitHub Repository</a>{=html}

</p>

<p align="center">








</p>

🌟 What is AURA Marketplace?

AURA Marketplace is a full-stack AI-powered marketplace and business
operations platform.

It brings two experiences together in one application:

👔 Business Owner --- manages the complete business operation.
🛍️ Customer --- shops, orders products and receives focused AI
assistance.

At the center is AURA AI, which connects authorized business data
with the owner's uploaded knowledge documents to provide useful,
grounded answers.

AURA is not a simple chatbot and not only an online store.

It combines:

E-commerce + Business Operations + AI + RAG + Role-Based Security +
Human Approval

🪄 The AURA Experience

                         ✦ AURA MARKETPLACE ✦
                                  │
                 ┌────────────────┴────────────────┐
                 │                                 │
                 ▼                                 ▼
          👔 BUSINESS OWNER                   🛍️ CUSTOMER
                 │                                 │
        ┌────────┼─────────┐              ┌────────┼─────────┐
        │        │         │              │        │         │
     Products  Orders   Inventory       Browse   Orders    Support
        │        │         │              │        │         │
     Suppliers Analytics Knowledge       Shop    Track    Ask AURA
                         │
                         ▼
                  📚 OWNER FILES
                  PDF / DOCX / TXT
                         │
                         ▼
                    🔎 RAG SEARCH
                         │
                         ▼
                    🤖 AURA AI
                         │
                         ▼
                Short, Relevant Answer

🧭 Table of Contents

✨ Core Idea

👔 Business Owner Experience

🛍️ Customer Experience

🤖 AURA AI

📚 Owner Knowledge Base

🔐 Security & Privacy

✅ Approval Workflow

🧠 RAG Architecture

🏗️ System Architecture

🧰 Technology Stack

📁 Project Structure

🚀 Run Locally

🌐 Deployment

🎬 Mentor Demo Flow

🎯 Project Highlights

💡 Core Idea

AURA Marketplace is built around a simple rule:

AI should answer from information it is actually authorized to
use.

The AI does not need to answer every question in the world.

Instead, it focuses on:

Products

Orders

Inventory

Suppliers

Business analytics

Store policies

Owner-uploaded documents

Customer support

If a question is unrelated to the marketplace or business, AURA politely
tells the user that it is outside the application's scope.

This keeps the assistant:

Focused · Useful · Predictable · Business-aware

👔 Business Owner Experience

The Business Owner gets a complete operations workspace.

🏠 Dashboard

The owner can quickly see:

Total orders

Revenue

Product count

Low-stock alerts

Recent orders

Business activity

Operational warnings

The dashboard is connected to real application data.

🛍️ Product Management

The owner can:

Add products

Edit products

Create/manage categories

Set prices

Manage stock

Add product images

Maintain the customer-facing catalog

Changes made to the catalog are reflected in the marketplace experience.

📦 Inventory

AURA helps the owner monitor stock levels.

Example AI question:

"Which products need restocking?"

AURA checks the available inventory information and provides a focused
answer.

🧾 Orders

The owner can:

View customer orders

Check order status

Review order details

Monitor recent orders

Understand order activity

Example:

"What is the current order situation?"

AURA can use current business order information to answer.

🚚 Suppliers

The owner can manage:

Supplier name

Contact person

Email

Phone

Address

Supplier-related operations can also be connected with inventory needs
and approval workflows.

📊 Analytics

The owner can review business information such as:

Orders

Revenue

Product activity

Inventory conditions

Operational trends

The purpose is to turn stored business data into understandable business
insight.

📚 Knowledge Base

The owner can upload business documents such as:

Return policies

Delivery policies

Refund rules

Product information

Store FAQs

Business procedures

Supported formats:

PDF · DOCX · TXT

These documents become part of AURA's searchable business knowledge.

🤖 AURA AI

AURA AI is the intelligent layer connecting the marketplace and business
operations.

How an AI question works

User asks a question
        │
        ▼
   AURA Manager
        │
        ▼
Identify the relevant business area
        │
   ┌────┼─────┬────────┐
   ▼    ▼     ▼        ▼
Orders Products Inventory Knowledge
   │    │     │        │
   └────┴─────┴────────┘
              │
              ▼
      Authorized Evidence
              │
              ▼
        AI Response
              │
              ▼
       Short + Relevant

🎯 AI Scope

AURA is intentionally not a general-purpose chatbot.

✅ Questions AURA should answer

Owner: - "Which products are low in stock?" - "How many orders do we
have?" - "What is the current order situation?" - "Which products need
attention?" - "What does our uploaded return policy say?"

Customer: - "What is the price of this product?" - "Is this product
available?" - "What is my latest order?" - "What is my order status?" -
"What is the return policy?"

🚫 Questions outside AURA

For unrelated questions, AURA responds politely instead of producing
unrelated information.

Example:

"Sorry, this question isn't related to the AURA Marketplace or its
business information. I can help with products, orders, store policies
and other marketplace-related questions."

The same scope rule applies to both customers and owners.

📚 Owner Knowledge → Customer Answer

This is one of the key features of AURA Marketplace.

OWNER
  │
  │ uploads
  ▼
PDF / DOCX / TXT
  │
  ▼
Document Processing
  │
  ▼
Semantic Index
  │
  ▼
ChromaDB
  │
  │ retrieves relevant information
  ▼
AURA AI
  │
  ▼
CUSTOMER QUESTION
  │
  ▼
Simple answer based on the owner's information

Example

The owner uploads:

Return_Policy.pdf

The document says customers can return eligible products within the
store's defined return period.

Customer asks:

"What is your return policy?"

AURA searches the owner's knowledge and gives a short answer based on
the uploaded policy.

It does not need to invent a policy.

🧠 RAG Architecture

AURA uses Retrieval-Augmented Generation (RAG).

Document
   ↓
Text Extraction
   ↓
Cleaning & Chunking
   ↓
Sentence Transformer
   ↓
Embeddings
   ↓
ChromaDB
   ↓
Semantic Retrieval
   ↓
Relevant Context
   ↓
Groq AI
   ↓
Grounded Response

This allows the AI to work with information supplied by the business
rather than relying only on general model knowledge.

🛍️ Customer Experience

The customer side is designed as a clean marketplace experience.

01 --- Create an Account

Customers can create their own account.

They do not need an owner-created account.

02 --- Browse the Marketplace

Customers can explore products such as:

👕 Clothes

👟 Shoes

💍 Jewellery

👜 Bags

🧴 Body care

🏠 Home products

🎧 Electronics

🎁 Gift products

Product images, prices and availability are shown through the
marketplace catalog.

03 --- Place an Order

Customer flow:

Browse
  ↓
Select Product
  ↓
View Details
  ↓
Place Order
  ↓
Order Saved
  ↓
Track Order

04 --- Ask AURA

Customers can ask about:

Products

Prices

Availability

Their orders

Store policies

Delivery information

Other marketplace-related information

🔒 Customer Privacy

AURA protects customer-specific information.

A customer can access:

Their own order information

but not another customer's private orders.

Customer A
   │
   └──► Own Orders ✅

Customer A
   │
   └──► Customer B Orders ❌

This restriction is implemented at the backend level rather than simply
hiding information in the interface.

🔐 Security & Privacy

AURA includes multiple security layers.

Authentication

Password hashing

JWT/session-style authentication

HttpOnly authentication cookie

CSRF token protection

Authorization

Role-based access for:

Owner

Admin

Staff

Customer

Data isolation

Business data is scoped to the authenticated business.

Customer order information is scoped to the authenticated customer.

Knowledge protection

Owner-uploaded documents are protected and retrieved according to
business authorization.

Audit

Important business activity can be recorded for traceability.

✅ Approval Workflow

AURA supports human-in-the-loop business automation.

AI can prepare an action, but important actions can require owner/admin
approval.

AI identifies action
       ↓
Creates proposal
       ↓
   PENDING
       ↓
Owner/Admin reviews
    ↙       ↘
APPROVE    REJECT
   ↓          ↓
Execute     Stop
   ↓
Audit Record

This gives the business owner final control.

🧩 Agent Architecture

AURA uses a manager/specialist approach.

                 USER
                  │
                  ▼
        ┌──────────────────┐
        │   AURA MANAGER   │
        └────────┬─────────┘
                 │
       ┌─────────┼─────────┐
       ▼         ▼         ▼
   Customer    Orders   Inventory
   Support                │
       │         │        │
       └─────────┼────────┘
                 ▼
            Suppliers
                 │
                 ▼
             Analytics
                 │
                 ▼
       Authorized Tools/Data

The idea is to use the right business capability for the question,
rather than treating every request as the same type of conversation.

🏗️ System Architecture

┌─────────────────────────────────────────────┐
│              AURA MARKETPLACE               │
├─────────────────────────────────────────────┤
│                                             │
│  Frontend                                   │
│  HTML + CSS + JavaScript                    │
│                 │                           │
│                 ▼                           │
│  FastAPI Backend                            │
│                 │                           │
│       ┌─────────┼──────────┐                │
│       ▼         ▼          ▼                │
│   Business    Auth       AI/RAG             │
│   APIs        APIs       Services            │
│       │                    │                │
│       ▼                    ▼                │
│   SQLAlchemy          ChromaDB              │
│       │              + Embeddings            │
│       ▼                    │                │
│     SQLite                Groq              │
│                                             │
└─────────────────────────────────────────────┘

🗄️ Main Data Areas

AURA manages multiple types of application data:

Area           Purpose

Users          Authentication and roles
Businesses     Business ownership/isolation
Categories     Marketplace organization
Products       Product catalog
Inventory      Stock management
Orders         Customer purchases
Suppliers      Supplier network
Documents      Owner knowledge
Vector Store   Semantic document retrieval
Approvals      Human-in-the-loop actions
Agent Runs     AI execution history
Audit Logs     Security and traceability

🧰 Technology Stack

Layer                Technology

🐍 Backend           Python
⚡ API               FastAPI
🎨 Frontend          HTML, CSS, JavaScript
🗃️ Database          SQLite
🔗 ORM               SQLAlchemy
🤖 AI                Groq
🔎 Embeddings        Sentence Transformers
🧠 Vector Database   ChromaDB
📄 Documents         PDF / DOCX / TXT
🔐 Authentication    JWT + HttpOnly Cookies
🛡️ CSRF              CSRF Tokens
☁️ Deployment        FastAPI Cloud

📁 Project Structure

AURA/
│
├── app/
│   ├── api/
│   │   ├── auth.py
│   │   ├── products.py
│   │   ├── orders.py
│   │   ├── suppliers.py
│   │   ├── insights.py
│   │   └── ...
│   │
│   ├── services/
│   │   ├── agentic.py
│   │   ├── rag.py
│   │   └── ...
│   │
│   ├── models.py
│   ├── database.py
│   ├── config.py
│   └── main.py
│
├── frontend/
│   ├── static/
│   │   ├── css/
│   │   └── js/
│   │
│   └── templates/
│
├── data/
│   ├── documents/
│   ├── product_images/
│   └── vector_store/
│
├── requirements.txt
├── run.py
├── seed.py
├── .env.example
└── README.md

🚀 Run Locally

1. Create the virtual environment

Windows

py -3.14 -m venv .venv
.venv\Scripts\activate

2. Install dependencies

pip install -r requirements.txt

3. Configure environment

Create .env using .env.example.

Example:

SECRET_KEY=your-long-random-secret
GROQ_API_KEY=your-groq-api-key

⚠️ Never commit .env or API keys to a public repository.

4. Seed the application

python seed.py

5. Start the server

python run.py

Open:

http://127.0.0.1:8000

FastAPI API documentation:

http://127.0.0.1:8000/docs

🌐 Live Deployment

✦ AURA Marketplace

Live Application

https://aura-workspace.fastapicloud.dev

GitHub

https://github.com/wajeehatariq999-arch/AURA_Workspace

The application is deployed as a real FastAPI web application rather
than a notebook or Streamlit prototype.

🎬 Mentor Demo --- Recommended Flow

A mentor can understand the complete project quickly using this
sequence.

👔 Part 1 --- Business Owner

Step 1

Sign in as the Business Owner.

Step 2

Show the dashboard:

Orders

Revenue

Products

Low stock

Recent orders

Step 3

Open:

Products → Inventory → Orders → Suppliers → Analytics

This demonstrates the business management side.

Step 4

Open:

Knowledge Base

Upload a sample policy/document.

Step 5

Open:

Ask AURA

Ask:

"Which products need restocking?"

Then:

"What is the current order situation?"

Then ask a question based on the uploaded document.

Step 6

Show:

Approval Center → Agent Activity → Security & Audit

This demonstrates AI governance and traceability.

🛍️ Part 2 --- Customer

Step 1

Sign out.

Step 2

Create a customer account.

Step 3

Browse the marketplace.

Step 4

Open a product and place an order.

Step 5

Ask AURA:

"What is my latest order?"

Then:

"What is the price of this product?"

Then ask a question based on the store policy uploaded by the owner.

Step 6

Ask an unrelated question.

AURA should politely explain that it only handles
marketplace/business-related questions.

🧪 Testing

Run the test suite with:

pytest -q

For AI/RAG testing, configure a valid:

GROQ_API_KEY=...

🎯 Project Highlights

🛍️ Full Marketplace

A real customer-facing product and order experience.

👔 Business Operations

Products, inventory, suppliers, orders and analytics in one workspace.

🤖 Focused AI

AURA answers marketplace/business questions instead of acting as an
unrestricted chatbot.

📚 Owner-Grounded Knowledge

Uploaded PDF/DOCX/TXT files become searchable business knowledge.

🔎 RAG

Semantic retrieval connects owner documents to relevant AI answers.

🔐 Secure Roles

Owner, Admin, Staff and Customer access are separated.

🧾 Customer Privacy

Customers can access their own order information without exposing
another customer's data.

✅ Human Approval

Important AI-generated actions can require owner/admin approval.

📝 Auditability

Business actions and AI activity can be tracked.

🌐 Real Deployment

AURA runs as a deployed FastAPI application.

💎 Why AURA Marketplace?

Most simple e-commerce projects stop at:

Products → Cart → Order

Most simple AI projects stop at:

Question → Chatbot Answer

AURA Marketplace combines both.

             🛍️ CUSTOMER
                  │
             Shopping
                  │
                  ▼
             🧾 Orders
                  │
                  ▼
        ┌──────────────────┐
        │  AURA MARKETPLACE│
        └──────────────────┘
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
 👔 BUSINESS             🤖 AI
 OPERATIONS              ASSISTANT
        │                   │
        ▼                   ▼
 Products              Knowledge Base
 Inventory             RAG
 Suppliers             Business Data
 Analytics             Focused Answers
 Approvals             Human Control
        │                   │
        └─────────┬─────────┘
                  ▼
          🔐 SECURE PLATFORM

🌱 Future Expansion

AURA Marketplace is structured so it can grow into additional
capabilities such as:

Advanced recommendation systems

More payment integrations

Delivery/shipping integrations

Customer notifications

More detailed analytics

Multi-business support

Additional AI specialist agents

Automated business reports

More document formats

Richer customer support workflows

🏁 Final Summary

AURA Marketplace

An AI-powered marketplace where customers shop simply, business
owners manage intelligently, and AI answers from authorized business
knowledge.

AURA demonstrates the integration of:

Full-Stack Development · E-Commerce · Business Operations · AI · RAG ·
Vector Search · Authentication · Authorization · Privacy ·
Human-in-the-Loop Automation · Analytics · Deployment

<p align="center">

<strong>{=html}✦ AURA Marketplace ✦</strong>{=html}<br>{=html}
<em>{=html}Shop simply. Manage intelligently. Ask AURA.</em>{=html}

</p>

<p align="center">

Built with Python · FastAPI · JavaScript · SQLite · Groq · ChromaDB

</p>